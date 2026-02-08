# SolJack - Testing Guide

**Last Updated:** 2026-02-08
**Repository:** `/Users/jamieelizabeth/Documents/GitHub/soljack`

---

## Testing Status

**Automated Tests:** ❌ None exist yet
**Manual Testing:** Required for all user flows
**CI/CD:** ❌ Not configured

---

## Manual Testing Procedures

### Prerequisites

Before testing, ensure:
- [ ] Backend server running (`cd backend && npm run dev`)
- [ ] Frontend server running (`cd frontend && npm run dev`)
- [ ] Phantom wallet installed in browser
- [ ] Test wallet has sufficient SOL (at least 2 SOL for testing)
- [ ] RPC endpoint accessible (check .env files)

---

## Test Suite 1: Wallet Connection

### TEST-1.1: Connect Phantom Wallet
**Priority:** CRITICAL
**Estimated Time:** 2 minutes

**Steps:**
1. Open browser to http://localhost:5173
2. Click "Connect Wallet" button
3. Phantom popup appears
4. Select test wallet
5. Click "Connect"

**Expected Results:**
- ✅ Phantom popup opens
- ✅ Wallet connects successfully
- ✅ UI updates to show connected state
- ✅ Wallet address visible in header
- ✅ SOL balance displayed correctly

**Failure Scenarios:**
- ❌ Phantom not installed: Install extension
- ❌ Connection rejected: Check wallet permissions
- ❌ Wrong network: Switch Phantom to Mainnet
- ❌ RPC timeout: Check VITE_RPC_URL in .env

---

### TEST-1.2: Disconnect Wallet
**Priority:** HIGH
**Estimated Time:** 1 minute

**Steps:**
1. From connected state (TEST-1.1)
2. Click wallet address in header
3. Click "Disconnect" button

**Expected Results:**
- ✅ Wallet disconnects
- ✅ UI returns to pre-connection state
- ✅ No errors in console

---

## Test Suite 2: Username Registration

### TEST-2.1: Check Existing Username
**Priority:** HIGH
**Estimated Time:** 1 minute

**Steps:**
1. Connect wallet (TEST-1.1)
2. Observe header area

**Expected Results:**
- ✅ If username exists: Display username
- ✅ If no username: Show "Register Username" option

---

### TEST-2.2: Register New Username
**Priority:** CRITICAL
**Estimated Time:** 3 minutes
**Cost:** ~0.01 SOL

**Prerequisites:**
- Wallet must not have username registered

**Steps:**
1. Connect wallet without username
2. Click "Register Username" button
3. Modal opens
4. Enter username (3-20 alphanumeric characters)
5. Click "Register" button
6. Sign transaction in Phantom
7. Wait for confirmation

**Expected Results:**
- ✅ Username modal opens
- ✅ Input validation works (3-20 chars, alphanumeric only)
- ✅ Transaction prompt appears
- ✅ Transaction confirms on-chain
- ✅ Username displayed in UI
- ✅ 0.01 SOL deducted from wallet

**Failure Scenarios:**
- ❌ Username taken: Try different username
- ❌ Insufficient funds: Add SOL to wallet
- ❌ Transaction timeout: Retry or check RPC
- ❌ Invalid characters: Use only letters/numbers

---

## Test Suite 3: Lobby and Table Browsing

### TEST-3.1: Navigate to Lobby
**Priority:** HIGH
**Estimated Time:** 1 minute

**Steps:**
1. Connect wallet (TEST-1.1)
2. Observe bet tier navigation
3. Click a bet tier (e.g., "0.1 SOL")

**Expected Results:**
- ✅ Bet tier highlights
- ✅ Lobby component loads
- ✅ "Create Table" button visible
- ✅ Open tables list displayed (may be empty)

---

### TEST-3.2: View Open Tables
**Priority:** HIGH
**Estimated Time:** 1 minute

**Steps:**
1. In lobby (TEST-3.1)
2. Observe table list

**Expected Results:**
- ✅ Tables refresh every 5 seconds
- ✅ Each table shows:
  - Creator username/address
  - Role (Dealer/Player)
  - Time remaining
  - Creator stats
- ✅ Click table to view details
- ✅ "Join Table" button appears

**Note:** Currently returns mock data. Will show real tables once blockchain integration complete.

---

## Test Suite 4: Table Creation

### TEST-4.1: Create New Table
**Priority:** CRITICAL
**Estimated Time:** 3 minutes
**Cost:** Bet amount + 0.001 SOL fee

**Prerequisites:**
- Wallet has sufficient SOL (bet + fee)

**Steps:**
1. Navigate to lobby for bet tier (TEST-3.1)
2. Click "Create Table" button
3. Modal opens
4. Select role (Dealer or Player)
5. Click "Create Table" button
6. Sign transaction in Phantom
7. Wait for confirmation

**Expected Results:**
- ✅ Create table modal opens
- ✅ Role selection works (Dealer/Player)
- ✅ Transaction prompt appears
- ✅ Transaction confirms on-chain
- ✅ UI navigates to table view
- ✅ "Waiting for opponent..." displayed
- ✅ Timer counting down

**Failure Scenarios:**
- ❌ Insufficient funds: Add more SOL
- ❌ Transaction fails: Check transaction in explorer
- ❌ RPC error: Wait and retry

**Current Status:** ⚠️ Transaction call is TODO - uses mock table ID

---

## Test Suite 5: Joining Tables

### TEST-5.1: Join Existing Table
**Priority:** CRITICAL
**Estimated Time:** 3 minutes
**Cost:** Bet amount + 0.001 SOL fee

**Prerequisites:**
- Different wallet than creator
- Wallet has sufficient SOL

**Steps:**
1. Navigate to lobby (TEST-3.1)
2. Find open table
3. Click table card
4. Click "Join Table" button
5. Sign transaction in Phantom
6. Wait for confirmation

**Expected Results:**
- ✅ Transaction prompt appears
- ✅ Transaction confirms on-chain
- ✅ UI navigates to table view
- ✅ "Generating Fair Deck..." displayed
- ✅ Both players see commit-reveal process
- ✅ Cards dealt after reveal
- ✅ Game begins

**Failure Scenarios:**
- ❌ Table full: Find another table
- ❌ Insufficient funds: Add more SOL
- ❌ Transaction fails: Check explorer

**Current Status:** ⚠️ Transaction call is TODO

---

## Test Suite 6: Gameplay

### TEST-6.1: Commit-Reveal Process
**Priority:** CRITICAL
**Estimated Time:** 2 minutes

**Prerequisites:**
- Two players at table (TEST-5.1)

**Steps:**
1. Both players at table
2. Observe "Generating Fair Deck..." screen
3. Both players auto-submit commitments
4. Both players auto-reveal seeds
5. Deck generated

**Expected Results:**
- ✅ Commitment phase completes
- ✅ Reveal phase completes
- ✅ Deck is shuffled deterministically
- ✅ No player can predict cards
- ✅ Game transitions to "Active" state

**Current Status:** ⚠️ Commitment/reveal transactions are TODO

---

### TEST-6.2: Initial Deal
**Priority:** CRITICAL
**Estimated Time:** 1 minute

**Prerequisites:**
- Deck generated (TEST-6.1)

**Steps:**
1. After deck generation
2. Observe card dealing

**Expected Results:**
- ✅ 2 cards dealt to each player
- ✅ Cards displayed in UI
- ✅ Hand totals calculated correctly
- ✅ Current turn indicated
- ✅ Timer starts for active player

**Current Status:** ⚠️ Card dealing happens on-chain, needs verification

---

### TEST-6.3: Hit Action
**Priority:** CRITICAL
**Estimated Time:** 2 minutes

**Prerequisites:**
- Game in progress (TEST-6.2)
- It's your turn

**Steps:**
1. Observe hand total
2. Click "Hit" button
3. Sign transaction in Phantom
4. Wait for confirmation

**Expected Results:**
- ✅ Transaction confirms
- ✅ New card added to hand
- ✅ Hand total updates
- ✅ If < 21: Turn continues or passes
- ✅ If = 21: Auto-stand
- ✅ If > 21: Bust, hand ends

**Failure Scenarios:**
- ❌ Not your turn: Wait for opponent
- ❌ Timeout: Turn forfeited

**Current Status:** ⚠️ Transaction call is TODO

---

### TEST-6.4: Stand Action
**Priority:** CRITICAL
**Estimated Time:** 1 minute

**Prerequisites:**
- Game in progress (TEST-6.2)
- It's your turn

**Steps:**
1. Observe hand total
2. Click "Stand" button
3. Sign transaction in Phantom
4. Wait for confirmation

**Expected Results:**
- ✅ Transaction confirms
- ✅ Turn passes to opponent
- ✅ If both stand: Dealer reveals and settles

**Current Status:** ⚠️ Transaction call is TODO

---

### TEST-6.5: Hand Settlement
**Priority:** CRITICAL
**Estimated Time:** 2 minutes

**Prerequisites:**
- Both players finished (TEST-6.3, TEST-6.4)

**Steps:**
1. Both players complete actions
2. Observe settlement

**Expected Results:**
- ✅ Hand totals compared
- ✅ Winner determined:
  - Player closer to 21 wins
  - Dealer wins ties
  - Bust loses
- ✅ SOL transferred:
  - Winner gets 2x bet - fee
  - Loser gets nothing
  - Push: both get bet back
- ✅ Stats updated:
  - Winner: +1 win
  - Loser: +1 loss
- ✅ Result displayed in UI

**Current Status:** ⚠️ Settlement logic on-chain, needs verification

---

## Test Suite 7: Leaderboard and Stats

### TEST-7.1: View Leaderboard
**Priority:** MEDIUM
**Estimated Time:** 1 minute

**Steps:**
1. From any screen
2. Click "Leaderboard" in header
3. Dropdown opens

**Expected Results:**
- ✅ Top players displayed
- ✅ Shows: rank, username, wins, losses
- ✅ 100-win race leader highlighted
- ✅ Updates in real-time

**Current Status:** ⚠️ Shows mock data, needs real data from indexer

---

### TEST-7.2: View Player Stats
**Priority:** MEDIUM
**Estimated Time:** 1 minute

**Steps:**
1. Connect wallet (TEST-1.1)
2. Click wallet address
3. Profile modal opens

**Expected Results:**
- ✅ Shows player stats:
  - Wins
  - Losses
  - Total hands
  - Win rate
  - Rank
- ✅ Stats match on-chain data

**Current Status:** ⚠️ Shows zeros/mock data, needs real data from indexer

---

## Test Suite 8: WebSocket Real-Time Updates

### TEST-8.1: Table List Updates
**Priority:** MEDIUM
**Estimated Time:** 2 minutes

**Prerequisites:**
- Two browser windows open
- Different wallets

**Steps:**
1. Window 1: Create table (TEST-4.1)
2. Window 2: Navigate to lobby
3. Observe table appears

**Expected Results:**
- ✅ New table appears in Window 2 within 5 seconds
- ✅ WebSocket connection active (check console)
- ✅ No page refresh needed

**Current Status:** ⚠️ WebSocket client connected, needs indexer to emit events

---

### TEST-8.2: Game State Updates
**Priority:** HIGH
**Estimated Time:** 3 minutes

**Prerequisites:**
- Two browser windows at same table

**Steps:**
1. Window 1: Player 1 at table
2. Window 2: Player 2 at table
3. Window 1: Take action (hit/stand)
4. Observe Window 2

**Expected Results:**
- ✅ Window 2 updates immediately
- ✅ No page refresh needed
- ✅ Actions visible to both players
- ✅ Turn indicator updates

**Current Status:** ⚠️ WebSocket infrastructure ready, needs event emission

---

## Test Suite 9: Error Handling

### TEST-9.1: Insufficient Funds
**Priority:** HIGH
**Estimated Time:** 2 minutes

**Steps:**
1. Use wallet with < bet amount + fee
2. Try to create/join table
3. Observe error

**Expected Results:**
- ✅ Clear error message
- ✅ No transaction submitted
- ✅ UI remains stable

---

### TEST-9.2: Transaction Rejection
**Priority:** HIGH
**Estimated Time:** 1 minute

**Steps:**
1. Start any transaction
2. Reject in Phantom wallet

**Expected Results:**
- ✅ Clear "Transaction rejected" message
- ✅ UI returns to previous state
- ✅ No state corruption

---

### TEST-9.3: Network Timeout
**Priority:** HIGH
**Estimated Time:** 2 minutes

**Steps:**
1. Disconnect internet
2. Try any action

**Expected Results:**
- ✅ Clear error message
- ✅ Retry option available
- ✅ No state corruption

---

## Test Suite 10: Performance

### TEST-10.1: Initial Load Time
**Priority:** MEDIUM

**Expected Results:**
- ✅ Page loads in < 3 seconds
- ✅ No console errors
- ✅ Assets cached properly

---

### TEST-10.2: Concurrent Users
**Priority:** LOW

**Test:**
- 10+ users creating/joining tables simultaneously

**Expected Results:**
- ✅ No RPC rate limiting
- ✅ WebSocket handles connections
- ✅ No transaction collisions

---

## Automated Testing (Future)

### Frontend Tests (Vitest + React Testing Library)
- [ ] Component render tests
- [ ] Wallet connection mocking
- [ ] API call mocking
- [ ] WebSocket message handling
- [ ] User interaction flows

### Backend Tests (Jest)
- [ ] API endpoint tests
- [ ] WebSocket connection tests
- [ ] Indexer event handling
- [ ] Cache functionality
- [ ] Error scenarios

### Smart Contract Tests (Anchor)
- [ ] Table creation
- [ ] Table joining
- [ ] Commit-reveal process
- [ ] Game actions (hit/stand)
- [ ] Settlement logic
- [ ] Username registration

### Integration Tests
- [ ] End-to-end game flow
- [ ] Multi-player scenarios
- [ ] Error recovery
- [ ] Timeout handling

---

## Test Execution Checklist

Before declaring "shippable":
- [ ] All CRITICAL tests pass
- [ ] All HIGH priority tests pass
- [ ] No CRITICAL or HIGH severity bugs
- [ ] Manual testing completed for all suites
- [ ] Performance acceptable
- [ ] Error handling verified

---

## Known Testing Limitations

1. **Blockchain Integration Incomplete:** Many tests marked ⚠️ because transaction calls are TODO
2. **No Automated Tests:** All testing is manual
3. **Mock Data:** Leaderboard and stats use mock data
4. **Single Developer:** Cannot test concurrent scenarios alone

---

## Testing Environment

**Dev Environment:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- WebSocket: ws://localhost:3001
- Network: Solana Mainnet (or Devnet for testing)

**Required Tools:**
- Phantom Wallet
- Browser DevTools
- Solana Explorer (for transaction verification)
- wscat (for WebSocket testing)

---

## Bug Reporting Template

```markdown
**Bug ID:** BUG-XXX
**Severity:** CRITICAL/HIGH/MEDIUM/LOW
**Test Case:** TEST-X.X
**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**

**Actual Behavior:**

**Screenshots/Logs:**

**Environment:**
- Browser:
- Wallet:
- Network:
```

---

## Next Steps

1. Implement blockchain transactions (critical)
2. Complete indexer account parsing
3. Replace mock data with real data
4. Add automated test suites
5. Re-run all manual tests
6. Document any new bugs in KNOWN_ISSUES.md
