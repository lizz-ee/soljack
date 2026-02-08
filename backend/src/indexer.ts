import { Connection, PublicKey } from '@solana/web3.js';
import { config } from './config';
import { broadcastToTable, broadcastToAll } from './websocket';

let connection: Connection;

export function initIndexer() {
  connection = new Connection(config.rpcUrl, {
    wsEndpoint: config.wsRpcUrl,
  });

  // Subscribe to game program account changes
  if (config.gameProgramId) {
    subscribeToGameProgram();
  }

  // Subscribe to username program account changes
  if (config.usernameProgramId) {
    subscribeToUsernameProgram();
  }
}

function subscribeToGameProgram() {
  try {
    const programId = new PublicKey(config.gameProgramId);

    connection.onProgramAccountChange(
      programId,
      (accountInfo, context) => {
        handleGameAccountChange(accountInfo, context);
      },
      'confirmed'
    );

    console.log('✅ Subscribed to game program:', config.gameProgramId);
  } catch (error) {
    console.error('Failed to subscribe to game program:', error);
  }
}

function subscribeToUsernameProgram() {
  try {
    const programId = new PublicKey(config.usernameProgramId);

    connection.onProgramAccountChange(
      programId,
      (accountInfo, context) => {
        handleUsernameAccountChange(accountInfo, context);
      },
      'confirmed'
    );

    console.log('✅ Subscribed to username program:', config.usernameProgramId);
  } catch (error) {
    console.error('Failed to subscribe to username program:', error);
  }
}

function handleGameAccountChange(accountInfo: any, context: any) {
  try {
    // TODO: Decode account data and determine event type
    // Parse table state and broadcast appropriate WebSocket events
    
    // Example events:
    // - table_created
    // - player_joined
    // - deck_shuffling
    // - hand_started
    // - card_dealt
    // - turn_changed
    // - hand_settled
    // - table_closed

    const mockTableId = '12345';
    const mockEvent = {
      event: 'player_joined',
      tableId: mockTableId,
      opponent: '9XmT5pQr8uYnLmKp3NbVwZxRtCdEfGhIj4AsBcDeF1Gh',
      state: 'COMMITTING',
    };

    broadcastToTable(mockTableId, mockEvent);
  } catch (error) {
    console.error('Error handling game account change:', error);
  }
}

function handleUsernameAccountChange(accountInfo: any, context: any) {
  try {
    // TODO: Decode username claim events
    // Update leaderboard cache if needed
    console.log('Username account changed');
  } catch (error) {
    console.error('Error handling username account change:', error);
  }
}