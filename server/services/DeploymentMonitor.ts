/**
 * خدمة مراقبة حالة النشر السحابي
 * تراقب حالة النشرات وتوفر تحديثات في الوقت الفعلي
 */

import { EventEmitter } from 'events';
import { DeploymentStatus } from './CloudDeploymentService';

export interface DeploymentHealthCheck {
  deploymentId: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

export interface DeploymentMetrics {
  deploymentId: string;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  uptime: number;
  lastRequest: Date;
}

export class DeploymentMonitor extends EventEmitter {
  private logger = console;
  private healthChecks: Map<string, DeploymentHealthCheck> = new Map();
  private metrics: Map<string, DeploymentMetrics> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * بدء مراقبة نشر
   */
  startMonitoring(deploymentId: string, url: string, interval: number = 60000): void {
    this.logger.info(`بدء مراقبة النشر: ${deploymentId}`);

    // إيقاف المراقبة السابقة إن وجدت
    this.stopMonitoring(deploymentId);

    // تهيئة البيانات
    this.healthChecks.set(deploymentId, {
      deploymentId,
      url,
      status: 'unknown',
      responseTime: 0,
      lastChecked: new Date()
    });

    this.metrics.set(deploymentId, {
      deploymentId,
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      uptime: 0,
      lastRequest: new Date()
    });

    // بدء المراقبة الدورية
    const intervalId = setInterval(async () => {
      await this.performHealthCheck(deploymentId);
    }, interval);

    this.monitoringIntervals.set(deploymentId, intervalId);

    // إجراء فحص فوري
    this.performHealthCheck(deploymentId);
  }

  /**
   * إيقاف مراقبة نشر
   */
  stopMonitoring(deploymentId: string): void {
    const intervalId = this.monitoringIntervals.get(deploymentId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(deploymentId);
      this.logger.info(`تم إيقاف مراقبة النشر: ${deploymentId}`);
    }
  }

  /**
   * إجراء فحص صحة النشر
   */
  private async performHealthCheck(deploymentId: string): Promise<void> {
    const healthCheck = this.healthChecks.get(deploymentId);
    if (!healthCheck) {
      return;
    }

    const startTime = Date.now();

    try {
      // إجراء طلب فحص الصحة
      const response = await fetch(healthCheck.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          variables: { input: 'health check' },
          config: { model: 'llama-3.3-70b-versatile', temperature: 0.1 }
        }),
        signal: AbortSignal.timeout(10000) // timeout 10 ثواني
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      // تحديث بيانات الفحص
      const updatedHealthCheck: DeploymentHealthCheck = {
        ...healthCheck,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: isHealthy ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

      this.healthChecks.set(deploymentId, updatedHealthCheck);

      // تحديث المقاييس
      this.updateMetrics(deploymentId, responseTime, !isHealthy);

      // إرسال حدث التحديث
      this.emit('healthCheckUpdate', updatedHealthCheck);

      if (!isHealthy) {
        this.emit('deploymentUnhealthy', updatedHealthCheck);
        this.logger.warn(`النشر غير صحي: ${deploymentId} - ${updatedHealthCheck.error}`);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const updatedHealthCheck: DeploymentHealthCheck = {
        ...healthCheck,
        status: 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };

      this.healthChecks.set(deploymentId, updatedHealthCheck);
      this.updateMetrics(deploymentId, responseTime, true);

      this.emit('healthCheckUpdate', updatedHealthCheck);
      this.emit('deploymentUnhealthy', updatedHealthCheck);
      
      this.logger.error(`خطأ في فحص صحة النشر ${deploymentId}:`, error);
    }
  }

  /**
   * تحديث مقاييس النشر
   */
  private updateMetrics(deploymentId: string, responseTime: number, isError: boolean): void {
    const metrics = this.metrics.get(deploymentId);
    if (!metrics) {
      return;
    }

    const updatedMetrics: DeploymentMetrics = {
      ...metrics,
      requestCount: metrics.requestCount + 1,
      errorCount: metrics.errorCount + (isError ? 1 : 0),
      averageResponseTime: (metrics.averageResponseTime * (metrics.requestCount - 1) + responseTime) / metrics.requestCount,
      lastRequest: new Date()
    };

    // حساب وقت التشغيل (uptime)
    const totalTime = Date.now() - metrics.lastRequest.getTime();
    const errorRate = updatedMetrics.errorCount / updatedMetrics.requestCount;
    updatedMetrics.uptime = Math.max(0, 100 - (errorRate * 100));

    this.metrics.set(deploymentId, updatedMetrics);
    this.emit('metricsUpdate', updatedMetrics);
  }

  /**
   * الحصول على حالة صحة النشر
   */
  getHealthCheck(deploymentId: string): DeploymentHealthCheck | null {
    return this.healthChecks.get(deploymentId) || null;
  }

  /**
   * الحصول على مقاييس النشر
   */
  getMetrics(deploymentId: string): DeploymentMetrics | null {
    return this.metrics.get(deploymentId) || null;
  }

  /**
   * الحصول على جميع النشرات المراقبة
   */
  getAllMonitoredDeployments(): string[] {
    return Array.from(this.healthChecks.keys());
  }

  /**
   * الحصول على ملخص حالة جميع النشرات
   */
  getOverallStatus(): {
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
  } {
    const healthChecks = Array.from(this.healthChecks.values());
    
    return {
      total: healthChecks.length,
      healthy: healthChecks.filter(hc => hc.status === 'healthy').length,
      unhealthy: healthChecks.filter(hc => hc.status === 'unhealthy').length,
      unknown: healthChecks.filter(hc => hc.status === 'unknown').length
    };
  }

  /**
   * الحصول على النشرات غير الصحية
   */
  getUnhealthyDeployments(): DeploymentHealthCheck[] {
    return Array.from(this.healthChecks.values())
      .filter(hc => hc.status === 'unhealthy');
  }

  /**
   * تنظيف البيانات القديمة
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;

    for (const [deploymentId, healthCheck] of this.healthChecks.entries()) {
      if (healthCheck.lastChecked.getTime() < cutoffTime) {
        this.stopMonitoring(deploymentId);
        this.healthChecks.delete(deploymentId);
        this.metrics.delete(deploymentId);
        this.logger.info(`تم تنظيف بيانات النشر القديم: ${deploymentId}`);
      }
    }
  }

  /**
   * إنشاء تقرير حالة النشر
   */
  generateStatusReport(deploymentId: string): {
    deployment: DeploymentHealthCheck | null;
    metrics: DeploymentMetrics | null;
    recommendations: string[];
  } {
    const healthCheck = this.getHealthCheck(deploymentId);
    const metrics = this.getMetrics(deploymentId);
    const recommendations: string[] = [];

    if (!healthCheck || !metrics) {
      return {
        deployment: healthCheck,
        metrics: metrics,
        recommendations: ['النشر غير مراقب حالياً']
      };
    }

    // توصيات بناءً على الحالة
    if (healthCheck.status === 'unhealthy') {
      recommendations.push('النشر غير صحي - يحتاج إلى فحص فوري');
    }

    if (metrics.errorCount > 0) {
      const errorRate = (metrics.errorCount / metrics.requestCount) * 100;
      if (errorRate > 10) {
        recommendations.push(`معدل الأخطاء مرتفع: ${errorRate.toFixed(1)}%`);
      }
    }

    if (healthCheck.responseTime > 5000) {
      recommendations.push('وقت الاستجابة بطيء - قد يحتاج إلى تحسين');
    }

    if (metrics.uptime < 95) {
      recommendations.push(`وقت التشغيل منخفض: ${metrics.uptime.toFixed(1)}%`);
    }

    if (recommendations.length === 0) {
      recommendations.push('النشر يعمل بشكل طبيعي');
    }

    return {
      deployment: healthCheck,
      metrics: metrics,
      recommendations
    };
  }

  /**
   * إيقاف جميع المراقبات
   */
  stopAllMonitoring(): void {
    for (const deploymentId of this.monitoringIntervals.keys()) {
      this.stopMonitoring(deploymentId);
    }
    
    this.healthChecks.clear();
    this.metrics.clear();
    this.logger.info('تم إيقاف جميع مراقبات النشر');
  }
}

export const deploymentMonitor = new DeploymentMonitor();