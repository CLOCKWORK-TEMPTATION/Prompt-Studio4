import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

/**
 * توليد CSRF token جديد
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware لتوليد وإضافة CSRF token إلى الجلسة
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // تخطي الحماية لطلبات GET و HEAD و OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // توليد token جديد إذا لم يكن موجوداً والجلسة متاحة
    if (req.session && !req.session.csrfToken) {
      req.session.csrfToken = generateCsrfToken();
    }
    return next();
  }

  // إذا لم تكن الجلسة متاحة، نتخطى الحماية مؤقتاً
  if (!req.session) {
    console.warn('CSRF protection skipped: session not available');
    return next();
  }

  // التحقق من وجود token في الجلسة
  if (!req.session.csrfToken) {
    return res.status(403).json({ 
      error: 'CSRF token missing in session',
      code: 'CSRF_SESSION_MISSING'
    });
  }

  // الحصول على token من الطلب (من header أو body)
  const clientToken = req.headers['x-csrf-token'] || req.body?._csrf;

  // التحقق من تطابق الـ tokens
  if (!clientToken || clientToken !== req.session.csrfToken) {
    return res.status(403).json({ 
      error: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
  }

  next();
}

/**
 * Middleware لإضافة CSRF token إلى response headers
 */
export function attachCsrfToken(req: Request, res: Response, next: NextFunction): void {
  if (req.session.csrfToken) {
    res.setHeader('X-CSRF-Token', req.session.csrfToken);
  }
  next();
}

/**
 * Route handler للحصول على CSRF token
 */
export function getCsrfToken(req: Request, res: Response): void {
  try {
    if (!req.session) {
      // إذا لم تكن الجلسة متاحة، نرسل token مؤقت
      const tempToken = generateCsrfToken();
      return res.json({ csrfToken: tempToken });
    }
    
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCsrfToken();
    }
    
    res.json({ 
      csrfToken: req.session.csrfToken 
    });
  } catch (error) {
    console.error('خطأ في إنشاء CSRF token:', error);
    // في حالة الخطأ، نرسل token مؤقت
    const tempToken = generateCsrfToken();
    res.json({ csrfToken: tempToken });
  }
}
