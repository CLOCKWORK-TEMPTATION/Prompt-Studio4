import Redis from 'ioredis';

// Use environment variable or default to localhost
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
    private static instance: Redis | null = null;

    static getInstance(): Redis {
        if (!RedisClient.instance) {
            RedisClient.instance = new Redis(REDIS_URL, {
                maxRetriesPerRequest: 3,
                retryStrategy(times) {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                lazyConnect: true, // Don't crash if Redis is not immediately available
            });

            RedisClient.instance.on('error', (error) => {
                // Suppress connection errors to avoid spamming logs in dev without Redis
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('Redis connection warning (ensure Redis is running for collaboration features):', error.message);
                } else {
                    console.error('Redis connection error:', error);
                }
            });

            RedisClient.instance.on('connect', () => {
                console.log('✅ Redis connected');
            });
        }
        return RedisClient.instance;
    }
}

export const redis = RedisClient.getInstance();
export default redis;
