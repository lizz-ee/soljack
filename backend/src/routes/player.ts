import { FastifyRequest, FastifyReply } from 'fastify';
import { getCache, setCache } from '../cache';

interface PlayerParams {
  wallet: string;
}

export async function getPlayerStats(
  request: FastifyRequest<{ Params: PlayerParams }>,
  reply: FastifyReply
) {
  try {
    const { wallet } = request.params;

    // Check cache
    const cacheKey = `player:${wallet}:stats`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // TODO: Query blockchain/database for player stats
    const stats = {
      wallet,
      username: null,
      wins: 0,
      losses: 0,
      totalHands: 0,
      rank: null,
      totalWagered: 0,
      totalWon: 0,
    };

    // Cache for 60 seconds
    await setCache(cacheKey, JSON.stringify(stats), 60);

    return stats;
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch player stats' });
  }
}
