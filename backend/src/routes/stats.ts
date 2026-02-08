import { FastifyRequest, FastifyReply } from 'fastify';
import { getCache, setCache } from '../cache';

export async function getStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Check cache first
    const cached = await getCache('platform:stats');
    if (cached) {
      return JSON.parse(cached);
    }

    // TODO: Query blockchain/database for actual stats
    const stats = {
      totalHands: 15234,
      activeTables: 12,
      totalVolume: 1234.56,
      dealerWinRate: 0.48,
      playerWinRate: 0.47,
    };

    // Cache for 30 seconds
    await setCache('platform:stats', JSON.stringify(stats), 30);

    return stats;
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch stats' });
  }
}