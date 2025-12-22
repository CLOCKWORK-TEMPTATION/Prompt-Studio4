import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { monitoringService } from '../services/MonitoringService';

/**
 * Middleware لمراقبة طلبات HTTP
 */

interface MonitoringRequest extends Request {
  startTime?: number;
  requestId?: string;
}

/**
 * تنظيف النصوص من محارف التحكم لمنع Log Injection
 * يزيل أي محارف قد تسمح بحقن أسطر جديدة في السجلات
 */
function sanitizeForLog(input: string | undefined): string {
  if (!input) return '';
  // إزالة محارف التحكم والأسطر الجديدة
  return input.replace(/[\r\n\t\x00-\x1F\x7F]/g, '').substring(0, 200);
}

/**
 * Middleware لتسجيل بداية الطلب
 */
export function requestStartMiddleware(req: MonitoringRequest, res: Response, next: NextFunction): void {
  // تسجيل بداية الطلب
  req.startTime = performance.now();
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // تسجيل اتصال نشط
  monitoringService.recordActiveConnection(1);
  
  // إضافة معرف الطلب للاستجابة
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
}

/**
 * Middleware لتسجيل نهاية الطلب
 */
export function requestEndMiddleware(req: MonitoringRequest, res: Response, next: NextFunction): void {
  // تسجيل نهاية الطلب عند الانتهاء من الاستجابة
  res.on('finish', () => {
    if (req.startTime) {
      const responseTime = performance.now() - req.startTime;
      
      // تسجيل مقاييس الطلب
      monitoringService.recordHttpRequest(responseTime);
      
      // تسجيل إنهاء الاتصال
      monitoringService.recordActiveConnection(-1);
      
      // تسجيل الطلبات البطيئة
      if (responseTime > 5000) { // أكثر من 5 ثواني
        const safeMethod = sanitizeForLog(req.method);
        const safePath = sanitizeForLog(req.path);
        console.warn(`[Monitoring] طلب بطيء: ${safeMethod} ${safePath} - ${responseTime.toFixed(2)}ms`);
      }
      
      // تسجيل الأخطاء
      if (res.statusCode >= 500) {
        const safeMethod = sanitizeForLog(req.method);
        const safePath = sanitizeForLog(req.path);
        console.error(`[Monitoring] خطأ خادم: ${safeMethod} ${safePath} - ${res.statusCode}`);
      }
    }
  });
  
  next();
}

/**
 * Middleware شامل للمراقبة
 */
export function monitoringMiddleware(req: MonitoringRequest, res: Response, next: NextFunction): void {
  requestStartMiddleware(req, res, () => {
    requestEndMiddleware(req, res, next);
  });
}

/**
 * Middleware لمراقبة الأخطاء
 */
export function errorMonitoringMiddleware(
  error: Error,
  req: MonitoringRequest,
  res: Response,
  next: NextFunction
): void {
  // تسجيل الخطأ مع تنظيف المدخلات
  const safeMethod = sanitizeForLog(req.method);
  const safePath = sanitizeForLog(req.path);
  const safeErrorMessage = sanitizeForLog(error.message);
  
  console.error(`[Monitoring] خطأ غير معالج في ${safeMethod} ${safePath}: ${safeErrorMessage}`);
  
  // إرسال تنبيه للأخطاء الحرجة
  monitoringService.emit('error', {
    type: 'unhandled_error',
    path: safePath,
    method: safeMethod,
    error: safeErrorMessage,
    stack: error.stack ? sanitizeForLog(error.stack) : undefined,
    requestId: req.requestId,
    timestamp: Date.now(),
  });
  
  next(error);
}

/**
 * Middleware لفحص صحة النظام
 */
export function healthCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/health' || req.path === '/api/health') {
    const healthStatus = monitoringService.getHealthStatus();
    const currentMetrics = monitoringService.getCurrentMetrics();
    
    const response = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      uptime: healthStatus.uptime,
      issues: healthStatus.issues,
      metrics: currentMetrics ? {
        cpu: currentMetrics.cpu.usage,
        memory: currentMetrics.memory.percentage,
        database: {
          healthy: currentMetrics.database.isHealthy,
          responseTime: currentMetrics.database.responseTime,
        },
        redis: {
          connected: currentMetrics.redis.isConnected,
          responseTime: currentMetrics.redis.responseTime,
        },
      } : null,
    };
    
    const statusCode = healthStatus.status === 'healthy' ? 200 
                     : healthStatus.status === 'warning' ? 200 
                     : 503;
    
    res.status(statusCode).json(response);
    return;
  }
  
  next();
}

/**
 * إعداد جميع middleware المراقبة
 */
export function setupMonitoringMiddleware(app: any): void {
  // فحص الصحة (يجب أن يكون أولاً)
  app.use(healthCheckMiddleware);
  
  // مراقبة الطلبات
  app.use(monitoringMiddleware);
  
  // مراقبة الأخطاء (يجب أن يكون آخراً)
  app.use(errorMonitoringMiddleware);
}