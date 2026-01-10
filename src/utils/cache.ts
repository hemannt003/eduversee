import { RedisClientType } from 'redis';
import { createClient } from 'redis';

let redisClient: RedisClientType | null = null;

// Initialize Redis client
const initRedis = async () => {
  if (process.env.REDIS_HOST && !redisClient) {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
  }
};

initRedis().catch(console.error);

export const cache = {
  get: async (key: string): Promise<string | null> => {
    if (!redisClient) return null;
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  set: async (
    key: string,
    value: string,
    expirationSeconds?: number
  ): Promise<void> => {
    if (!redisClient) return;
    try {
      if (expirationSeconds) {
        await redisClient.setEx(key, expirationSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  del: async (key: string): Promise<void> => {
    if (!redisClient) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  clearPattern: async (pattern: string): Promise<void> => {
    if (!redisClient) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Cache clear pattern error:', error);
    }
  },
};
