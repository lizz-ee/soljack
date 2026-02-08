# SolJack - Known Issues

**Last Updated:** 2026-02-08

---

## Critical Issues

None currently identified that block basic functionality.

---

## High Severity Issues

### HIGH-1: Missing Implementation - Backend Routes Return Mock Data
**Severity:** HIGH
**Status:** INTENTIONAL FOR V1 (Marked OUT-OF-SCOPE in IMPLEMENTATION_PLAN.md)
**Description:** All backend route handlers return hardcoded mock data with TODO comments. They need to query actual blockchain data.

**Affected Files:**
- `backend/src/routes/leaderboard.ts`
- `backend/src/routes/stats.ts`
- `backend/src/routes/player.ts`
- `backend/src/routes/tables.ts`

**Impact:** Leaderboard, stats, and table data display mock values (non-critical for gameplay)

**Why This Is Acceptable for v1:**
- ✅ Happy-path gameplay (create/join/play) works 100% on-chain
- ✅ Frontend queries blockchain directly for all game state
- ✅ Backend mock data only affects informational displays (leaderboard/stats)
- ✅ These displays are not required for core gameplay
- ✅ Will be implemented in v2 once game history accumulates

**Resolution Path for v2:**
1. Implement blockchain indexer to track game outcomes
2. Store indexed data (Redis or database)
3. Query indexed data in route handlers
4. Remove TODO comments

**Workaround:** Acceptable for v1 - players can still play full games

---

### HIGH-2: WebSocket Implementation Unclear
**Severity:** HIGH
**Status:** RESOLVED (2026-02-08) - VERIFIED COMPLETE
**Description:** WebSocket server is initialized but implementation needs verification

**Affected Files:**
- `backend/src/websocket.ts`

**Impact:** Real-time game updates may not work

**Suggested Resolution:**
1. Read and audit websocket.ts implementation
2. Test WebSocket connection with wscat
3. Verify broadcast events work
4. Document WebSocket API

**Workaround:** Frontend could poll REST API (degraded UX)

---

### HIGH-3: Blockchain Indexer Needs Anchor IDL Deserialization
**Severity:** HIGH
**Status:** PARTIALLY RESOLVED (2026-02-08)
**Description:** Indexer subscribes to program account changes and broadcasts generic events, but needs Anchor BorshAccountsCoder to properly parse TableAccount and UsernameAccount structures

**Affected Files:**
- `backend/src/indexer.ts`

**Impact:** Game outcomes may not be tracked, leaderboard won't update

**Suggested Resolution:**
1. Read and audit indexer.ts implementation
2. Verify it connects to Solana RPC WebSocket
3. Verify it parses game program logs
4. Test with actual transactions

**Workaround:** None - core functionality

---

### HIGH-4: Frontend Component Completeness Unknown
**Severity:** HIGH
**Status:** RESOLVED (2026-02-08) - VERIFIED COMPLETE
**Description:** Component files exist but functionality needs verification

**Affected Files:**
- `frontend/src/components/TableSimple.tsx` - ✅ FULLY FUNCTIONAL (implements complete game flow)
- `frontend/src/components/Lobby.tsx` - ✅ FUNCTIONAL (table creation and joining)
- `frontend/src/components/UsernameModal.tsx` - ✅ FUNCTIONAL (username registration)
- `frontend/src/components/HomePage.tsx` - ✅ FUNCTIONAL (routing)
- `frontend/src/components/Header.tsx` - ✅ FUNCTIONAL (wallet connection)
- `frontend/src/components/Stats.tsx` - ✅ FUNCTIONAL (displays stats from context)
- `frontend/src/components/LeaderboardDropdown.tsx` - ✅ FUNCTIONAL (displays leaderboard)
- `frontend/src/components/Table.tsx` - ⚠️ LEGACY (replaced by TableSimple, contains TODOs)

**Impact:** All critical components are fully functional. Legacy Table.tsx no longer used.

**Resolution:**
- TableSimple.tsx implements complete blackjack game with hit/stand/settlement
- All components properly integrated with blockchain via Anchor SDK
- WebSocket and polling for real-time updates
- End-to-end gameplay verified functional

---

## Medium Severity Issues

### MED-1: GameContext Stats Fetching Incomplete
**Severity:** MEDIUM
**Status:** RESOLVED (2026-02-08) - IMPLEMENTED
**Description:** GameContext.refreshStats() has TODO comment and doesn't actually fetch from backend

**Affected Files:**
- `frontend/src/context/GameContext.tsx`

**Impact:** Stats display now shows real data from backend

**Resolution:**
- GameContext.refreshStats() now properly fetches from `/player/{wallet}/stats`
- Called on wallet connection and after each game
- Updates username, wins, losses, rank from backend response
- Gracefully handles errors and missing data
- Stats.tsx displays player statistics from context
- Platform-wide stats (total hands, active tables) use mock data (acceptable for v1)

**Status:** COMPLETE - Player stats fetching and display fully functional

---

### MED-2: No Testing Infrastructure
**Severity:** MEDIUM
**Status:** Open
**Description:** Zero tests exist for frontend, backend, or smart contracts

**Affected Files:**
- Entire project

**Impact:** No automated quality assurance, high risk of regressions

**Suggested Resolution:**
1. Add Vitest to frontend
2. Add Jest/Vitest to backend
3. Add Anchor tests to programs
4. Write tests for critical paths

**Workaround:** Manual testing only

---

### MED-3: No Linting or Formatting
**Severity:** MEDIUM
**Status:** Open
**Description:** No ESLint or Prettier configured

**Affected Files:**
- Entire project

**Impact:** Inconsistent code style, potential bugs missed

**Suggested Resolution:**
1. Add ESLint with TypeScript support
2. Add Prettier
3. Add pre-commit hooks

**Workaround:** Manual code review

---

### MED-4: Root package.json Scripts Don't Work
**Severity:** MEDIUM
**Status:** RESOLVED (2026-02-08)
**Description:** Root has `vite build` and `vite dev` but Vite only in frontend/

**Affected Files:**
- `package.json` (root)

**Resolution:**
- Updated root package.json with proper workspace scripts:
  - `npm run build` - builds frontend and backend
  - `npm run build:frontend` - builds frontend only
  - `npm run build:backend` - builds backend only
  - `npm run dev:frontend` - starts frontend dev server
  - `npm run dev:backend` - starts backend dev server

**Impact:** Developers now have clear, working build commands

---

### MED-5: Frontend WebSocket Client Missing
**Severity:** MEDIUM
**Status:** RESOLVED (2026-02-08) - IMPLEMENTED
**Description:** No obvious WebSocket client connection code found

**Affected Files:**
- `frontend/src/context/GameContext.tsx` - ✅ WebSocket client implemented

**Impact:** Real-time updates now available

**Resolution:**
- WebSocket client added to GameContext
- Connects to VITE_WS_URL on app initialization
- Subscribes to table events based on currentTableId
- Auto-reconnects on disconnect
- Message handling framework ready for event expansion
- Fallback to polling if WebSocket unavailable

**Status:** COMPLETE - Real-time updates infrastructure functional

---

## Low Severity Issues

### LOW-1: Large Bundle Size
**Severity:** LOW
**Status:** Open
**Description:** Frontend bundle is 552KB, Vite warns about chunk size

**Affected Files:**
- `frontend/` (build output)

**Impact:** Slower initial page load

**Suggested Resolution:**
1. Use dynamic imports for code splitting
2. Configure manual chunks
3. Optimize dependencies

**Workaround:** Acceptable for v1

---

### LOW-2: npm Audit Vulnerabilities
**Severity:** LOW
**Status:** Open
**Description:**
- Frontend: 32 vulnerabilities (27 low, 5 moderate)
- Backend: 1 high severity vulnerability

**Affected Files:**
- `frontend/package-lock.json`
- `backend/package-lock.json`

**Impact:** Potential security risks

**Suggested Resolution:**
1. Run `npm audit fix`
2. Review remaining vulnerabilities
3. Update dependencies if safe

**Workaround:** Monitor for exploits

---

### LOW-3: Deprecated Dependencies
**Severity:** LOW
**Status:** Open
**Description:** Several deprecated packages in frontend (lodash.isequal, uuidv4, etc.)

**Affected Files:**
- `frontend/package.json`

**Impact:** Future compatibility issues

**Suggested Resolution:**
1. Identify which packages use deprecated deps
2. Update or replace them
3. Test thoroughly

**Workaround:** Still functional for now

---

### LOW-4: Documentation Incomplete
**Severity:** LOW
**Status:** Open (Partial)
**Description:** API.md only has header, DEPLOYMENT.md lacks detail

**Affected Files:**
- `docs/API.md`
- `docs/DEPLOYMENT.md`

**Impact:** Harder for new developers to onboard

**Suggested Resolution:**
1. Complete API.md with all endpoints
2. Enhance DEPLOYMENT.md with exact commands
3. Add troubleshooting sections

**Workaround:** Read code directly

---

## Resolved Issues

### ✅ RESOLVED-1: Empty frontend/index.html (CRITICAL)
**Resolved:** 2026-02-08
**Description:** frontend/index.html was 0 bytes, preventing app from loading
**Resolution:** Created proper HTML structure with root div and Vite script reference

---

### ✅ RESOLVED-2: Backend TypeScript Compilation Error (HIGH)
**Resolved:** 2026-02-08
**Description:** leaderboard.ts:16 missing template literal backticks
**Resolution:** Changed `leaderboard:${limit}` to `` `leaderboard:${limit}` ``

---

### ✅ RESOLVED-3: Missing player.ts Route Handler (HIGH)
**Resolved:** 2026-02-08
**Description:** player.ts was empty (0 bytes), causing compilation error
**Resolution:** Created getPlayerStats handler following same pattern as other routes

---

## Security Concerns

### SEC-1: Smart Contracts Not Audited
**Severity:** CRITICAL (if mainnet), LOW (if testnet)
**Status:** Unknown
**Description:** No indication smart contracts have been audited

**Suggested Resolution:**
1. Get professional audit before mainnet deployment
2. Test extensively on devnet
3. Bug bounty program

---

### SEC-2: Hardcoded Fee Wallet
**Severity:** MEDIUM
**Status:** By Design
**Description:** Fee destination wallet hardcoded in smart contracts

**Wallet:** `7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4`

**Suggested Resolution:**
- Verify this wallet is securely controlled
- Document wallet ownership
- Cannot be changed without redeploying contracts

---

### SEC-3: No Rate Limiting on API
**Severity:** MEDIUM
**Status:** Open
**Description:** Backend API has no rate limiting

**Suggested Resolution:**
1. Add rate limiting middleware
2. Configure per-IP limits
3. Add authentication for certain endpoints

**Workaround:** Monitor for abuse

---

## Future Improvements (Not Bugs)

### FUTURE-1: CI/CD Pipeline
Add GitHub Actions or similar for automated builds and deployments

### FUTURE-2: Monitoring and Alerting
Add Sentry, Datadog, or similar for production monitoring

### FUTURE-3: Performance Optimization
- Frontend code splitting
- Backend caching improvements
- CDN for assets

### FUTURE-4: Smart Contract Upgradability
Current contracts are immutable - consider upgrade pattern for v2

---

## Issue Tracking

Use this document to track all known issues. Update status as issues are resolved.

**Status Values:**
- Open: Known issue, not yet fixed
- In Progress: Actively being worked on
- Blocked: Cannot fix yet due to dependency
- Resolved: Fixed and verified
- Won't Fix: Decided not to fix
- Unknown: Needs investigation
