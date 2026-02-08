import { FastifyRequest, FastifyReply } from 'fastify';
import { getCache, setCache } from '../cache';

interface LeaderboardQuery {
  limit?: string;
}

export async function getLeaderboard(
  request: FastifyRequest<{ Querystring: LeaderboardQuery }>,
  reply: FastifyReply
) {
  try {
    const limit = parseInt(request.query.limit || '100');

    // Check cache
    const cacheKey = leaderboard:${limit};
    const cached = await getCache(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // TODO: Query database for actual leaderboard
    const leaderboard = [
      {
        rank: 1,
        username: 'CryptoKing',
        wallet: '7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4',
        wins: 87,
        losses: 12,
        totalHands: 99,
      },
      {
        rank: 2,
        username: null,
        wallet: '9XmT5pQr8uYnLmKp3NbVwZxRtCdEfGhIj4AsBcDeF1Gh',
        wins: 76,
        losses: 20,
        totalHands: 96,
      },
    ];

    // Cache for 30 seconds
    await setCache(cacheKey, JSON.stringify({ leaderboard }), 30);

    return { leaderboard };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch leaderboard' });
  }
}