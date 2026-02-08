# SolJack - Next Iteration Guide

**For:** Next Ralph loop iteration or developer
**Created:** 2026-02-08
**Current Status:** 26% complete (6/23 tasks)

---

## Quick Start

The project is buildable and well-documented. Start here:

1. Read `docs/CURRENT_STATE_ASSESSMENT.md` for complete status
2. Read `docs/IMPLEMENTATION_PLAN.md` for task list
3. Read `docs/ARCHITECTURE_AND_BUILD.md` for technical details

**TL;DR:** Build system works, UI is complete, blockchain integration is missing.

---

## Highest Priority: Implement One Complete User Flow

### Recommended: Table Creation Flow

Implement the complete flow for creating a game table. This will validate the entire stack works.

**Steps:**

1. **Read the Smart Contract:**
   ```bash
   cat programs/soljack-game/src/lib.rs
   ```
   Understand:
   - `create_table` instruction parameters
   - `TableAccount` structure
   - Required accounts and seeds
   - Return values

2. **Get the Anchor IDL:**
   The IDL (Interface Definition Language) file should be in:
   ```bash
   programs/target/idl/soljack_game.json
   ```
   If not present, run `anchor build` to generate it.

3. **Install Anchor SDK in Frontend:**
   Already installed as @coral-xyz/anchor 0.29.0

4. **Create Anchor Program Client:**
   In `frontend/src/lib/anchor.ts` (new file):
   ```typescript
   import { AnchorProvider, Program } from '@coral-xyz/anchor';
   import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
   import idl from './idl/soljack_game.json';

   export function useGameProgram() {
     const { connection } = useConnection();
     const wallet = useAnchorWallet();

     if (!wallet) return null;

     const provider = new AnchorProvider(connection, wallet, {});
     const programId = import.meta.env.VITE_GAME_PROGRAM_ID;
     return new Program(idl, programId, provider);
   }
   ```

5. **Implement createTable in CreateTableModal:**
   In `frontend/src/components/Lobby.tsx`:
   ```typescript
   import { useGameProgram } from '../lib/anchor';

   const program = useGameProgram();

   const handleCreate = async () => {
     if (!selectedRole || !program) return;

     try {
       const [tablePda] = await PublicKey.findProgramAddress(
         [Buffer.from("table"), new BN(Date.now()).toArrayLike(Buffer, 'le', 8)],
         program.programId
       );

       const tx = await program.methods
         .createTable(
           new BN(betTier * 1e9), // bet amount in lamports
           { [selectedRole.toLowerCase()]: {} }, // role enum
           new BN(Date.now()) // table seed
         )
         .accounts({
           creator: wallet.publicKey,
           tableAccount: tablePda,
           systemProgram: SystemProgram.programId,
         })
         .rpc();

       console.log('Table created:', tx);
       onCreated(tablePda.toString());
       onClose();
     } catch (error) {
       console.error('Failed to create table:', error);
       alert('Failed to create table: ' + error.message);
     }
   };
   ```

6. **Test End-to-End:**
   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd frontend && npm run dev`
   - Connect Phantom wallet
   - Select bet tier
   - Click "Create Table"
   - Choose role
   - Click "Create Table" button
   - Sign transaction in Phantom
   - Verify:
     - Transaction confirms on Solana
     - Backend indexer logs show account change
     - WebSocket event broadcast
     - UI updates to show table

7. **Debug Common Issues:**
   - **"Account not found":** PDA derivation wrong, check seeds
   - **"Insufficient funds":** User needs more SOL (bet + 0.001 fee + gas)
   - **"Invalid account data":** IDL version mismatch with deployed program
   - **Transaction timeout:** RPC slow, increase timeout or use paid RPC

---

## Second Priority: Complete Indexer

With table creation working, complete the indexer to track game state.

**Steps:**

1. **Get Account Codec:**
   ```typescript
   import { BorshAccountsCoder } from '@coral-xyz/anchor';
   import idl from './idl/soljack_game.json';

   const coder = new BorshAccountsCoder(idl);
   ```

2. **Parse TableAccount in Indexer:**
   In `backend/src/indexer.ts`:
   ```typescript
   function handleGameAccountChange(accountInfo: any, context: any) {
     try {
       const data = accountInfo.accountInfo.data;
       const decoded = coder.decode('TableAccount', data);

       const event = {
         event: determineEventType(decoded),
         tableId: decoded.tableId.toString(),
         state: decoded.state,
         creator: decoded.creator.toString(),
         opponent: decoded.opponent?.toString(),
         betAmount: decoded.betAmount.toString(),
         // ... other fields
       };

       broadcastToTable(event.tableId, event);
       updateCache(event); // Store in Redis
     } catch (error) {
       console.error('Error parsing table account:', error);
     }
   }

   function determineEventType(table: any): string {
     if (table.opponent === null) return 'table_created';
     if (table.state === 'Committing') return 'player_joined';
     if (table.state === 'Playing') return 'hand_started';
     if (table.state === 'Settled') return 'hand_settled';
     return 'table_updated';
   }
   ```

3. **Update Cache/Database:**
   Store indexed data so API routes can query it instead of returning mocks.

4. **Update API Routes:**
   Replace mock data in:
   - `backend/src/routes/tables.ts` - query indexed tables
   - `backend/src/routes/leaderboard.ts` - query indexed wins/losses
   - `backend/src/routes/stats.ts` - query aggregated stats

---

## Third Priority: Complete Other Transactions

With the pattern established, implement remaining transactions:

1. **join_table:** Similar to create_table
2. **claim_username:** In UsernameModal component
3. **hit / stand:** In Table component during game
4. **submit_commitment / reveal_seed:** In Table component during shuffle

**Pattern for Each:**
- Create hook: `useGameProgram()` or `useUsernameProgram()`
- Build transaction with `.methods.instructionName(params)`
- Specify accounts with `.accounts({})`
- Call `.rpc()` to submit and wait for confirmation
- Handle errors with try/catch
- Update UI on success

---

## Fourth Priority: Polish and Testing

Once core functionality works:

1. **Add Loading States:**
   ```typescript
   const [loading, setLoading] = useState(false);

   const handleCreate = async () => {
     setLoading(true);
     try {
       // ... transaction
     } finally {
       setLoading(false);
     }
   };

   <button disabled={loading}>
     {loading ? 'Creating...' : 'Create Table'}
   </button>
   ```

2. **Add Success/Error Toasts:**
   - Install react-toastify or similar
   - Show transaction hash link on success
   - Show user-friendly error messages

3. **Write Tests:**
   - Add Vitest to frontend
   - Test components render
   - Test transaction building (without submitting)
   - Test WebSocket message handling

4. **Manual Testing Checklist:**
   - [ ] Connect wallet
   - [ ] Register username
   - [ ] Create table as dealer
   - [ ] Join table as player (different wallet)
   - [ ] Play hand to completion
   - [ ] Verify payout
   - [ ] Check leaderboard updates
   - [ ] Check stats update
   - [ ] Test disconnect/reconnect
   - [ ] Test transaction failures

---

## Common Pitfalls

### 1. Program ID Mismatch
**Problem:** Transaction fails with "Invalid program ID"
**Solution:** Ensure VITE_GAME_PROGRAM_ID in .env matches deployed program

### 2. IDL Version Mismatch
**Problem:** Account deserialization fails
**Solution:** Rebuild with `anchor build` to regenerate IDL matching deployed code

### 3. PDA Derivation Wrong
**Problem:** "Account not found" error
**Solution:** Seeds must exactly match those in smart contract, check byte order

### 4. Insufficient Funds
**Problem:** Transaction fails silently
**Solution:** Check user has: bet amount + 0.001 SOL fee + ~0.00001 SOL gas

### 5. RPC Rate Limiting
**Problem:** Slow or failed requests
**Solution:** Use Helius/Alchemy paid RPC, not free api.mainnet-beta.solana.com

### 6. WebSocket Subscription Missed Events
**Problem:** Indexer doesn't see all account changes
**Solution:** Use onProgramAccountChange with 'confirmed' commitment, or poll as fallback

### 7. Frontend Build Includes Backend Code
**Problem:** Build fails with "fs not found" or similar
**Solution:** Ensure frontend imports only frontend code, backend uses separate build

---

## Files You'll Need to Modify

**High Priority:**
1. `frontend/src/lib/anchor.ts` (create) - Anchor program hooks
2. `frontend/src/components/Lobby.tsx` - createTable transaction
3. `frontend/src/components/Lobby.tsx` - joinTable transaction
4. `frontend/src/components/UsernameModal.tsx` - claimUsername transaction
5. `frontend/src/components/Table.tsx` - game action transactions
6. `backend/src/indexer.ts` - account deserialization
7. `backend/src/routes/*.ts` - replace mock data with real queries

**Medium Priority:**
8. `frontend/src/context/GameContext.tsx` - handle more WebSocket events
9. `backend/src/cache.ts` - store indexed data structures
10. Add loading/error UI to all components

**Low Priority:**
11. Write tests
12. Add monitoring
13. Optimize bundle size

---

## Useful Commands

```bash
# Development
cd frontend && npm run dev          # Start frontend on :5173
cd backend && npm run dev           # Start backend on :3000, WS on :3001

# Building
cd frontend && npm run build        # Build frontend to dist/
cd backend && npm run build         # Build backend to dist/
cd programs && anchor build         # Build smart contracts

# Testing (once tests exist)
cd frontend && npm test
cd backend && npm test
cd programs && anchor test

# Debugging
# Backend logs to console
# Frontend logs to browser console
# Check browser Network tab for API/WS traffic
# Use Solana Explorer to verify transactions

# Smart Contract Inspection
solana program show PROGRAM_ID                    # View program info
solana account ACCOUNT_PUBKEY                     # View raw account data
anchor idl fetch PROGRAM_ID -o idl.json           # Fetch IDL from chain
```

---

## Success Criteria

You'll know you're done when:

1. ✅ User can connect Phantom wallet
2. ✅ User can register username (transaction confirms)
3. ✅ User can create a table (transaction confirms, appears in lobby)
4. ✅ Second user can join the table (transaction confirms)
5. ✅ Both users see real-time updates via WebSocket
6. ✅ Users can play cards (hit/stand)
7. ✅ Hand settles and SOL is transferred correctly
8. ✅ Leaderboard updates with real wins/losses
9. ✅ Stats page shows accurate data
10. ✅ No CRITICAL or HIGH severity bugs remain

---

## Resources

**Solana Development:**
- https://solana.com/docs
- https://docs.rs/solana-program/latest/solana_program/
- https://book.anchor-lang.com/

**Anchor Framework:**
- https://www.anchor-lang.com/docs
- https://github.com/coral-xyz/anchor

**Wallet Adapter:**
- https://github.com/solana-labs/wallet-adapter

**Testing Tools:**
- https://explorer.solana.com/ - Mainnet explorer
- https://solscan.io/ - Alternative explorer
- https://solana.fm/ - Transaction analyzer
- wscat - WebSocket testing tool

---

## Questions to Answer

If stuck, consider:

1. **Do I have the correct IDL?** Check `programs/target/idl/soljack_game.json`
2. **Are program IDs correct?** Check `.env` files match `programs/Anchor.toml`
3. **Is the program actually deployed?** Check Solana Explorer
4. **Do I have enough SOL?** Check wallet balance covers bet + fees
5. **Is RPC working?** Try curl to test endpoint
6. **Is WebSocket connecting?** Check browser console for connection logs
7. **Is backend running?** Check ports 3000 and 3001 are listening

---

## Good Luck!

The hard part (architecture, build system, documentation) is done. The remaining work is mostly:
1. Copy-paste similar transaction patterns
2. Handle errors gracefully
3. Test thoroughly

You've got this! 🚀
