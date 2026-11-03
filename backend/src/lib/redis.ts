import { Redis } from 'ioredis';

/**
 * Resilient Redis Client.
 * Automatically fails over to a high-performance in-memory cache if Redis is not configured or offline.
 */
class ResilientCache {
  private inMemory = new Map<string, { value: string; expiry: number }>();
  private client: Redis | null = null;
  public isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && redisUrl !== 'redis://127.0.0.1:6379') {
      try {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          retryStrategy: () => null
        });

        this.client.connect().then(() => {
          this.isConnected = true;
          console.log(`⚡️ Redis Cache connected successfully to ${redisUrl.replace(/\/\/.*@/, '//<credentials>@')}`);
        }).catch(err => {
          console.warn('⚠️ External Redis unavailable, switching to in-memory cache:', err.message);
          this.isConnected = false;
        });

        this.client.on('error', () => {
          this.isConnected = false;
        });
      } catch (err) {
        this.isConnected = false;
      }
    } else {
      console.log('⚡️ Running in high-speed in-memory cache mode (Render Free Compatible).');
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (e) {
        this.isConnected = false;
      }
    }
    const item = this.inMemory.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.inMemory.delete(key);
      return null;
    }
    return item.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.setex(key, seconds, value);
      } catch (e) {
        this.isConnected = false;
      }
    }
    this.inMemory.set(key, { value, expiry: Date.now() + seconds * 1000 });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.del(key);
      } catch (e) {
        this.isConnected = false;
      }
    }
    return this.inMemory.delete(key) ? 1 : 0;
  }
}

export const redis = new ResilientCache();
