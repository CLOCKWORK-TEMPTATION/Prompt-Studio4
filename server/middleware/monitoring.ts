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
        console.warn(`[Monitoring] طلب بطيء: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
      }
      
      // تسجيل الأخطاء
      if (res.statusCode >= 500) {
        console.error(`[Monitoring] خطأ خادم: ${req.method} ${req.path} - ${res.statusCode}`);
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
  // تسجيل الخطأ
  console.error(`[Monitoring] خطأ غير معالج في ${req.method} ${req.path}:`, error);
  
  // إرسال تنبيه للأخطاء الحرجة
  monitoringService.emit('error', {
    type: 'unhandled_error',
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
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