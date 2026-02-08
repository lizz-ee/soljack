use anchor_lang::prelude::*;
use solana_program::hash::hash;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT");

const PROTOCOL_FEE: u64 = 1_000_000; // 0.001 SOL per player

#[program]
pub mod soljack_game {
    use super::*;

    pub fn create_table(ctx: Context<CreateTable>, bet_amount: u64, role: Role, table_seed: u64) -> Result<()> {
        // Validate bet tier
        let valid_tiers = [
            10_000_000,   // 0.01 SOL
            50_000_000,   // 0.05 SOL
            100_000_000,  // 0.1 SOL
            250_000_000,  // 0.25 SOL
            500_000_000,  // 0.5 SOL
            1_000_000_000, // 1 SOL
        ];
        require!(valid_tiers.contains(&bet_amount), ErrorCode::InvalidBetAmount);

        let table = &mut ctx.accounts.table_account;
        table.table_id = table_seed;
        table.bet_amount = bet_amount;
        table.creator = ctx.accounts.creator.key();
        table.creator_role = role;
        table.opponent = None;
        table.state = TableState::Open;
        table.created_at = Clock::get()?.unix_timestamp;
        table.deck = Vec::new();
        table.deck_index = 0;
        table.creator_hand = Vec::new();
        table.opponent_hand = Vec::new();
        table.creator_total = 0;
        table.opponent_total = 0;
        table.current_turn = None;
        table.turn_deadline = 0;
        table.hand_number = 0;
        table.creator_commitment = None;
        table.opponent_commitment = None;
        table.creator_seed_revealed = None;
        table.opponent_seed_revealed = None;
        table.bump = ctx.bumps.table_account;

        Ok(())
    }

    pub fn join_table(ctx: Context<JoinTable>) -> Result<()> {
        let table = &mut ctx.accounts.table_account;
        
        require!(table.state == TableState::Open, ErrorCode::TableNotOpen);
        require!(table.opponent.is_none(), ErrorCode::TableFull);

        // Escrow funds from both players
        let total_escrow = table.bet_amount + PROTOCOL_FEE;

        // Transfer from opponent
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.opponent.to_account_info(),
                to: ctx.accounts.table_account.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, total_escrow)?;

        // Transfer from creator
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.table_account.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, total_escrow)?;

        // Send protocol fees to destination
        let fee_total = PROTOCOL_FEE * 2;
        **ctx.accounts.table_account.to_account_info().try_borrow_mut_lamports()? -= fee_total;
        **ctx.accounts.fee_destination.try_borrow_mut_lamports()? += fee_total;

        table.opponent = Some(ctx.accounts.opponent.key());
        table.state = TableState::Committing;

        Ok(())
    }

    pub fn submit_commitment(ctx: Context<SubmitCommitment>, commitment: [u8; 32]) -> Result<()> {
        let table = &mut ctx.accounts.table_account;
        
        require!(table.state == TableState::Committing, ErrorCode::InvalidState);

        let player = ctx.accounts.player.key();
        
        if player == table.creator {
            require!(table.creator_commitment.is_none(), ErrorCode::AlreadyCommitted);
            table.creator_commitment = Some(commitment);
        } else if Some(player) == table.opponent {
            require!(table.opponent_commitment.is_none(), ErrorCode::AlreadyCommitted);
            table.opponent_commitment = Some(commitment);
        } else {
            return Err(ErrorCode::NotTableParticipant.into());
        }

        Ok(())
    }

    pub fn reveal_seed(ctx: Context<RevealSeed>, seed: [u8; 32]) -> Result<()> {
        let table = &mut ctx.accounts.table_account;
        
        require!(table.state == TableState::Committing, ErrorCode::InvalidState);

        let player = ctx.accounts.player.key();
        let commitment_hash = hash(&seed).to_bytes();

        if player == table.creator {
            require!(
                table.creator_commitment == Some(commitment_hash),
                ErrorCode::CommitmentMismatch
            );
            table.creator_seed_revealed = Some(seed);
        } else if Some(player) == table.opponent {
            require!(
                table.opponent_commitment == Some(commitment_hash),
                ErrorCode::CommitmentMismatch
            );
            table.opponent_seed_revealed = Some(seed);
        } else {
            return Err(ErrorCode::NotTableParticipant.into());
        }

        // If both seeds revealed, generate deck and start hand
        if table.creator_seed_revealed.is_some() && table.opponent_seed_revealed.is_some() {
            generate_and_shuffle_deck(table)?;
            deal_initial_cards(table)?;
            table.state = TableState::Active;
            table.current_turn = Some(Role::Player);
            table.turn_deadline = Clock::get()?.unix_timestamp + 60;
            table.hand_number = 1;
        }

        Ok(())
    }

    pub fn hit(ctx: Context<PlayAction>) -> Result<()> {
        let table = &mut ctx.accounts.table_account;
        
        require!(table.state == TableState::Active, ErrorCode::InvalidState);
        require!(table.current_turn.is_some(), ErrorCode::NotYourTurn);

        let player_role = get_player_role(table, ctx.accounts.player.key())?;
        require!(table.current_turn == Some(player_role), ErrorCode::NotYourTurn);

        // Deal card to current player
        let card = deal_card(table)?;

        if player_role == Role::Player {
            table.opponent_hand.push(card);
            table.opponent_total = calculate_hand_value(&table.opponent_hand);
            
            if table.opponent_total > 21 {
                // Bust - end turn
                table.current_turn = Some(Role::Dealer);
            }
        } else {
            table.creator_hand.push(card);
            table.creator_total = calculate_hand_value(&table.creator_hand);
            
            if table.creator_total > 21 {
                // Dealer bust - settle hand
                table.state = TableState::Settled;
            }
        }

        table.turn_deadline = Clock::get()?.unix_timestamp + 60;

        Ok(())
    }

    pub fn stand(ctx: Context<PlayAction>) -> Result<()> {
        let table = &mut ctx.accounts.table_account;
        
        require!(table.state == TableState::Active, ErrorCode::InvalidState);
        
        let player_role = get_player_role(table, ctx.accounts.player.key())?;
        require!(table.current_turn == Some(player_role), ErrorCode::NotYourTurn);

        if player_role == Role::Player {
            // Player stands, dealer's turn
            table.current_turn = Some(Role::Dealer);
            table.turn_deadline = Clock::get()?.unix_timestamp + 60;
        } else {
            // Dealer stands, settle hand
            table.state = TableState::Settled;
        }

        Ok(())
    }
}

// Helper functions
fn generate_and_shuffle_deck(table: &mut TableAccount) -> Result<()> {
    let creator_seed = table.creator_seed_revealed.ok_or(ErrorCode::InvalidState)?;
    let opponent_seed = table.opponent_seed_revealed.ok_or(ErrorCode::InvalidState)?;
    
    let mut combined = Vec::new();
    combined.extend_from_slice(&creator_seed);
    combined.extend_from_slice(&opponent_seed);
    combined.extend_from_slice(&table.table_id.to_le_bytes());
    
    let final_seed = hash(&combined).to_bytes();

    // Create and shuffle deck using Fisher-Yates
    let mut deck: Vec<u8> = (1..=52).collect();
    
    for i in (1..52).rev() {
        let j = (final_seed[i % 32] as usize) % (i + 1);
        deck.swap(i, j);
    }

    // Map to card values (2-11)
    table.deck = deck.iter().map(|&card| {
        let value = (card - 1) % 13 + 1;
        if value == 1 { 11 } else if value > 10 { 10 } else { value }
    }).collect();

    table.deck_index = 0;

    Ok(())
}

fn deal_initial_cards(table: &mut TableAccount) -> Result<()> {
    table.opponent_hand = vec![deal_card(table)?, deal_card(table)?];
    table.opponent_total = calculate_hand_value(&table.opponent_hand);

    table.creator_hand = vec![deal_card(table)?, deal_card(table)?];
    table.creator_total = calculate_hand_value(&table.creator_hand);

    Ok(())
}

fn deal_card(table: &mut TableAccount) -> Result<u8> {
    require!(table.deck_index < 52, ErrorCode::DeckExhausted);
    let card = table.deck[table.deck_index as usize];
    table.deck_index += 1;
    Ok(card)
}

fn calculate_hand_value(hand: &Vec<u8>) -> u8 {
    let mut total: u8 = hand.iter().sum();
    let mut aces = hand.iter().filter(|&&card| card == 11).count();

    while total > 21 && aces > 0 {
        total -= 10;
        aces -= 1;
    }

    total
}

fn get_player_role(table: &TableAccount, player: Pubkey) -> Result<Role> {
    if player == table.creator {
        Ok(table.creator_role)
    } else if Some(player) == table.opponent {
        Ok(if table.creator_role == Role::Dealer { Role::Player } else { Role::Dealer })
    } else {
        Err(ErrorCode::NotTableParticipant.into())
    }
}

// Account contexts
#[derive(Accounts)]
#[instruction(bet_amount: u64, role: Role, table_seed: u64)]
pub struct CreateTable<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + 8 + 8 + 32 + 1 + 33 + 1 + 8 + 4 + 52 + 1 + 4 + 21 + 4 + 21 + 1 + 1 + 33 + 8 + 4 + 33 + 33 + 33 + 33 + 1,
        seeds = [b"table", &table_seed.to_le_bytes()],
        bump
    )]
    pub table_account: Account<'info, TableAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinTable<'info> {
    #[account(mut)]
    pub opponent: Signer<'info>,

    /// CHECK: Creator account
    #[account(mut)]
    pub creator: AccountInfo<'info>,

    #[account(mut)]
    pub table_account: Account<'info, TableAccount>,

    /// CHECK: Fee destination wallet
    #[account(mut)]
    pub fee_destination: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitCommitment<'info> {
    pub player: Signer<'info>,

    #[account(mut)]
    pub table_account: Account<'info, TableAccount>,
}

#[derive(Accounts)]
pub struct RevealSeed<'info> {
    pub player: Signer<'info>,

    #[account(mut)]
    pub table_account: Account<'info, TableAccount>,
}

#[derive(Accounts)]
pub struct PlayAction<'info> {
    pub player: Signer<'info>,

    #[account(mut)]
    pub table_account: Account<'info, TableAccount>,

    /// CHECK: Winner account for payout
    #[account(mut)]
    pub winner: AccountInfo<'info>,
}

// Data structures
#[account]
pub struct TableAccount {
    pub table_id: u64,                              // 8
    pub bet_amount: u64,                            // 8
    pub creator: Pubkey,                            // 32
    pub creator_role: Role,                         // 1
    pub opponent: Option<Pubkey>,                   // 1 + 32
    pub state: TableState,                          // 1
    pub created_at: i64,                            // 8
    pub deck: Vec<u8>,                              // 4 + 52
    pub deck_index: u8,                             // 1
    pub creator_hand: Vec<u8>,                      // 4 + 21
    pub opponent_hand: Vec<u8>,                     // 4 + 21
    pub creator_total: u8,                          // 1
    pub opponent_total: u8,                         // 1
    pub current_turn: Option<Role>,                 // 1 + 32
    pub turn_deadline: i64,                         // 8
    pub hand_number: u32,                           // 4
    pub creator_commitment: Option<[u8; 32]>,       // 1 + 32
    pub opponent_commitment: Option<[u8; 32]>,      // 1 + 32
    pub creator_seed_revealed: Option<[u8; 32]>,    // 1 + 32
    pub opponent_seed_revealed: Option<[u8; 32]>,   // 1 + 32
    pub bump: u8,                                   // 1
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Role {
    Dealer,
    Player,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum TableState {
    Open,
    Committing,
    Active,
    Settled,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid bet amount")]
    InvalidBetAmount,
    #[msg("Table is not open")]
    TableNotOpen,
    #[msg("Table is full")]
    TableFull,
    #[msg("Not your turn")]
    NotYourTurn,
    #[msg("Invalid game state")]
    InvalidState,
    #[msg("Already committed")]
    AlreadyCommitted,
    #[msg("Commitment does not match revealed seed")]
    CommitmentMismatch,
    #[msg("Not a table participant")]
    NotTableParticipant,
    #[msg("Deck exhausted")]
    DeckExhausted,
}