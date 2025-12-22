import { Router } from 'express';
import { monitoringService } from '../services/MonitoringService';
import { alertService } from '../services/AlertService';

/**
 * مسارات API للمراقبة والتنبيهات
 */

const router = Router();

// ============================================================
// مسارات المراقبة
// ============================================================

/**
 * الحصول على المقاييس الحالية
 */
router.get('/metrics/current', (req, res) => {
  try {
    const metrics = monitoringService.getCurrentMetrics();
    if (!metrics) {
      return res.status(404).json({ error: 'لا توجد مقاييس متاحة' });
    }
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'فشل في الحصول على المقاييس' });
  }
});

/**
 * الحصول على المقاييس التاريخية
 */
router.get('/metrics/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const metrics = monitoringService.getHistoricalMetrics(limit);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'فشل في الحصول على المقاييس التاريخية' });
  }
});

/**
 * الحصول على حالة الصحة العامة
 */
router.get('/health', (req, res) => {
  try {
    const health = monitoringService.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 
                     : health.status === 'warning' ? 200 
                     : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({ error: 'فشل في فحص الصحة' });
  }
});

/**
 * بدء خدمة المراقبة
 */
router.post('/start', (req, res) => {
  try {
    const interval = parseInt(req.body.interval) || 30000;
    monitoringService.start(interval);
    res.json({ success: true, message: 'تم بدء خدمة المراقبة' });
  } catch (error) {
    res.status(500).json({ error: 'فشل في بدء خدمة المراقبة' });
  }
});

/**
 * إيقاف خدمة المراقبة
 */
router.post('/stop', (req, res) => {
  try {
    monitoringService.stop();
    res.json({ success: true, message: 'تم إيقاف خدمة المراقبة' });
  } catch (error) {
    res.status(500).json({ error: 'فشل في إيقاف خدمة المراقبة' });
  }
});

// ============================================================
// مسارات التنبيهات
// ============================================================

/**
 * الحصول على التنبيهات النشطة
 */
router.get('/alerts/active', (req, res) => {
  try {
    const alerts = monitoringService.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'فشل في الحصول على التنبيهات النشطة' });
  }
});

/**
 * الحصول على جميع التنبيهات
 */
router.get('/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const alerts = monitoringService.getAllAlerts(limit);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'فشل في الحصول على التنبيهات' });
  }
});

/**
 * حل تنبيه
 */
router.post('/alerts/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const success = monitoringService.resolveAlert(alertId);
    if (success) {
      res.json({ success: true, message: 'تم حل التنبيه' });
    } else {
      res.status(404).json({ error: 'التنبيه غير موجود أو محلول بالفعل' });
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في حل التنبيه' });
  }
});

/**
 * الحصول على قواعد التنبيه
 */
router.get('/alert-rules', (req, res) => {
  try {
    const rules = monitoringService.getAlertRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'فشل في الحصول على قواعد التنبيه' });
  }
});

/**
 * إضافة قاعدة تنبيه جديدة
 */
router.post('/alert-rules', (req, res) => {
  try {
    const rule = req.body;
    
    // التحقق من صحة البيانات
    if (!rule.id || !rule.name || !rule.condition || !rule.severity) {
      return res.status(400).json({ error: 'بيانات القاعدة غير مكتملة' });
    }
    
    monitoringService.addAlertRule(rule);
    res.status(201).json({ success: true, message: 'تم إضافة قاعدة التنبيه' });
  } catch (error) {
    res.status(500).json({ error: 'فشل في إضافة قاعدة التنبيه' });
  }
});

/**
 * تحديث قاعدة تنبيه
 */
router.put('/alert-rules/:ruleId', (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    
    const success = monitoringService.updateAlertRule(ruleId, updates);
    if (success) {
      res.json({ success: true, message: 'تم تحديث قاعدة التنبيه' });
    } else {
      res.status(404).json({ error: 'قاعدة التنبيه غير موجودة' });
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث قاعدة التنبيه' });
  }
});

/**
 * حذف قاعدة تنبيه
 */
router.delete('/alert-rules/:ruleId', (req, res) => {
  try {
    const { ruleId } = req.params;
    const success = monitoringService.removeAlertRule(ruleId);
    if (success) {
      res.json({ success: true, message: 'تم حذف قاعدة التنبيه' });
    } else {
      res.status(404).json({ error: 'قاعدة التنبيه غير موجودة' });
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف قاعدة التنبيه' });
  }
});

// ============================================================
// مسارات قنوات التنبيه
// ============================================================

/**
 * الحصول على قنوات التنبيه
 */
router.get('/alert-channels', (req, res) => {
  try {
    const channels = alertService.getChannels();
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'فشل في الحصول على قنوات التنبيه' });
  }
});

/**
 * إضافة قناة تنبيه جديدة
 */
router.post('/alert-channels', (req, res) => {
  try {
    const channel = req.body;
    
    // التحقق من صحة البيانات
    if (!channel.name || !channel.type) {
      return res.status(400).json({ error: 'بيانات القناة غير مكتملة' });
    }
    
    const channelId = alertService.addChannel(channel);
    res.status(201).json({ success: true, channelId, message: 'تم إضافة قناة التنبيه' });
  } catch (error) {
    res.status(500).json({ error: 'فشل في إضافة قناة التنبيه' });
  }
});

/**
 * تحديث قناة تنبيه
 */
router.put('/alert-channels/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;
    const updates = req.body;
    
    const success = alertService.updateChannel(channelId, updates);
    if (success) {
      res.json({ success: true, message: 'تم تحديث قناة التنبيه' });
    } else {
      res.status(404).json({ error: 'قناة التنبيه غير موجودة' });
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث قناة التنبيه' });
  }
});

/**
 * حذف قناة تنبيه
 */
router.delete('/alert-channels/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;
    const success = alertService.removeChannel(channelId);
    if (success) {
      res.json({ success: true, message: 'تم حذف قناة التنبيه' });
    } else {
      res.status(404).json({ error: 'قناة التنبيه غير موجودة' });
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف قناة التنبيه' });
  }
});

/**
 * اختبار قناة تنبيه
 */
router.post('/alert-channels/:channelId/test', async (req, res) => {
  try {
    const { channelId } = req.params;
    const success = await alertService.testChannel(channelId);
    if (success) {
      res.json({ success: true, message: 'تم اختبار القناة بنجاح' });
    } else {
      res.status(400).json({ error: 'فشل اختبار القناة' });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'فشل في اختبار القناة',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * الحصول على إحصائيات الإشعارات
 */
router.get('/notifications/stats', (req, res) => {
  try {
    const stats = alertService.getNotificationStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'فشل في الحصول على إحصائيات الإشعارات' });
  }
});

/**
 * تنظيف الإشعارات القديمة
 */
router.post('/notifications/cleanup', (req, res) => {
  try {
    const maxAge = parseInt(req.body.maxAge) || 24 * 60 * 60 * 1000; // 24 ساعة افتراضياً
    const removedCount = alertService.cleanupOldNotifications(maxAge);
    res.json({ success: true, removedCount, message: `تم تنظيف ${removedCount} إشعار قديم` });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تنظيف الإشعارات القديمة' });
  }
});

// ============================================================
// مسارات الإحصائيات والتقارير
// ============================================================

/**
 * الحصول على تقرير شامل
 */
router.get('/report', (req, res) => {
  try {
    const currentMetrics = monitoringService.getCurrentMetrics();
    const healthStatus = monitoringService.getHealthStatus();
    const activeAlerts = monitoringService.getActiveAlerts();
    const notificationStats = alertService.getNotificationStats();
    
    const report = {
      timestamp: new Date().toISOString(),
      health: healthStatus,
      metrics: currentMetrics,
      alerts: {
        active: activeAlerts.length,
        total: monitoringService.getAllAlerts().length,
        bySeverity: activeAlerts.reduce((acc, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      notifications: notificationStats,
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
    };
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'فشل في إنشاء التقرير' });
  }
});

export default router;