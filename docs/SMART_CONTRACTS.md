# SolJack Smart Contracts

This document describes the on-chain programs that power SolJack's provably fair PvP blackjack.

---

## Architecture Overview

SolJack uses **two separate Anchor programs**:

1. **Username Registry Program** - Handles username claiming and lookups
2. **Game Program** - Manages table lifecycle, deck shuffling, gameplay, and payouts

Both programs are deployed to Solana Mainnet and are the **sole source of truth** for all game state.

---

## 1. Username Registry Program

### Purpose
- Allow users to claim unique usernames for $1 USD-equivalent in SOL
- Enforce case-insensitive uniqueness
- Provide bidirectional wallet ↔ username mapping
- Route minting fees to protocol wallet

### Account Schemas

#### `UsernameAccount` (PDA)
```rust
pub struct UsernameAccount {
    pub owner: Pubkey,           // Wallet that owns this username
    pub username: String,        // Claimed username (stored as lowercase)
    pub created_at: i64,         // Unix timestamp
    pub bump: u8,                // PDA bump seed
}
```

**PDA Seeds:** `["username", username_lowercase.as_bytes()]`

#### `WalletAccount` (PDA)
```rust
pub struct WalletAccount {
    pub owner: Pubkey,           // Wallet address
    pub username: String,        // Associated username
    pub bump: u8,                // PDA bump seed
}
```

**PDA Seeds:** `["wallet", owner.key().as_ref()]`

### Instructions

#### `claim_username`
Mints a new username for the caller.

**Accounts:**
- `user` (signer, mut) - Wallet claiming the username
- `username_account` (init, mut) - PDA for username storage
- `wallet_account` (init, mut) - PDA for wallet → username mapping
- `fee_destination` (mut) - Protocol fee wallet (`7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4`)
- `system_program` - Solana system program

**Arguments:**
- `username: String` - Desired username (letters and numbers only)

**Validation:**
- Username must be 3-20 characters
- Only alphanumeric characters allowed
- Case-insensitive uniqueness check
- Wallet can only claim one username (ever)

**Payment:**
- Transfers $1 USD-equivalent in SOL to `fee_destination`
- Uses Pyth or Switchboard price oracle for SOL/USD conversion

**Errors:**
- `UsernameTaken` - Username already claimed
- `InvalidUsername` - Contains invalid characters or wrong length
- `WalletAlreadyHasUsername` - Wallet already owns a username

#### `lookup_username`
Read-only instruction to fetch username for a wallet.

**Accounts:**
- `wallet_account` - PDA to query

**Returns:** Username string or null

#### `lookup_wallet`
Read-only instruction to fetch wallet for a username.

**Accounts:**
- `username_account` - PDA to query

**Returns:** Wallet pubkey or null

---

## 2. Game Program

### Purpose
- Manage table creation, joining, and lifecycle
- Implement commit-reveal deck shuffling
- Enforce blackjack rules and turn order
- Escrow native SOL and distribute payouts
- Collect protocol fees

### Account Schemas

#### `TableAccount` (PDA)
```rust
pub struct TableAccount {
    pub table_id: u64,               // Unique table ID
    pub bet_amount: u64,             // Bet size in lamports
    pub creator: Pubkey,             // Player who created table
    pub creator_role: Role,          // DEALER or PLAYER
    pub opponent: Option<Pubkey>,    // Second player (null if OPEN)
    pub state: TableState,           // OPEN, COMMITTING, ACTIVE, SETTLED
    pub created_at: i64,             // Unix timestamp
    pub deck: Vec<u8>,               // Shuffled deck (52 cards)
    pub deck_index: u8,              // Next card to deal
    pub creator_hand: Vec<u8>,       // Creator's cards
    pub opponent_hand: Vec<u8>,      // Opponent's cards
    pub creator_total: u8,           // Hand value
    pub opponent_total: u8,          // Hand value
    pub current_turn: Option<Role>,  // Whose turn (DEALER or PLAYER)
    pub turn_deadline: i64,          // Unix timestamp for 60s timer
    pub hand_number: u32,            // Incrementing hand counter
    pub creator_commitment: Option<[u8; 32]>, // Hash of creator's seed
    pub opponent_commitment: Option<[u8; 32]>, // Hash of opponent's seed
    pub creator_seed_revealed: Option<[u8; 32]>, // Creator's revealed seed
    pub opponent_seed_revealed: Option<[u8; 32]>, // Opponent's revealed seed
    pub bump: u8,                    // PDA bump
}
```

**PDA Seeds:** `["table", table_id.to_le_bytes().as_ref()]`

#### `TableState` (Enum)
```rust
pub enum TableState {
    Open,        // Waiting for second player
    Committing,  // Both players submitting commitments
    Active,      // Hand in progress
    Settled,     // Hand complete, awaiting rematch or close
}
```

#### `Role` (Enum)
```rust
pub enum Role {
    Dealer,
    Player,
}
```

### Instructions

#### `create_table`
Creates a new table in OPEN state.

**Accounts:**
- `creator` (signer, mut) - Player creating table
- `table_account` (init, mut) - PDA for table storage
- `system_program`

**Arguments:**
- `bet_amount: u64` - Must match one of the 6 tiers (0.01, 0.05, 0.1, 0.25, 0.5, 1 SOL in lamports)
- `role: Role` - DEALER or PLAYER

**Validation:**
- Creator cannot have another OPEN or ACTIVE table
- Bet amount must be a valid tier

**State:**
- Table starts in `Open` state
- No funds escrowed yet
- 3-minute expiration timer starts

#### `join_table`
Second player joins an OPEN table.

**Accounts:**
- `opponent` (signer, mut) - Player joining
- `creator` (mut) - Original table creator
- `table_account` (mut) - Table to join
- `fee_destination` (mut) - Protocol wallet
- `system_program`

**Validation:**
- Table must be in `Open` state
- Opponent cannot be creator
- Opponent cannot have another OPEN or ACTIVE table
- Opponent must have sufficient balance (bet_amount + 0.001 SOL fee)

**Payment:**
- Opponent transfers `bet_amount + 0.001 SOL` to table PDA (escrowed)
- Creator transfers `bet_amount + 0.001 SOL` to table PDA (escrowed)
- Protocol fees (0.002 SOL total) sent to `fee_destination`

**State Transition:**
- `Open` → `Committing`
- Both players must now submit commitments

#### `submit_commitment`
Player submits hash of their random seed.

**Accounts:**
- `player` (signer) - Creator or opponent
- `table_account` (mut)

**Arguments:**
- `commitment: [u8; 32]` - SHA256 hash of player's secret seed

**Validation:**
- Table must be in `Committing` state
- Player must be creator or opponent
- Player cannot submit twice

**State:**
- Stores commitment in `creator_commitment` or `opponent_commitment`
- When both commitments received → triggers reveal phase

#### `reveal_seed`
Player reveals their secret seed for verification.

**Accounts:**
- `player` (signer)
- `table_account` (mut)

**Arguments:**
- `seed: [u8; 32]` - Player's secret random seed

**Validation:**
- `hash(seed) == stored_commitment`
- 30-second reveal window enforced

**Deck Generation:**
- When both seeds revealed:
  - `final_seed = hash(creator_seed || opponent_seed || table_id)`
  - Use `final_seed` to shuffle 52-card deck deterministically (Fisher-Yates)
  - Store shuffled deck in `table_account.deck`

**Failure Handling:**
- If player doesn't reveal within 30s:
  - Use other player's seed + table_id as fallback
  - Game proceeds normally (no refund)

**State Transition:**
- `Committing` → `Active`
- Deal initial cards (2 to Player face-up, 1 to Dealer face-up + 1 face-down)
- Set `current_turn = Role::Player`

#### `hit`
Player requests another card.

**Accounts:**
- `player` (signer)
- `table_account` (mut)

**Validation:**
- Table must be in `Active` state
- It must be player's turn
- Player's hand must not be bust (< 21)
- 60-second turn timer enforced

**Logic:**
- Deal next card from deck to player's hand
- Update hand total
- If bust (> 21) → auto-stand, dealer's turn
- If not bust → player can hit again or stand

**Deck Reshuffle:**
- If `deck_index >= 52`:
  - Initiate new commit-reveal cycle
  - Pause game for 5 seconds
  - Reshuffle deck with new combined seed
  - Resume gameplay

#### `stand`
Player chooses to end their turn.

**Accounts:**
- `player` (signer)
- `table_account` (mut)

**Validation:**
- Table must be in `Active` state
- It must be player's turn

**Logic:**
- If Player role stands → Dealer's turn begins
- Dealer reveals hole card
- Dealer auto-hits until total >= 17 (S17 rule: stand on soft 17)
- Determine winner and settle

#### `settle_hand`
Resolves hand outcome and distributes payouts.

**Accounts:**
- `table_account` (mut)
- `winner` (mut) - Receives payout (if applicable)
- `creator` (mut)
- `opponent` (mut)

**Validation:**
- Both players have completed their turns
- Hand outcome determined

**Payout Logic:**
- **Player wins:** Opponent's bet → Player
- **Dealer wins:** Player's bet → Dealer
- **Push (tie):** Both players refunded (bet + fee)
- **Blackjack:** Standard 1:1 payout (no 3:2 in v1)

**State Transition:**
- `Active` → `Settled`
- Hand complete, 60s rematch timer starts

#### `rematch`
Both players agree to play another hand.

**Accounts:**
- `player` (signer, mut)
- `table_account` (mut)
- `fee_destination` (mut)

**Validation:**
- Table must be in `Settled` state
- Both players must call `rematch` within 60 seconds
- Both players must have sufficient balance

**Payment:**
- Re-escrow bet + fee from both players

**State Transition:**
- `Settled` → `Committing`
- New hand begins with fresh commit-reveal cycle

#### `close_table`
Closes a table and returns funds.

**Accounts:**
- `player` (signer, mut)
- `table_account` (mut)

**Validation:**
- Table must be in `Settled` state or `Open` state (after 60s)
- Either player can close after 60s wait

**Payment:**
- Any escrowed funds returned to respective players

**State:**
- Table PDA closed and rent reclaimed

---

## Randomness: Commit-Reveal Scheme

### Why Commit-Reveal?
- **No single party controls randomness** (prevents cheating)
- **No oracle dependency** (cheap, fast, no external calls)
- **Provably fair** (both seeds are publicly auditable on-chain)

### Process

1. **Commit Phase:**
   - Both players generate a cryptographically secure random 32-byte seed client-side
   - Each player submits `hash(seed)` to the chain
   - Commitments are locked and visible

2. **Reveal Phase:**
   - Both players reveal their seed within 30 seconds
   - Smart contract verifies: `hash(revealed_seed) == commitment`

3. **Shuffle Generation:**
   - Combine seeds: `final_seed = hash(creator_seed || opponent_seed || table_id)`
   - Use `final_seed` as entropy for deterministic Fisher-Yates shuffle
   - 52-card deck is now provably random and fixed until exhausted

4. **Fallback (Timeout):**
   - If a player fails to reveal:
     - Use `hash(other_player_seed || table_id)` as fallback
     - Game proceeds (no cancellation, no refund)
     - Missing player's turn timer starts normally

### Security Properties
- ✅ Neither player knows the final deck order in advance
- ✅ Neither player can manipulate the shuffle
- ✅ All entropy sources are on-chain and auditable
- ✅ No external oracles or trusted third parties

---

## PDA Derivation Summary

| Account Type | Seeds |
|---|---|
| `UsernameAccount` | `["username", username_lowercase.as_bytes()]` |
| `WalletAccount` | `["wallet", owner.key().as_ref()]` |
| `TableAccount` | `["table", table_id.to_le_bytes().as_ref()]` |

---

## Fee Routing

**All fees sent to:**
```
7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4
```

**Fee Breakdown:**
- Username minting: $1 USD-equivalent in SOL
- Per-hand protocol fee: 0.001 SOL per player (0.002 total)
- Push refunds: Full bet + fee returned to both players

---

## Error Codes

| Code | Name | Description |
|---|---|---|
| 6000 | `UsernameTaken` | Username already claimed |
| 6001 | `InvalidUsername` | Invalid characters or length |
| 6002 | `WalletAlreadyHasUsername` | Wallet already owns a username |
| 6003 | `TableNotOpen` | Cannot join non-OPEN table |
| 6004 | `InsufficientFunds` | Not enough SOL for bet + fee |
| 6005 | `NotYourTurn` | Action attempted out of turn |
| 6006 | `InvalidBetAmount` | Bet not in allowed tiers |
| 6007 | `TurnTimeout` | 60-second timer expired |
| 6008 | `CommitmentMismatch` | Revealed seed doesn't match hash |
| 6009 | `RevealTimeout` | Failed to reveal within 30s |
| 6010 | `TableFull` | Table already has two players |

---

## Deployment
```bash
cd programs
anchor build
anchor deploy --provider.cluster mainnet
```

Program IDs will be generated. Copy them to:
- `frontend/.env` → `VITE_USERNAME_PROGRAM_ID` and `VITE_GAME_PROGRAM_ID`
- `backend/.env` → `USERNAME_PROGRAM_ID` and `GAME_PROGRAM_ID`

---

## Security Considerations

1. **Reentrancy Protection:** All state changes occur before external calls
2. **Signer Verification:** All instructions verify correct signers
3. **PDA Validation:** Seeds are validated on every instruction
4. **Integer Overflow:** Checked math used for all SOL transfers
5. **Randomness:** Commit-reveal prevents manipulation
6. **Escrow Safety:** PDAs hold funds, no custodial wallet
7. **Turn Enforcement:** Strict turn order prevents invalid actions

---

**For additional implementation details, see the Rust source code in `/programs`.**