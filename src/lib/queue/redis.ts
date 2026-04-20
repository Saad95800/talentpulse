import { Redis } from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // BullMQ nécessite cette option à null
};

// Singleton pour la connexion Redis
let redisInstance: Redis;

export function getRedisConnection() {
  if (!redisInstance) {
    redisInstance = new Redis(redisConfig);
  }
  return redisInstance;
}

export const connection = getRedisConnection();
