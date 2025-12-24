/**
 * Security Middleware
 *
 * Implements rate limiting, input validation, and security headers
 * for protecting the API from abuse and attacks.
 */

import { Request, Response, NextFunction } from "express";

// ============================================================
// Rate Limiting
// ============================================================

// ============================================================
// Redis Rate Limiting (Distributed)
// ============================================================

import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";

// Use existing REDIS_URL or default to localhost
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  enableOfflineQueue: false,
});

redisClient.on("error", (err) => {
  console.error("Redis Rate Limiter Error:", err);
});

interface RateLimitConfig {
  points: number;          // Number of points
  duration: number;        // Per second(s)
  keyPrefix: string;       // Key prefix
  message: string;         // Error message
}

export function createRedisRateLimiter(config: RateLimitConfig) {
  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: config.points,
    duration: config.duration,
    keyPrefix: config.keyPrefix,
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers["x-user-id"] ? String(req.headers["x-user-id"]) : (req.ip || "unknown");

    rateLimiter.consume(key)
      .then(() => {
        next();
      })
      .catch((rejRes) => {
        const retrySecs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set("Retry-After", String(retrySecs));
        res.status(429).json({
          error: config.message,
          retryAfter: retrySecs,
        });
      });
  };
}

// ============================================================
// Pre-configured Rate Limiters
// ============================================================

/**
 * General API rate limiter
 * 100 requests per minute
 */
export const generalRateLimiter = createRedisRateLimiter({
  points: 100,
  duration: 60,
  keyPrefix: "rl_general",
  message: "تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى لاحقاً.",
});

/**
 * AI endpoint rate limiter (more restrictive)
 * 20 requests per minute
 */
export const aiRateLimiter = createRedisRateLimiter({
  points: 20,
  duration: 60,
  keyPrefix: "rl_ai",
  message: "تم تجاوز الحد الأقصى لطلبات AI. يرجى الانتظار قليلاً.",
});

/**
 * Authentication endpoint rate limiter
 * 10 requests per 15 minutes (900 seconds)
 */
export const authRateLimiter = createRedisRateLimiter({
  points: 10,
  duration: 15 * 60,
  keyPrefix: "rl_auth",
  message: "محاولات كثيرة جداً. يرجى المحاولة مرة أخرى بعد 15 دقيقة.",
});

/**
 * File upload rate limiter
 * 5 uploads per hour (3600 seconds)
 */
export const uploadRateLimiter = createRedisRateLimiter({
  points: 5,
  duration: 3600,
  keyPrefix: "rl_upload",
  message: "تم تجاوز الحد الأقصى لرفع الملفات. يرجى المحاولة لاحقاً.",
});

// ============================================================
// Security Headers
// ============================================================

/**
 * Add security headers to responses
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent XSS attacks
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Strict transport security (HTTPS only in production)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Content Security Policy
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' wss: ws: https:;"
  );

  // Remove Express identification header
  res.removeHeader("X-Powered-By");

  next();
}

// ============================================================
// Input Validation Helpers
// ============================================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate and sanitize request body
 */
export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = deepSanitize(req.body);
  }
  next();
}

function deepSanitize(obj: any): any {
  if (typeof obj === "string") {
    // Only sanitize suspicious patterns, not all strings
    if (/<script|javascript:|on\w+\s*=/i.test(obj)) {
      return sanitizeString(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }
  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      // Also sanitize keys
      const sanitizedKey = /^[\w\-$]+$/.test(key) ? key : sanitizeString(key);
      sanitized[sanitizedKey] = deepSanitize(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Validate content length
 */
export function validateContentLength(maxBytes: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: `حجم الطلب كبير جداً. الحد الأقصى المسموح: ${Math.round(maxBytes / 1024)}KB`,
      });
    }
    next();
  };
}

// ============================================================
// Request ID Middleware
// ============================================================

/**
 * Add unique request ID for tracing
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers["x-request-id"] as string ||
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-ID", id);
  next();
}

// ============================================================
// Export all security middleware
// ============================================================

/**
 * CSRF Protection middleware using Origin/Referer check
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Safe methods don't need CSRF protection
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  // In production, we must have a valid origin or referer that matches our host
  if (process.env.NODE_ENV === "production") {
    if (!origin && !referer) {
      return res.status(403).json({ error: "طلب غير مصرح به (CSRF Protection)" });
    }

    const source = origin || referer;
    if (source && host && !source.includes(host)) {
      return res.status(403).json({ error: "مصدر الطلب غير موثوق (CSRF Protection)" });
    }
  }

  next();
}

export const securityMiddleware = {
  securityHeaders,
  csrfProtection,
  generalRateLimiter,
  aiRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
  sanitizeBody,
  validateContentLength,
  requestId,
  createRateLimiter,
};
