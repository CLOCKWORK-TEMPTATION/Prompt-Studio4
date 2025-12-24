/**
 * مُجدول تنظيف التخزين المؤقت التلقائي
 * 
 * هذه الخدمة تُنفذ تنظيف دوري للتخزين المؤقت الدلالي:
 * 1. حذف العناصر منتهية الصلاحية
 * 2. تطبيق قواعد الإبطال
 * 3. تحسين حجم قاعدة البيانات
 */

import { semanticCacheService } from './SemanticCacheService';

interface CleanupSchedulerConfig {
  intervalMinutes: number; // الفترة الزمنية بين عمليات التنظيف
  enabled: boolean;
}

class CacheCleanupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private config: CleanupSchedulerConfig = {
    intervalMinutes: 60, // كل ساعة افتراضياً
    enabled: true,
  };

  /**
   * بدء المُجدول
   */
  start(config?: Partial<CleanupSchedulerConfig>): void {
    if (this.intervalId) {
      console.log('[CacheCleanup] Scheduler is already running');
      return;
    }

    // تحديث التكوين
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      console.log('[CacheCleanup] Scheduler is disabled');
      return;
    }

    const intervalMs = this.config.intervalMinutes * 60 * 1000;

    const sanitizedInterval = String(this.config.intervalMinutes).replace(/[\r\n]/g, '');
    console.log(`[CacheCleanup] Starting scheduler with interval: ${sanitizedInterval} minutes`);

    // تشغيل التنظيف فوراً عند البدء
    this.runCleanup().catch(error => {
      console.error('[CacheCleanup] Initial cleanup failed:', error);
    });

    // جدولة التنظيف الدوري
    this.intervalId = setInterval(async () => {
      await this.runCleanup();
    }, intervalMs);

    console.log('[CacheCleanup] Scheduler started successfully');
  }

  /**
   * إيقاف المُجدول
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[CacheCleanup] Scheduler stopped');
    }
  }

  /**
   * تشغيل عملية التنظيف
   */
  private async runCleanup(): Promise<void> {
    if (this.isRunning) {
      console.log('[CacheCleanup] Cleanup already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('[CacheCleanup] Starting cleanup process...');

      // 1. حذف العناصر منتهية الصلاحية
      const cleanupResult = await semanticCacheService.cleanup();

      if (cleanupResult.success) {
        console.log(`[CacheCleanup] Removed ${cleanupResult.deletedCount} expired entries`);
      } else {
        console.warn('[CacheCleanup] Cleanup operation failed');
      }

      // 2. الحصول على إحصائيات بعد التنظيف
      const analytics = await semanticCacheService.getAnalytics();
      console.log(`[CacheCleanup] Current cache stats:`, {
        totalEntries: analytics.totalEntries,
        hitRate: `${analytics.hitRate}%`,
        tokensSaved: analytics.tokensSaved,
        cacheSize: `${(analytics.cacheSize / 1024 / 1024).toFixed(2)} MB`,
      });

      const duration = Date.now() - startTime;
      console.log(`[CacheCleanup] Cleanup completed in ${duration}ms`);

    } catch (error) {
      console.error('[CacheCleanup] Cleanup failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * تشغيل التنظيف يدوياً
   */
  async triggerManualCleanup(): Promise<{ success: boolean; deletedCount: number; duration: number }> {
    const startTime = Date.now();

    try {
      console.log('[CacheCleanup] Manual cleanup triggered');

      const result = await semanticCacheService.cleanup();
      const duration = Date.now() - startTime;

      console.log(`[CacheCleanup] Manual cleanup completed: ${result.deletedCount} entries removed in ${duration}ms`);

      return {
        success: result.success,
        deletedCount: result.deletedCount,
        duration,
      };
    } catch (error) {
      console.error('[CacheCleanup] Manual cleanup failed:', error);
      return {
        success: false,
        deletedCount: 0,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * الحصول على حالة المُجدول
   */
  getStatus(): {
    isRunning: boolean;
    isEnabled: boolean;
    intervalMinutes: number;
    isCleanupInProgress: boolean;
  } {
    return {
      isRunning: this.intervalId !== null,
      isEnabled: this.config.enabled,
      intervalMinutes: this.config.intervalMinutes,
      isCleanupInProgress: this.isRunning,
    };
  }

  /**
   * تحديث التكوين
   */
  updateConfig(config: Partial<CleanupSchedulerConfig>): void {
    const needsRestart = this.intervalId !== null;

    if (needsRestart) {
      this.stop();
    }

    this.config = { ...this.config, ...config };

    if (needsRestart && this.config.enabled) {
      this.start();
    }

    console.log('[CacheCleanup] Configuration updated:', this.config);
  }
}

// Singleton instance
export const cacheCleanupScheduler = new CacheCleanupScheduler();

/**
 * دالة مساعدة لبدء المُجدول عند تشغيل الخادم
 */
export function initializeCacheCleanup(): void {
  // قراءة التكوين من متغيرات البيئة
  const intervalMinutes = process.env.CACHE_CLEANUP_INTERVAL_MINUTES
    ? parseInt(process.env.CACHE_CLEANUP_INTERVAL_MINUTES, 10)
    : 60;

  const enabled = process.env.CACHE_CLEANUP_ENABLED !== 'false';

  cacheCleanupScheduler.start({
    intervalMinutes,
    enabled,
  });
}

/**
 * دالة مساعدة لإيقاف المُجدول عند إغلاق الخادم
 */
export function shutdownCacheCleanup(): void {
  cacheCleanupScheduler.stop();
}

export default cacheCleanupScheduler;

