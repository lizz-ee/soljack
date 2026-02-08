import { FastifyRequest, FastifyReply } from 'fastify';
import { getCache } from '../cache';

interface OpenTablesQuery {
  betAmount?: string;
}

interface TableParams {
  tableId: string;
}

export async function getOpenTables(
  request: FastifyRequest<{ Querystring: OpenTablesQuery }>,
  reply: FastifyReply
) {
  try {
    const betAmount = request.query.betAmount;

    // TODO: Query blockchain/database for open tables
    const tables = [
      {
        tableId: '12345',
        betAmount: 100000000,
        creator: '7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4',
        creatorUsername: 'SolanaQueen',
        creatorRole: 'DEALER',
        openRole: 'PLAYER',
        creatorStats: {
          wins: 45,
          losses: 18,
          totalHands: 63,
        },
        timeRemaining: 142,
        createdAt: Date.now() - 38000,
      },
    ];

    const filtered = betAmount
      ? tables.filter((t) => t.betAmount.toString() === betAmount)
      : tables;

    return { tables: filtered };
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch open tables' });
  }
}

export async function getTableById(
  request: FastifyRequest<{ Params: TableParams }>,
  reply: FastifyReply
) {
  try {
    const { tableId } = request.params;

    // TODO: Query blockchain for table data
    const table = {
      tableId,
      state: 'ACTIVE',
      betAmount: 100000000,
      creator: '7KwQDkHVKGJ5BQ89JN83XeG1kvWdFHhf7QH5o67jiym4',
      opponent: '9XmT5pQr8uYnLmKp3NbVwZxRtCdEfGhIj4AsBcDeF1Gh',
      creatorRole: 'DEALER',
      handNumber: 3,
      currentTurn: 'PLAYER',
      turnDeadline: Date.now() + 45000,
      creatorHand: [10, 7],
      opponentHand: [3, 8, 5],
      creatorTotal: 17,
      opponentTotal: 16,
      deckRemaining: 38,
    };

    return table;
  } catch (error) {
    reply.code(404).send({ error: 'Table not found' });
  }
}