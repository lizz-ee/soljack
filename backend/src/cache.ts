import { createClient } from 'redis';
import { config } from './config';

let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    try {
      redisClient = createClient({ url: config.redisUrl });
      await redisClient.connect();
      console.log('✅ Redis connected');
    } catch (error) {
      console.warn('⚠️  Redis unavailable, using in-memory cache');
      return null;
    }
  }
  return redisClient;
}

// In-memory fallback cache
const memoryCache = new Map<string, { value: string; expiry: number }>();

export async function getCache(key: string): Promise<string | null> {
  const client = await getRedisClient();
  
  if (client) {
    try {
      return await client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
    }
  }

  // Fallback to memory cache
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  return null;
}

export async function setCache(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  const client = await getRedisClient();
  
  if (client) {
    try {
      await client.setEx(key, ttlSeconds, value);
      return;
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

export async function deleteCache(key: string): Promise<void> {
  const client = await getRedisClient();
  
  if (client) {
    try {
      await client.del(key);
      return;
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  memoryCache.delete(key);
}