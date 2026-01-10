import { RedisClientType } from 'redis';
import { createClient } from 'redis';

let redisClient: RedisClientType | null = null;
let isConnecting = false;
let connectionPromise: Promise<void> | null = null;

// Initialize Redis client
const initRedis = async (): Promise<void> => {
  if (process.env.REDIS_HOST && !redisClient && !isConnecting) {
    isConnecting = true;
    try {
      redisClient = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        redisClient = null;
        isConnecting = false;
        connectionPromise = null; // Reset promise on error
      });

      await redisClient.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      redisClient = null;
      connectionPromise = null; // Reset promise on failure
    } finally {
      isConnecting = false;
    }
  }
};

// Ensure Redis is connected before operations
const ensureConnected = async (): Promise<boolean> => {
  if (redisClient) {
    try {
      // Check if client is still connected
      await redisClient.ping();
      return true;
    } catch (error) {
      // Client disconnected, reset
      redisClient = null;
      connectionPromise = null; // Reset promise on disconnect
    }
  }

  if (!isConnecting && !connectionPromise) {
    connectionPromise = initRedis();
  }

  if (connectionPromise) {
    try {
      await connectionPromise;
    } catch (error) {
      // Promise rejected, reset it to allow retry
      connectionPromise = null;
    } finally {
      // Only set to null if we successfully completed
      if (redisClient) {
        connectionPromise = null;
      }
    }
  }

  return redisClient !== null;
};

// Initialize on module load (non-blocking)
initRedis().catch((error) => {
  console.error('Redis initialization error:', error);
});

export const cache = {
  get: async (key: string): Promise<string | null> => {
    if (!(await ensureConnected()) || !redisClient) return null;
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
    if (!(await ensureConnected()) || !redisClient) return;
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
    if (!(await ensureConnected()) || !redisClient) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  clearPattern: async (pattern: string): Promise<void> => {
    if (!(await ensureConnected()) || !redisClient) return;
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
