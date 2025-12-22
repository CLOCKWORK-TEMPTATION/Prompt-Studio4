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

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message: string;       // Error message when limit exceeded
  keyGenerator?: (req: Request) => string; // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory rate limit stores for different endpoints
const rateLimitStores: { [endpoint: string]: RateLimitStore } = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const storeName of Object.keys(rateLimitStores)) {
    const store = rateLimitStores[storeName];
    for (const key of Object.keys(store)) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }
}, 5 * 60 * 1000);

/**
 * Create a rate limiting middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const storeName = `rateLimit_${config.windowMs}_${config.maxRequests}`;
  if (!rateLimitStores[storeName]) {
    rateLimitStores[storeName] = {};
  }
  const store = rateLimitStores[storeName];

  return (req: Request, res: Response, next: NextFunction) => {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : getClientIP(req);

    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > config.maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: config.message,
        retryAfter,
      });
    }

    next();
  };
}

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
  return req.ip || req.socket.remoteAddress || "unknown";
}

// ============================================================
// Pre-configured Rate Limiters
// ============================================================

/**
 * General API rate limiter
 * 100 requests per minute
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: "تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة مرة أخرى لاحقاً.",
});

/**
 * AI endpoint rate limiter (more restrictive)
 * 20 requests per minute
 */
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  message: "تم تجاوز الحد الأقصى لطلبات AI. يرجى الانتظار قليلاً.",
});

/**
 * Authentication endpoint rate limiter
 * 10 requests per 15 minutes
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: "محاولات كثيرة جداً. يرجى المحاولة مرة أخرى بعد 15 دقيقة.",
});

/**
 * File upload rate limiter
 * 5 uploads per hour
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
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
