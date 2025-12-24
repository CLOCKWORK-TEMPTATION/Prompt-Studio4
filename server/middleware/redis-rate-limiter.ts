import { Request, Response, NextFunction } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "../lib/redis";

/**
 * Redis-based Rate Limiting Middleware
 * Provides distributed rate limiting across multiple server instances
 */

// Rate limiting configurations
const rateLimitConfigs = {
    // General API rate limiter
    general: {
        storeClient: redisClient,
        keyGen: (req: Request) => getClientIP(req),
        points: 100, // Number of requests
        duration: 60, // Per 60 seconds
        blockDuration: 60, // Block for 60 seconds
    },

    // AI endpoint rate limiter (more restrictive)
    ai: {
        storeClient: redisClient,
        keyGen: (req: Request) => getClientIP(req),
        points: 20, // Number of requests
        duration: 60, // Per 60 seconds
        blockDuration: 300, // Block for 5 minutes
    },

    // Authentication endpoint rate limiter
    auth: {
        storeClient: redisClient,
        keyGen: (req: Request) => getClientIP(req),
        points: 10, // Number of requests
        duration: 900, // Per 15 minutes
        blockDuration: 900, // Block for 15 minutes
    },

    // File upload rate limiter
    upload: {
        storeClient: redisClient,
        keyGen: (req: Request) => getClientIP(req),
        points: 5, // Number of uploads
        duration: 3600, // Per 1 hour
        blockDuration: 3600, // Block for 1 hour
    },

    // User-specific rate limiter (includes user ID in key)
    user: {
        storeClient: redisClient,
        keyGen: (req: Request) => {
            const ip = getClientIP(req);
            const userId = (req as any).user?.id;
            return userId ? `user:${userId}:${ip}` : `ip:${ip}`;
        },
        points: 1000, // Number of requests
        duration: 60, // Per 60 seconds
        blockDuration: 60, // Block for 60 seconds
    }
};

// Create rate limiters
export const generalRateLimiter = new RateLimiterRedis(rateLimitConfigs.general);
export const aiRateLimiter = new RateLimiterRedis(rateLimitConfigs.ai);
export const authRateLimiter = new RateLimiterRedis(rateLimitConfigs.auth);
export const uploadRateLimiter = new RateLimiterRedis(rateLimitConfigs.upload);
export const userRateLimiter = new RateLimiterRedis(rateLimitConfigs.user);

/**
 * Get client IP address, handling proxies
 */
function getClientIP(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
        return forwarded[0].split(",")[0].trim();
    }
    return req.ip || req.connection.remoteAddress || "unknown";
}

/**
 * Create rate limiting middleware
 */
function createRateLimitMiddleware(rateLimiter: RateLimiterRedis) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const key = rateLimiter.getKeyGen()(req);
            await rateLimiter.consume(key);

            // Add rate limit headers
            res.set({
                "X-RateLimit-Limit": rateLimiter.points,
                "X-RateLimit-Remaining": Math.max(0, rateLimiter.points - 1),
                "X-RateLimit-Reset": new Date(Date.now() + rateLimiter.duration * 1000).toISOString(),
            });

            next();
        } catch (rejRes: any) {
            // Rate limit exceeded
            const retryAfter = Math.round(rejRes.msBeforeNext / 1000) || 1;

            res.set({
                "Retry-After": String(retryAfter),
                "X-RateLimit-Limit": rateLimiter.points,
                "X-RateLimit-Remaining": 0,
                "X-RateLimit-Reset": new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
            });

            res.status(429).json({
                error: "تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى لاحقاً.",
                retryAfter,
                code: "RATE_LIMIT_EXCEEDED"
            });
        }
    };
}

/**
 * Enhanced rate limiting middleware with user context
 */
export function createEnhancedRateLimiter(rateLimiter: RateLimiterRedis) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Check if user is authenticated
            const userId = (req as any).user?.id;

            if (userId) {
                // Use user-specific rate limiting
                const userKey = `user:${userId}:${getClientIP(req)}`;
                await userRateLimiter.consume(userKey);

                res.set({
                    "X-RateLimit-Limit": userRateLimiter.points,
                    "X-RateLimit-Remaining": Math.max(0, userRateLimiter.points - 1),
                    "X-RateLimit-Reset": new Date(Date.now() + userRateLimiter.duration * 1000).toISOString(),
                    "X-RateLimit-Type": "user"
                });
            } else {
                // Use IP-based rate limiting
                const ipKey = getClientIP(req);
                await rateLimiter.consume(ipKey);

                res.set({
                    "X-RateLimit-Limit": rateLimiter.points,
                    "X-RateLimit-Remaining": Math.max(0, rateLimiter.points - 1),
                    "X-RateLimit-Reset": new Date(Date.now() + rateLimiter.duration * 1000).toISOString(),
                    "X-RateLimit-Type": "ip"
                });
            }

            next();
        } catch (rejRes: any) {
            const retryAfter = Math.round(rejRes.msBeforeNext / 1000) || 1;

            res.set({
                "Retry-After": String(retryAfter),
                "X-RateLimit-Reset": new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
            });

            res.status(429).json({
                error: "تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى لاحقاً.",
                retryAfter,
                code: "RATE_LIMIT_EXCEEDED"
            });
        }
    };
}

/**
 * Rate limiting middleware for sensitive endpoints
 */
export function createStrictRateLimiter(rateLimiter: RateLimiterRedis) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const key = rateLimiter.getKeyGen()(req);
            const resRateLimiter = await rateLimiter.consume(key);

            // Add detailed headers for debugging
            res.set({
                "X-RateLimit-Limit": rateLimiter.points,
                "X-RateLimit-Remaining": resRateLimiter.remainingPoints,
                "X-RateLimit-Reset": new Date(Date.now() + resRateLimiter.msBeforeNext).toISOString(),
                "X-RateLimit-Blocked": resRateLimiter.msBeforeNext > 0 ? "true" : "false"
            });

            next();
        } catch (rejRes: any) {
            const retryAfter = Math.round(rejRes.msBeforeNext / 1000) || 1;

            // Log rate limit violations for monitoring
            console.warn(`Rate limit exceeded for IP: ${getClientIP(req)}, Key: ${rateLimiter.getKeyGen()(req)}`);

            res.set({
                "Retry-After": String(retryAfter),
                "X-RateLimit-Reset": new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
                "X-RateLimit-Blocked": "true"
            });

            res.status(429).json({
                error: "تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى لاحقاً.",
                retryAfter,
                code: "RATE_LIMIT_EXCEEDED",
                blockedUntil: new Date(Date.now() + rejRes.msBeforeNext).toISOString()
            });
        }
    };
}

// Export middleware instances
export const redisRateLimiters = {
    general: createRateLimitMiddleware(generalRateLimiter),
    ai: createRateLimitMiddleware(aiRateLimiter),
    auth: createStrictRateLimiter(authRateLimiter),
    upload: createStrictRateLimiter(uploadRateLimiter),
    user: createEnhancedRateLimiter(userRateLimiter),
    create: createRateLimitMiddleware
};

// Health check for Redis connection
export async function checkRateLimitHealth(): Promise<boolean> {
    try {
        await redisClient.ping();
        return true;
    } catch (error) {
        console.error("Redis rate limiter health check failed:", error);
        return false;
    }
}