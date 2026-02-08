# SolJack - Analysis Report

**Generated:** 2026-02-08
**Target Repo:** `/Users/jamieelizabeth/Documents/GitHub/soljack`

---

## 1. Repository Overview

**Purpose:** SolJack is a peer-to-peer (PvP) Blackjack game built on the Solana blockchain. Players compete against each other (not the house) by choosing roles (Dealer or Player), betting SOL in various tiers (0.01 - 1 SOL), and playing provably fair blackjack games using commit-reveal deck shuffling. The platform includes a competitive leaderboard with a "100-win race" incentive.

**Main Components:**
- **Frontend:** React + TypeScript + Vite web application with Phantom wallet integration
- **Backend:** Node.js + TypeScript + Fastify API server with WebSocket support for real-time game updates
- **Smart Contracts:** Two Anchor (Rust) programs deployed on Solana:
  - `username-registry`: Handles username registration and ownership (costs 0.01 SOL)
  - `soljack-game`: Manages game tables, betting, commit-reveal RNG, and payouts

**Deployment:**
- Live at: https://soljack.online
- Frontend: Deployed on Netlify (static hosting)
- Backend: Intended for Railway/Render (Node.js hosting)
- Smart contracts: Deployed on Solana Mainnet

---

## 2. Tech Stack and Dependencies

### Frontend Stack
- **Framework:** React 18.2 with TypeScript 5.2
- **Build Tool:** Vite 4.5
- **Wallet Integration:** @solana/wallet-adapter-react with Phantom support
- **Blockchain:** @solana/web3.js 1.87.6, @coral-xyz/anchor 0.29.0
- **Polyfills:** Buffer, stream-browserify, crypto-browserify (for browser compatibility)

### Backend Stack
- **Runtime:** Node.js 18+ with TypeScript 5.3
- **Web Framework:** Fastify 4.25 with @fastify/cors
- **WebSocket:** ws 8.16.0 for real-time communication
- **Blockchain:** @solana/web3.js 1.87.6
- **Caching (Optional):** Redis 4.6.12
- **Environment:** dotenv 16.3.1

### Smart Contract Stack
- **Framework:** Anchor (Rust-based Solana framework)
- **Language:** Rust with solana-program SDK
- **Build:** Cargo workspace with two programs

### Development Tools
- **Package Manager:** npm (with legacy-peer-deps flag for Netlify)
- **TypeScript:** Strict mode enabled on backend, relaxed unused checks on frontend
- **Version Control:** Git

---

## 3. Existing Entrypoints and How to Run Them

### Root-Level Commands
From `/Users/jamieelizabeth/Documents/GitHub/soljack`:
- `npm run dev` - Runs `vite dev` (appears to be misconfigured; should be frontend-specific)
- `npm run build` - Runs `vite build` (appears to be misconfigured; should be frontend-specific)

### Frontend Commands
From `/Users/jamieelizabeth/Documents/GitHub/soljack/frontend`:
- `npm run dev` - Starts Vite dev server on port 5173
- `npm run build` - Builds production bundle to `dist/`
- `npm run preview` - Previews production build locally

**Environment Requirements:**
- Copy `frontend/.env.example` to `frontend/.env`
- Configure `VITE_RPC_URL`, `VITE_WS_URL`, `VITE_USERNAME_PROGRAM_ID`, `VITE_GAME_PROGRAM_ID`

### Backend Commands
From `/Users/jamieelizabeth/Documents/GitHub/soljack/backend`:
- `npm run dev` - Starts backend with `tsx watch src/index.ts` (hot reload)
- `npm run build` - Compiles TypeScript to `dist/`
- `npm start` - Runs compiled `dist/index.js` (production)

**Services Started:**
1. Fastify HTTP server on port 3000 (configurable via PORT env var)
2. WebSocket server on port 3001 (configurable via WS_PORT env var)
3. Blockchain indexer (monitors Solana for game events)

**Environment Requirements:**
- Copy `backend/.env.example` to `backend/.env`
- Configure `RPC_URL`, `WS_RPC_URL`, `USERNAME_PROGRAM_ID`, `GAME_PROGRAM_ID`
- Fee destination wallet is hardcoded: `7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4`

### Smart Contracts
From `/Users/jamieelizabeth/Documents/GitHub/soljack/programs`:
- `anchor build` - Compiles both Rust programs
- `anchor deploy` - Deploys to configured cluster (localnet/devnet/mainnet)
- `anchor test` - Runs tests (configured in Anchor.toml)

**Program IDs (from Anchor.toml):**
- `username_registry`: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`
- `soljack_game`: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT`

---

## 4. Notable Modules and Responsibilities

### Frontend (`/frontend/src`)
- **App.tsx:** Root component with Solana wallet providers (ConnectionProvider, WalletProvider, WalletModalProvider)
- **main.tsx:** Entry point, renders App in React StrictMode
- **context/GameContext.tsx:** Global state for username, balance, stats, current table ID
- **components/HomePage.tsx:** Main landing page component
- **components/Lobby.tsx:** Table browser and creation interface
- **components/Table.tsx:** Active game table UI
- **components/Header.tsx:** Navigation and wallet connection UI
- **components/Stats.tsx:** Player statistics display
- **components/LeaderboardDropdown.tsx:** Leaderboard UI
- **components/ProfileModal.tsx:** User profile management
- **components/UsernameModal.tsx:** Username registration flow
- **components/BetTierNav.tsx:** Bet amount selector
- **components/HowItWorks.tsx:** Game rules and instructions

### Backend (`/backend/src`)
- **index.ts:** Main server entry point (Fastify setup, starts HTTP + WebSocket + indexer)
- **config.ts:** Environment variable loader and configuration object
- **routes/index.ts:** Route registration (exports `registerRoutes`)
- **routes/leaderboard.ts:** GET `/api/leaderboard` endpoint
- **routes/player.ts:** Player stats endpoints (`/api/player/:pubkey/stats`, etc.)
- **routes/stats.ts:** Global statistics endpoint
- **routes/tables.ts:** Table management endpoints (list, create, join)
- **websocket.ts:** WebSocket server implementation for real-time game events
- **indexer.ts:** Blockchain event listener (monitors game transactions)
- **cache.ts:** Redis caching layer (optional)

### Smart Contracts (`/programs`)

**username-registry (`/programs/username-registry/src/lib.rs`):**
- **claim_username:** Instruction to mint a unique username (3-20 alphanumeric chars)
- **UsernameAccount:** PDA storing username → wallet mapping
- **WalletAccount:** PDA storing wallet → username mapping
- **Fee:** 0.01 SOL per username claim

**soljack-game (`/programs/soljack-game/src/lib.rs`):**
- **create_table:** Instruction to create a new game table with bet amount and role
- **join_table:** Instruction for opponent to join and escrow funds
- **submit_commitment:** Part of commit-reveal protocol for deck shuffling
- **reveal_seed:** Reveal committed seed to generate provably fair deck
- **hit/stand/settle:** Game action instructions
- **Valid bet tiers:** 0.01, 0.05, 0.1, 0.25, 0.5, 1.0 SOL
- **Protocol fee:** 0.001 SOL per player (refunded on push)
- **Fee destination:** Hardcoded wallet `7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4`

---

## 5. Existing Documentation and Trustworthiness

### Documentation Files
1. **README.md** (Root)
   - **Status:** Comprehensive and well-structured
   - **Content:** Project overview, tech stack, installation, deployment, troubleshooting
   - **Trustworthiness:** HIGH - Appears accurate based on code inspection
   - **Gaps:** No details on testing strategy

2. **docs/API.md**
   - **Status:** Partially written (only header visible in snippet)
   - **Content:** REST API and WebSocket documentation
   - **Trustworthiness:** MEDIUM - Need to verify completeness
   - **Action Required:** Full read to assess coverage

3. **docs/DEPLOYMENT.md**
   - **Status:** High-level deployment guide
   - **Content:** Steps for smart contracts, backend, frontend deployment
   - **Trustworthiness:** MEDIUM - Lacks detailed commands and troubleshooting
   - **Gaps:** Missing CI/CD setup, environment variable configuration details

4. **docs/GAME_RULES.md**
   - **Status:** Not yet read
   - **Expected Content:** Blackjack rules implementation
   - **Action Required:** Read to verify game logic documentation

5. **docs/SMART_CONTRACTS.md**
   - **Status:** Not yet read
   - **Expected Content:** Program architecture and instruction specs
   - **Action Required:** Read to verify contract documentation

### Additional Documentation Found
- **CODE_QUALITY_IMPROVEMENT_TASKS.md:** Exists in root (suggests known issues/TODOs)
- **.auto-claude/ directory:** Contains AI-generated specs and insights (may be stale)
- **No CHANGELOG.md:** Project lacks changelog
- **No CONTRIBUTING.md:** No contribution guidelines
- **No TESTING.md:** No testing strategy documented

### Configuration Files
- **netlify.toml:** Netlify build config (frontend deployment)
- **vercel.json:** Vercel config (alternative deployment)
- **Anchor.toml:** Anchor framework config with program IDs
- **package.json files:** Well-structured with correct scripts
- **.env.example files:** Present for both frontend and backend

---

## 6. Open Questions and Uncertainties

### Critical Unknowns
1. **Testing:**
   - Are there any tests written? (None found in initial scan)
   - How is the smart contract code tested?
   - Are there integration tests for backend API + blockchain?

2. **Build Health:**
   - Does `npm run build` succeed in frontend?
   - Does `npm run build` succeed in backend?
   - Do the Rust programs compile with `anchor build`?
   - Are all dependencies installed correctly?

3. **Environment Configuration:**
   - Are `.env` files configured in development environment?
   - What are the actual deployed program IDs on mainnet?
   - Is the hardcoded fee destination wallet correct and controlled?

4. **Backend API Completeness:**
   - Are all routes implemented or are some stubs?
   - Is the WebSocket server fully functional?
   - Is the blockchain indexer actively working?
   - Is Redis required or truly optional?

5. **Frontend Completeness:**
   - Are all components functional or are some placeholders?
   - Does the wallet connection work correctly?
   - Are there any console errors in browser?
   - Does the GameContext properly sync with backend?

6. **Smart Contract State:**
   - Are the programs actually deployed to the addresses in Anchor.toml?
   - Have they been audited?
   - Are there known security vulnerabilities?

7. **Deployment Status:**
   - Is https://soljack.online actually live?
   - What hosting provider is being used for backend?
   - Are there monitoring/logging systems in place?

8. **Root package.json Misconfiguration:**
   - The root `package.json` has `vite build` and `vite dev` scripts but Vite is only installed in frontend
   - This suggests the root scripts may not work correctly
   - Need to determine if monorepo management is needed

9. **Game Logic Completeness:**
   - Is the full blackjack game flow implemented?
   - Are timeout mechanisms working (turn_deadline field exists)?
   - How are edge cases handled (disconnects, timeouts, pushes)?

10. **Leaderboard and Stats:**
    - Is the 100-win race fully tracked?
    - Are stats persisted in a database or derived from on-chain data?
    - How is the leaderboard updated in real-time?

### Minor Unknowns
- TypeScript strict mode is disabled for unused vars in frontend - intentional for development?
- No CI/CD configuration found - how are deployments managed?
- No error monitoring (Sentry, etc.) configured
- No analytics beyond placeholder VITE_ANALYTICS_KEY

---

## Next Steps

Based on this analysis, the next phase should:
1. Create `docs/ARCHITECTURE_AND_BUILD.md` with detailed build/run instructions
2. Verify build health by running all build commands
3. Document any missing environment variables
4. Create `docs/IMPLEMENTATION_PLAN.md` to track work toward "complete and shippable"
5. Identify and document known issues in `docs/KNOWN_ISSUES.md`
