import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 100, 2000);
  }
});

redis.on('connect', () => {
  console.log(`⚡️ Redis Cache connected successfully to ${redisUrl.replace(/\/\/.*@/, '//<credentials>@')}`);
});

redis.on('error', (err) => {
  console.warn('⚠️ Redis Cache warning (running in graceful fallback mode):', err.message);
});
