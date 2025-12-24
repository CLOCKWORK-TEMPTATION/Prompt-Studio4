import { EventEmitter } from 'events';
import os from 'os';
import { performance } from 'perf_hooks';
import { db } from '../storage';
import { redis } from '../lib/redis';

/**
 * خدمة المراقبة الشاملة للتطبيق
 * تراقب الأداء والموارد وحالة الخدمات
 */

interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  process: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    pid: number;
  };
  database: {
    connectionCount: number;
    responseTime: number;
    isHealthy: boolean;
  };
  redis: {
    isConnected: boolean;
    responseTime: number;
    memoryUsage: number;
  };
  http: {
    activeConnections: number;
    requestsPerMinute: number;
    averageResponseTime: number;
  };
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: SystemMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // بالثواني
  lastTriggered?: number;
  enabled: boolean;
}

interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metrics: SystemMetrics;
  resolved: boolean;
  resolvedAt?: number;
}

export class MonitoringService extends EventEmitter {
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private httpMetrics = {
    activeConnections: 0,
    requestCount: 0,
    responseTimeSum: 0,
    requestsInLastMinute: [] as number[],
  };

  constructor() {
    super();
    // زيادة حد المستمعين لمنع تحذيرات memory leak
    this.setMaxListeners(20);
    this.setupDefaultAlertRules();
  }

  /**
   * إعداد قواعد التنبيه الافتراضية
   */
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-cpu-usage',
        name: 'استخدام مرتفع للمعالج',
        condition: (metrics) => metrics.cpu.usage > 80,
        severity: 'high',
        cooldown: 300, // 5 دقائق
        enabled: true,
      },
      {
        id: 'high-memory-usage',
        name: 'استخدام مرتفع للذاكرة',
        condition: (metrics) => metrics.memory.percentage > 95,
        severity: 'high',
        cooldown: 300,
        enabled: true,
      },
      {
        id: 'database-connection-failure',
        name: 'فشل اتصال قاعدة البيانات',
        condition: (metrics) => !metrics.database.isHealthy,
        severity: 'critical',
        cooldown: 60,
        enabled: true,
      },
      {
        id: 'slow-database-response',
        name: 'بطء استجابة قاعدة البيانات',
        condition: (metrics) => metrics.database.responseTime > 1000,
        severity: 'medium',
        cooldown: 180,
        enabled: true,
      },
      {
        id: 'redis-disconnection',
        name: 'انقطاع اتصال Redis',
        condition: (metrics) => !metrics.redis.isConnected,
        severity: 'medium',
        cooldown: 120,
        enabled: true,
      },
      {
        id: 'high-response-time',
        name: 'زمن استجابة مرتفع',
        condition: (metrics) => metrics.http.averageResponseTime > 2000,
        severity: 'medium',
        cooldown: 240,
        enabled: true,
      },
      {
        id: 'process-memory-leak',
        name: 'تسرب ذاكرة محتمل',
        condition: (metrics) => metrics.process.memoryUsage.heapUsed > 512 * 1024 * 1024, // 512MB
        severity: 'high',
        cooldown: 600,
        enabled: true,
      },
    ];
  }

  /**
   * بدء خدمة المراقبة
   */
  start(intervalMs: number = 30000): void {
    if (this.isRunning) {
      console.warn('[Monitoring] الخدمة تعمل بالفعل');
      return;
    }

    this.isRunning = true;
    console.log('[Monitoring] بدء خدمة المراقبة');

    // جمع المقاييس فوراً
    this.collectMetrics();

    // إعداد التجميع الدوري
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    this.emit('started');
  }

  /**
   * إيقاف خدمة المراقبة
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // تجنب الطباعة في بيئة الاختبار
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Monitoring] تم إيقاف خدمة المراقبة');
    }

    // إرسال حدث الإيقاف قبل تنظيف المستمعين
    this.emit('stopped');

    // تنظيف جميع المستمعين لمنع memory leaks
    this.removeAllListeners();
  }

  /**
   * جمع مقاييس النظام
   */
  private async collectMetrics(): Promise<void> {
    try {
      const startTime = performance.now();

      // مقاييس المعالج
      const cpuUsage = await this.getCpuUsage();
      const loadAverage = os.loadavg();

      // مقاييس الذاكرة
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      // مقاييس العملية
      const processMemory = process.memoryUsage();
      const processUptime = process.uptime();

      // مقاييس قاعدة البيانات
      const dbMetrics = await this.getDatabaseMetrics();

      // مقاييس Redis
      const redisMetrics = await this.getRedisMetrics();

      // مقاييس HTTP
      const httpMetrics = this.getHttpMetrics();

      const metrics: SystemMetrics = {
        timestamp: Date.now(),
        cpu: {
          usage: cpuUsage,
          loadAverage,
        },
        memory: {
          used: usedMemory,
          free: freeMemory,
          total: totalMemory,
          percentage: memoryPercentage,
        },
        process: {
          memoryUsage: processMemory,
          uptime: processUptime,
          pid: process.pid,
        },
        database: dbMetrics,
        redis: redisMetrics,
        http: httpMetrics,
      };

      // حفظ المقاييس
      this.metrics.push(metrics);

      // الاحتفاظ بآخر 1000 قياس فقط
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // فحص قواعد التنبيه
      this.checkAlertRules(metrics);

      // إرسال حدث المقاييس الجديدة
      this.emit('metrics', metrics);

      const collectionTime = performance.now() - startTime;
      if (collectionTime > 1000) {
        console.warn(`[Monitoring] جمع المقاييس استغرق ${collectionTime.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('[Monitoring] خطأ في جمع المقاييس:', error);
      this.emit('error', error);
    }
  }

  /**
   * حساب استخدام المعالج
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);

        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
        const cpuTime = (endUsage.user + endUsage.system) / 1000; // microseconds

        const cpuPercent = (cpuTime / totalTime) * 100;
        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  /**
   * الحصول على مقاييس قاعدة البيانات
   */
  private async getDatabaseMetrics(): Promise<SystemMetrics['database']> {
    const startTime = performance.now();
    let isHealthy = false;
    let connectionCount = 0;

    try {
      // اختبار الاتصال
      await db.execute('SELECT 1');
      isHealthy = true;

      // محاولة الحصول على عدد الاتصالات (PostgreSQL)
      try {
        const result = await db.execute(`
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE state = 'active'
        `);
        connectionCount = Number(result.rows[0]?.count) || 0;
      } catch {
        // تجاهل الخطأ إذا لم نتمكن من الحصول على العدد
      }
    } catch (error) {
      // تجنب الطباعة في بيئة الاختبار لمنع "Cannot log after tests are done"
      if (process.env.NODE_ENV !== 'test') {
        console.error('[Monitoring] خطأ في فحص قاعدة البيانات:', error);
      }
    }

    const responseTime = performance.now() - startTime;

    return {
      connectionCount,
      responseTime,
      isHealthy,
    };
  }

  /**
   * الحصول على مقاييس Redis
   */
  private async getRedisMetrics(): Promise<SystemMetrics['redis']> {
    const startTime = performance.now();
    let isConnected = false;
    let memoryUsage = 0;

    try {
      await redis.ping();
      isConnected = true;

      // الحصول على معلومات الذاكرة
      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      if (memoryMatch) {
        memoryUsage = parseInt(memoryMatch[1]);
      }
    } catch (error) {
      // تجنب الطباعة في بيئة الاختبار لمنع "Cannot log after tests are done"
      if (process.env.NODE_ENV !== 'test') {
        console.error('[Monitoring] خطأ في فحص Redis:', error);
      }
    }

    const responseTime = performance.now() - startTime;

    return {
      isConnected,
      responseTime,
      memoryUsage,
    };
  }

  /**
   * الحصول على مقاييس HTTP
   */
  private getHttpMetrics(): SystemMetrics['http'] {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // تنظيف الطلبات القديمة
    this.httpMetrics.requestsInLastMinute = this.httpMetrics.requestsInLastMinute.filter(
      (timestamp) => timestamp > oneMinuteAgo
    );

    const requestsPerMinute = this.httpMetrics.requestsInLastMinute.length;
    const averageResponseTime = this.httpMetrics.requestCount > 0
      ? this.httpMetrics.responseTimeSum / this.httpMetrics.requestCount
      : 0;

    return {
      activeConnections: this.httpMetrics.activeConnections,
      requestsPerMinute,
      averageResponseTime,
    };
  }

  /**
   * تسجيل طلب HTTP
   */
  recordHttpRequest(responseTime: number): void {
    const now = Date.now();
    this.httpMetrics.requestsInLastMinute.push(now);
    this.httpMetrics.requestCount++;
    this.httpMetrics.responseTimeSum += responseTime;

    // إعادة تعيين المتوسط كل 1000 طلب لتجنب الأرقام الكبيرة
    if (this.httpMetrics.requestCount >= 1000) {
      this.httpMetrics.requestCount = 1;
      this.httpMetrics.responseTimeSum = responseTime;
    }
  }

  /**
   * تسجيل اتصال HTTP نشط
   */
  recordActiveConnection(delta: number): void {
    this.httpMetrics.activeConnections += delta;
    this.httpMetrics.activeConnections = Math.max(0, this.httpMetrics.activeConnections);
  }

  /**
   * فحص قواعد التنبيه
   */
  private checkAlertRules(metrics: SystemMetrics): void {
    const now = Date.now();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // فحص فترة التهدئة
      if (rule.lastTriggered && (now - rule.lastTriggered) < (rule.cooldown * 1000)) {
        continue;
      }

      // فحص الشرط
      if (rule.condition(metrics)) {
        this.triggerAlert(rule, metrics);
        rule.lastTriggered = now;
      }
    }
  }

  /**
   * إطلاق تنبيه
   */
  private triggerAlert(rule: AlertRule, metrics: SystemMetrics): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, metrics),
      timestamp: Date.now(),
      metrics,
      resolved: false,
    };

    this.alerts.push(alert);

    // الاحتفاظ بآخر 500 تنبيه فقط
    if (this.alerts.length > 500) {
      this.alerts = this.alerts.slice(-500);
    }

    console.warn(`[Alert ${rule.severity.toUpperCase()}] ${alert.message}`);
    this.emit('alert', alert);
  }

  /**
   * توليد رسالة التنبيه
   */
  private generateAlertMessage(rule: AlertRule, metrics: SystemMetrics): string {
    switch (rule.id) {
      case 'high-cpu-usage':
        return `استخدام المعالج مرتفع: ${metrics.cpu.usage.toFixed(1)}%`;
      case 'high-memory-usage':
        return `استخدام الذاكرة مرتفع: ${metrics.memory.percentage.toFixed(1)}%`;
      case 'database-connection-failure':
        return 'فشل في الاتصال بقاعدة البيانات';
      case 'slow-database-response':
        return `بطء في استجابة قاعدة البيانات: ${metrics.database.responseTime.toFixed(0)}ms`;
      case 'redis-disconnection':
        return 'انقطع الاتصال مع Redis';
      case 'high-response-time':
        return `زمن استجابة مرتفع: ${metrics.http.averageResponseTime.toFixed(0)}ms`;
      case 'process-memory-leak':
        return `استخدام ذاكرة مرتفع للعملية: ${(metrics.process.memoryUsage.heapUsed / 1024 / 1024).toFixed(0)}MB`;
      default:
        return rule.name;
    }
  }

  /**
   * الحصول على المقاييس الحالية
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * الحصول على المقاييس التاريخية
   */
  getHistoricalMetrics(limit: number = 100): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * الحصول على التنبيهات النشطة
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * الحصول على جميع التنبيهات
   */
  getAllAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * حل تنبيه
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  /**
   * إضافة قاعدة تنبيه مخصصة
   */
  addAlertRule(rule: Omit<AlertRule, 'lastTriggered'>): void {
    this.alertRules.push({ ...rule, lastTriggered: undefined });
  }

  /**
   * تحديث قاعدة تنبيه
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      return true;
    }
    return false;
  }

  /**
   * حذف قاعدة تنبيه
   */
  removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.alertRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * الحصول على قواعد التنبيه
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * الحصول على إحصائيات الصحة العامة
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    uptime: number;
    lastCheck: number;
  } {
    const currentMetrics = this.getCurrentMetrics();
    const activeAlerts = this.getActiveAlerts();

    if (!currentMetrics) {
      return {
        status: 'warning',
        issues: ['لا توجد مقاييس متاحة'],
        uptime: process.uptime(),
        lastCheck: Date.now(),
      };
    }

    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const highAlerts = activeAlerts.filter(a => a.severity === 'high');

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const issues: string[] = [];

    if (criticalAlerts.length > 0) {
      status = 'critical';
      issues.push(...criticalAlerts.map(a => a.message));
    } else if (highAlerts.length > 0 || activeAlerts.length > 3) {
      status = 'warning';
      issues.push(...highAlerts.map(a => a.message));
    }

    return {
      status,
      issues,
      uptime: process.uptime(),
      lastCheck: currentMetrics.timestamp,
    };
  }
}

// إنشاء مثيل مشترك
export const monitoringService = new MonitoringService();
export default monitoringService;