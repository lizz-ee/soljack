use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod username_registry {
    use super::*;

    pub fn claim_username(ctx: Context<ClaimUsername>, username: String) -> Result<()> {
        // Validate username
        require!(username.len() >= 3 && username.len() <= 20, ErrorCode::InvalidUsername);
        require!(
            username.chars().all(|c| c.is_alphanumeric()),
            ErrorCode::InvalidUsername
        );

        let username_lowercase = username.to_lowercase();

        // Initialize username account
        let username_account = &mut ctx.accounts.username_account;
        username_account.owner = ctx.accounts.user.key();
        username_account.username = username_lowercase.clone();
        username_account.created_at = Clock::get()?.unix_timestamp;
        username_account.bump = ctx.bumps.username_account;

        // Initialize wallet account
        let wallet_account = &mut ctx.accounts.wallet_account;
        wallet_account.owner = ctx.accounts.user.key();
        wallet_account.username = username_lowercase;
        wallet_account.bump = ctx.bumps.wallet_account;

        // Transfer $1 USD equivalent in SOL to fee destination
        // For now, use fixed amount (assuming 1 SOL = $100)
        let fee_lamports: u64 = 10_000_000; // 0.01 SOL (~$1 at $100/SOL)

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.fee_destination.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, fee_lamports)?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct ClaimUsername<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + 20 + 8 + 1, // discriminator + pubkey + string len + max string + i64 + u8
        seeds = [b"username", username.to_lowercase().as_bytes()],
        bump
    )]
    pub username_account: Account<'info, UsernameAccount>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + 20 + 1, // discriminator + pubkey + string len + max string + u8
        seeds = [b"wallet", user.key().as_ref()],
        bump
    )]
    pub wallet_account: Account<'info, WalletAccount>,

    /// CHECK: Fee destination wallet
    #[account(mut)]
    pub fee_destination: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct UsernameAccount {
    pub owner: Pubkey,        // 32
    pub username: String,     // 4 + 20
    pub created_at: i64,      // 8
    pub bump: u8,             // 1
}

#[account]
pub struct WalletAccount {
    pub owner: Pubkey,        // 32
    pub username: String,     // 4 + 20
    pub bump: u8,             // 1
}

#[error_code]
pub enum ErrorCode {
    #[msg("Username must be 3-20 alphanumeric characters")]
    InvalidUsername,
    #[msg("Username already taken")]
    UsernameTaken,
    #[msg("Wallet already has a username")]
    WalletAlreadyHasUsername,
}