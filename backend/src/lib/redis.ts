import { Redis } from 'ioredis';

// Connect to the local Docker Redis container
export const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
});

redis.on('connect', () => {
  console.log('⚡️ Redis Cache memory connected on port 6379');
});

redis.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});