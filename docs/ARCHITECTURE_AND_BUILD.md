# SolJack - Architecture and Build Documentation

**Last Updated:** 2026-02-08
**Target Repo:** `/Users/jamieelizabeth/Documents/GitHub/soljack`

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                               │
│              (Phantom Wallet + Browser)                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React SPA)                      │
│  - Wallet Connection (Phantom)                              │
│  - Game UI (Lobby, Table, Stats)                            │
│  - WebSocket Client (real-time updates)                     │
│  - Anchor SDK (transaction signing)                         │
│                                                             │
│  Deployed: Netlify                                          │
│  URL: https://soljack.online                                │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ WebSocket + REST API
               ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Node.js + Fastify)                 │
│  - REST API: Table listing, stats, leaderboard              │
│  - WebSocket Server: Real-time game events                  │
│  - Blockchain Indexer: Monitor on-chain events              │
│  - Redis Cache (optional): Performance optimization         │
│                                                             │
│  Deployed: Railway/Render                                   │
│  Ports: 3000 (HTTP), 3001 (WebSocket)                       │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ RPC/WebSocket
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   HELIUS RPC (Solana)                       │
│  - Transaction submission                                   │
│  - Account data queries                                     │
│  - Event subscriptions                                      │
└──────────────┬──────────────────────────────────────────────┘
               │
               │ On-chain interaction
               ▼
┌─────────────────────────────────────────────────────────────┐
│              SOLANA BLOCKCHAIN (Mainnet)                    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │  USERNAME REGISTRY PROGRAM                        │     │
│  │  ID: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS │     │
│  │  - claim_username(username: String)               │     │
│  │  - Fee: 0.01 SOL per username                     │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │  SOLJACK GAME PROGRAM                             │     │
│  │  ID: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT │     │
│  │  - create_table(bet_amount, role, seed)           │     │
│  │  - join_table()                                   │     │
│  │  - submit_commitment(commitment)                  │     │
│  │  - reveal_seed(seed)                              │     │
│  │  - hit() / stand() / settle()                     │     │
│  │  - Protocol fee: 0.001 SOL per player             │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules and Responsibilities

### Frontend Modules (`/frontend/src`)

**Entry & Configuration:**
- `main.tsx`: Application entry point, renders root App component
- `App.tsx`: Wallet provider setup (ConnectionProvider, WalletProvider, WalletModalProvider)
- `vite.config.ts`: Build configuration with Node.js polyfills for browser

**State Management:**
- `context/GameContext.tsx`: Global state management
  - Username tracking
  - SOL balance
  - Player stats (wins, losses, rank)
  - Current table ID
  - Refresh functions for balance and stats

**UI Components:**
- `components/HomePage.tsx`: Landing page with game overview
- `components/Header.tsx`: Navigation bar with wallet connect button
- `components/Lobby.tsx`: Table browser, create table, join table
- `components/Table.tsx`: Active game interface (cards, actions, timer)
- `components/Stats.tsx`: Player statistics dashboard
- `components/LeaderboardDropdown.tsx`: Top players by wins
- `components/ProfileModal.tsx`: User profile and settings
- `components/UsernameModal.tsx`: Username registration flow
- `components/BetTierNav.tsx`: Bet amount selection (0.01-1 SOL)
- `components/HowItWorks.tsx`: Game rules and instructions

**Key Responsibilities:**
- Wallet connection and authentication
- Transaction signing (via Phantom)
- Real-time UI updates via WebSocket
- Game state visualization
- User interaction handling

### Backend Modules (`/backend/src`)

**Server Setup:**
- `index.ts`: Main entry point
  - Initializes Fastify server with CORS
  - Registers API routes
  - Starts WebSocket server
  - Starts blockchain indexer

**Configuration:**
- `config.ts`: Environment variable loader
  - RPC URLs (HTTP and WebSocket)
  - Program IDs
  - Fee destination wallet
  - Server ports
  - Redis URL

**API Routes:**
- `routes/index.ts`: Route registration orchestrator
- `routes/tables.ts`: Table management
  - `GET /api/tables` - List active tables
  - `POST /api/tables` - Create table
  - `POST /api/tables/:id/join` - Join table
- `routes/player.ts`: Player data
  - `GET /api/player/:pubkey/stats` - Player statistics
  - `GET /api/player/:pubkey/username` - Username lookup
- `routes/leaderboard.ts`: Leaderboard
  - `GET /api/leaderboard` - Top players by wins
  - `GET /api/leaderboard/100-win-race` - Race status
- `routes/stats.ts`: Global statistics
  - `GET /api/stats` - Platform-wide stats

**Real-Time Communication:**
- `websocket.ts`: WebSocket server implementation
  - Broadcasts table updates
  - Notifies clients of game events
  - Handles client connections/disconnections

**Blockchain Integration:**
- `indexer.ts`: Blockchain event listener
  - Monitors game program transactions
  - Processes game outcomes
  - Updates leaderboard and stats
  - Syncs on-chain state with backend cache

**Caching:**
- `cache.ts`: Redis caching layer (optional)
  - Caches player stats
  - Caches leaderboard
  - Reduces RPC load

**Key Responsibilities:**
- API gateway for game data
- Real-time event broadcasting
- Blockchain event indexing
- Leaderboard tracking
- Stats aggregation

### Smart Contract Programs (`/programs`)

**Username Registry (`/programs/username-registry/src/lib.rs`):**
- **Program ID:** `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`
- **Instructions:**
  - `claim_username(username: String)`: Register a unique username
- **Accounts:**
  - `UsernameAccount`: PDA mapping username → wallet (seed: `["username", lowercase_username]`)
  - `WalletAccount`: PDA mapping wallet → username (seed: `["wallet", wallet_pubkey]`)
- **Validation:**
  - Username: 3-20 alphanumeric characters
  - Case-insensitive (stored lowercase)
  - Must be unique (PDA prevents duplicates)
- **Fee:** 0.01 SOL to fee destination

**SolJack Game (`/programs/soljack-game/src/lib.rs`):**
- **Program ID:** `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT`
- **Instructions:**
  - `create_table`: Creator initializes table with bet amount and role
  - `join_table`: Opponent joins and escrows funds (both players)
  - `submit_commitment`: Both players submit hash commitments
  - `reveal_seed`: Both players reveal seeds to generate deck
  - `hit`: Draw another card
  - `stand`: End turn
  - `settle`: Finalize game and distribute winnings
- **Bet Tiers:** 0.01, 0.05, 0.1, 0.25, 0.5, 1.0 SOL
- **Protocol Fee:** 0.001 SOL per player (collected on join, refunded on push)
- **Fee Destination:** `7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4`
- **Game State Machine:**
  1. `Open`: Table created, waiting for opponent
  2. `Committing`: Both players submit commitments
  3. `Revealing`: Both players reveal seeds
  4. `Playing`: Game in progress
  5. `Settled`: Game complete, funds distributed

**Key Responsibilities:**
- Username ownership and uniqueness
- Bet escrow and payout
- Provably fair deck generation (commit-reveal)
- Game state enforcement
- Protocol fee collection

---

## 3. Data Flow and Key Integration Points

### User Registration Flow
```
User → Frontend (Phantom) → Username Registry Program
                                   ↓
                            UsernameAccount PDA created
                            WalletAccount PDA created
                                   ↓
                            Backend Indexer detects event
                                   ↓
                            Username cached in Redis
```

### Table Creation Flow
```
User → Frontend (Phantom) → SolJack Game Program (create_table)
                                   ↓
                            TableAccount PDA created
                                   ↓
                            Backend Indexer detects event
                                   ↓
                            WebSocket broadcast: "table_created"
                                   ↓
                            Frontend updates Lobby UI
```

### Game Play Flow
```
Player joins → Both escrow funds → Submit commitments → Reveal seeds
                                                            ↓
                                                    Deck generated (deterministic)
                                                            ↓
                                            Deal initial cards (2 each)
                                                            ↓
                                            Turn-based play (hit/stand)
                                                            ↓
                                            Compare totals, settle bets
                                                            ↓
                                            Winner gets 2x bet - fee
                                            Loser gets fee refunded on push
```

### Real-Time Updates Flow
```
On-chain transaction → Backend Indexer polls RPC
                              ↓
                      Parse transaction logs
                              ↓
                      Update internal state
                              ↓
                      Broadcast via WebSocket
                              ↓
                      Frontend receives event
                              ↓
                      UI updates (cards, timer, etc.)
```

### Critical Integration Points
1. **Frontend ↔ Wallet:** Phantom adapter for transaction signing
2. **Frontend ↔ Backend:** REST API for data queries, WebSocket for live updates
3. **Backend ↔ Solana:** Helius RPC for transactions and account queries
4. **Backend ↔ Redis:** Optional caching for performance
5. **Smart Contracts ↔ Users:** Direct interaction via Anchor SDK (no backend proxy)

---

## 4. Environments and Configuration Strategy

### Development Environment

**Frontend Configuration (`frontend/.env`):**
```env
VITE_RPC_URL=https://api.devnet.solana.com
VITE_WS_URL=ws://localhost:3001
VITE_USERNAME_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
VITE_GAME_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT
VITE_ENV=development
VITE_ANALYTICS_KEY=
```

**Backend Configuration (`backend/.env`):**
```env
NODE_ENV=development
PORT=3000
WS_PORT=3001
RPC_URL=https://api.devnet.solana.com
WS_RPC_URL=wss://api.devnet.solana.com
USERNAME_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
GAME_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT
FEE_DESTINATION_WALLET=7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4
REDIS_URL=redis://localhost:6379
```

**Smart Contract Configuration (`programs/Anchor.toml`):**
```toml
[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"
```

### Production Environment

**Frontend Configuration (`frontend/.env.production`):**
```env
VITE_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_WS_URL=wss://soljack-backend.railway.app
VITE_USERNAME_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
VITE_GAME_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT
VITE_ENV=production
VITE_ANALYTICS_KEY=YOUR_ANALYTICS_KEY
```

**Backend Configuration (Railway/Render env vars):**
- Same as development but with Mainnet RPC URLs
- Redis URL from hosted Redis service
- Port provided by hosting platform

**Smart Contract Configuration:**
```toml
[provider]
cluster = "Mainnet"
wallet = "~/.config/solana/deployment-keypair.json"
```

### Configuration Strategy
- **No secrets in code:** All sensitive values in `.env` files (gitignored)
- **Environment-specific configs:** `.env` (dev), `.env.production` (prod)
- **Vite prefix:** Frontend env vars prefixed with `VITE_` for browser exposure
- **Program IDs:** Same across all environments (already deployed)
- **Fee wallet:** Hardcoded in smart contracts (immutable after deployment)

---

## 5. Build and Run Instructions

### Prerequisites
- Node.js 18+ (verify: `node --version`)
- npm (verify: `npm --version`)
- Rust 1.70+ (verify: `rustc --version`)
- Solana CLI 1.17+ (verify: `solana --version`)
- Anchor CLI 0.29+ (verify: `anchor --version`)
- Phantom Wallet browser extension

### Installation

**Step 1: Clone and Install Dependencies**
```bash
# Navigate to repo
cd /Users/jamieelizabeth/Documents/GitHub/soljack

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Smart contracts (if building from source)
cd ../programs
# Dependencies managed by Cargo
```

**Step 2: Configure Environment Variables**
```bash
# Frontend
cd /Users/jamieelizabeth/Documents/GitHub/soljack/frontend
cp .env.example .env
# Edit .env with your values

# Backend
cd /Users/jamieelizabeth/Documents/GitHub/soljack/backend
cp .env.example .env
# Edit .env with your values
```

### Build Commands

**Frontend Build:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/frontend
npm run build
# Output: dist/ directory with static files
# Expected: Vite builds successfully with no errors
```

**Backend Build:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/backend
npm run build
# Output: dist/ directory with compiled JavaScript
# Expected: TypeScript compiles successfully
```

**Smart Contracts Build:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/programs
anchor build
# Output: target/deploy/*.so files
# Expected: Rust compiles both programs successfully
```

### Run Commands

**Frontend Development Server:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/frontend
npm run dev
# Starts: Vite dev server on http://localhost:5173
# Hot reload: Enabled
# Access: Open browser to http://localhost:5173
```

**Backend Development Server:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/backend
npm run dev
# Starts:
#   - Fastify HTTP server on http://localhost:3000
#   - WebSocket server on ws://localhost:3001
#   - Blockchain indexer (polling Solana)
# Hot reload: Enabled via tsx watch
# Logs: Visible in terminal
```

**Backend Production:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/backend
npm run build
npm start
# Runs compiled JavaScript from dist/
```

**Smart Contract Deployment:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/programs
anchor build
anchor deploy --provider.cluster mainnet
# Note: Requires funded deployment wallet
# Copy program IDs to .env files after deployment
```

### Test Commands

**Frontend Tests:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/frontend
# No test command configured
# Action required: Add testing framework
```

**Backend Tests:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/backend
# No test command configured
# Action required: Add testing framework
```

**Smart Contract Tests:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/programs
anchor test
# Runs tests defined in Anchor.toml
# Note: Test files not found in initial scan
```

### Lint Commands

**Frontend Lint:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/frontend
# No lint command configured
# Action required: Add ESLint
```

**Backend Lint:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/backend
# No lint command configured
# Action required: Add ESLint
```

**Smart Contracts Lint:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/programs
cargo clippy --all-targets --all-features
# Rust linting
```

### Format Commands

**Frontend Format:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/frontend
# No format command configured
# Action required: Add Prettier
```

**Backend Format:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/backend
# No format command configured
# Action required: Add Prettier
```

**Smart Contracts Format:**
```bash
cd /Users/jamieelizabeth/Documents/GitHub/soljack/programs
cargo fmt --all
# Rust formatting
```

---

## 6. Known Gaps and Inconsistencies

### Build System Issues
1. **Root package.json misconfiguration:**
   - Root has `vite build` and `vite dev` scripts
   - Vite is only installed in `frontend/`
   - These scripts will fail when run from root
   - **Fix needed:** Remove root scripts or convert to monorepo with workspace setup

2. **No monorepo management:**
   - Project has multiple packages (frontend, backend, programs)
   - No unified build or install command
   - **Recommendation:** Add npm workspaces or switch to pnpm/yarn workspaces

### Testing Gaps
1. **No frontend tests:** No Jest/Vitest configuration or test files
2. **No backend tests:** No test framework or test files
3. **No integration tests:** No end-to-end testing setup
4. **Smart contract tests unclear:** `anchor test` configured but test files not found

### Code Quality Tools Missing
1. **No ESLint:** No linting for TypeScript/JavaScript code
2. **No Prettier:** No code formatting enforced
3. **No pre-commit hooks:** No Husky or git hooks configured
4. **No CI/CD:** No GitHub Actions, CircleCI, or similar

### Environment Variable Issues
1. **Program IDs in Anchor.toml:**
   - Same program IDs for localnet, devnet, and mainnet
   - This is unusual (typically different per network)
   - **Verify:** Are these the actual mainnet addresses?

2. **Hardcoded fee destination:**
   - Wallet `7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4` in code
   - Cannot be changed without redeploying contracts
   - **Verify:** Is this wallet controlled and secure?

### Documentation Gaps
1. **Incomplete API.md:** Only header visible
2. **Deployment guide lacks detail:** Missing specific commands and troubleshooting
3. **No TESTING.md:** Testing strategy not documented
4. **No CHANGELOG.md:** Change history not tracked
5. **No CONTRIBUTING.md:** Contribution guidelines missing

### Architectural Concerns
1. **Redis optional but not gracefully handled:**
   - Config loads Redis URL
   - Unknown if code degrades gracefully without Redis
   - **Test needed:** Run backend without Redis

2. **WebSocket server resilience:**
   - Unknown if reconnection logic exists
   - Unknown if message queuing exists for offline clients

3. **Blockchain indexer polling:**
   - No indication of polling interval
   - No indication of failure handling
   - Unknown if events can be missed

4. **Frontend GameContext state sync:**
   - `refreshStats` has TODO comment
   - Unknown if stats are actually fetched from backend

5. **Turn timeout enforcement:**
   - `turn_deadline` field exists in smart contract
   - Unknown if backend enforces timeouts
   - Unknown if frontend displays timer

### Security Concerns
1. **No audit trail:** Smart contracts not indicated as audited
2. **No rate limiting:** API endpoints may be vulnerable to abuse
3. **No CORS restrictions in prod:** CORS allows localhost and soljack.online only (good)
4. **Commit-reveal implementation:** Need to verify cryptographic security

---

## Next Steps

1. **Install dependencies** in frontend and backend
2. **Verify builds succeed** for all components
3. **Test run servers** in development mode
4. **Create IMPLEMENTATION_PLAN.md** with tasks to complete the project
5. **Document known issues** in KNOWN_ISSUES.md
