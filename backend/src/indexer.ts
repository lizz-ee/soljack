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
    // TODO: Use Anchor BorshAccountsCoder to properly decode account data
    // For now, we log the event and broadcast a generic update

    const data = accountInfo.accountInfo.data;
    const pubkey = accountInfo.accountId.toString();

    console.log(`Game account changed: ${pubkey} (${data.length} bytes)`);

    // Determine event type based on account data patterns
    // This is a placeholder until proper Anchor IDL deserialization is implemented
    const eventType = determineEventType(data);

    const event = {
      event: eventType,
      tableId: pubkey,
      timestamp: Date.now(),
      context: {
        slot: context.slot,
      },
    };

    // Broadcast to all clients for now (until we can parse table ID properly)
    broadcastToAll(event);

    console.log(`Broadcast event: ${eventType} for table ${pubkey}`);
  } catch (error) {
    console.error('Error handling game account change:', error);
  }
}

function determineEventType(data: Buffer): string {
  // Placeholder logic - should use Anchor deserialization
  // For now, just return a generic update event
  // TODO: Decode TableAccount struct and check state field
  return 'table_updated';
}

function handleUsernameAccountChange(accountInfo: any, context: any) {
  try {
    // TODO: Use Anchor BorshAccountsCoder to properly decode account data
    const pubkey = accountInfo.accountId.toString();
    console.log(`Username account changed: ${pubkey}`);

    // Broadcast username registration event
    const event = {
      event: 'username_claimed',
      account: pubkey,
      timestamp: Date.now(),
    };

    broadcastToAll(event);
  } catch (error) {
    console.error('Error handling username account change:', error);
  }
}