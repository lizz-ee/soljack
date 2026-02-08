import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000'),
  wsPort: parseInt(process.env.WS_PORT || '3001'),
  
  rpcUrl: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  wsRpcUrl: process.env.WS_RPC_URL || 'wss://api.mainnet-beta.solana.com',
  
  usernameProgramId: process.env.USERNAME_PROGRAM_ID || '',
  gameProgramId: process.env.GAME_PROGRAM_ID || '',
  
  feeDestinationWallet: process.env.FEE_DESTINATION_WALLET || '7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4',
  
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};