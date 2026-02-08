import { FastifyInstance } from 'fastify';
import { getStats } from './stats';
import { getLeaderboard } from './leaderboard';
import { getOpenTables, getTableById } from './tables';
import { getPlayerStats } from './player';

export function registerRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  });

  // Platform stats
  fastify.get('/stats', getStats);

  // Leaderboard
  fastify.get('/leaderboard', getLeaderboard);

  // Tables
  fastify.get('/tables/open', getOpenTables);
  fastify.get('/tables/:tableId', getTableById);

  // Player stats
  fastify.get('/player/:wallet/stats', getPlayerStats);
}