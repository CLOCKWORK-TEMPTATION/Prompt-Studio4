import { EventEmitter } from 'events';
import { monitoringService } from './MonitoringService';

/**
 * خدمة التنبيهات والإشعارات
 * تدير إرسال التنبيهات عبر قنوات مختلفة
 */

interface AlertChannel {
  id: string;
  name: string;
  type: 'console' | 'email' | 'webhook' | 'slack' | 'discord';
  enabled: boolean;
  config: Record<string, any>;
}

interface AlertNotification {
  id: string;
  alertId: string;
  channelId: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: number;
  error?: string;
  retryCount: number;
}

export class AlertService extends EventEmitter {
  private channels: AlertChannel[] = [];
  private notifications: AlertNotification[] = [];
  private maxRetries = 3;
  private retryDelay = 5000; // 5 ثواني

  constructor() {
    super();
    this.setupDefaultChannels();
    this.setupMonitoringListeners();
  }

  /**
   * إعداد قنوات التنبيه الافتراضية
   */
  private setupDefaultChannels(): void {
    // قناة وحدة التحكم (افتراضية)
    this.channels.push({
      id: 'console',
      name: 'وحدة التحكم',
      type: 'console',
      enabled: true,
      config: {
        logLevel: 'warn',
        includeMetrics: false,
      },
    });

    // قناة Webhook (للتكامل مع أنظمة خارجية)
    if (process.env.ALERT_WEBHOOK_URL) {
      this.channels.push({
        id: 'webhook',
        name: 'Webhook',
        type: 'webhook',
        enabled: true,
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.ALERT_WEBHOOK_TOKEN || '',
          },
        },
      });
    }

    // قناة Slack (إذا كان متاحاً)
    if (process.env.SLACK_WEBHOOK_URL) {
      this.channels.push({
        id: 'slack',
        name: 'Slack',
        type: 'slack',
        enabled: true,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts',
          username: 'PromptStudio Monitor',
          iconEmoji: ':warning:',
        },
      });
    }
  }

  /**
   * إعداد مستمعي أحداث المراقبة
   */
  private setupMonitoringListeners(): void {
    // الاستماع للتنبيهات من خدمة المراقبة
    monitoringService.on('alert', (alert) => {
      this.handleAlert(alert);
    });

    // الاستماع للأخطاء
    monitoringService.on('error', (error) => {
      this.handleError(error);
    });

    console.log('[AlertService] تم إعداد مستمعي الأحداث');
  }

  /**
   * معالجة التنبيه
   */
  private async handleAlert(alert: any): Promise<void> {
    const sanitizedSeverity = String(alert.severity || 'unknown').replace(/[\r\n]/g, '');
    const sanitizedMessage = String(alert.message || '').replace(/[\r\n]/g, '');
    console.log(`[AlertService] معالجة تنبيه: ${sanitizedSeverity} - ${sanitizedMessage}`);

    // تحديد القنوات المناسبة حسب شدة التنبيه
    const targetChannels = this.getChannelsForSeverity(alert.severity);

    // إرسال التنبيه عبر كل قناة
    for (const channel of targetChannels) {
      await this.sendAlert(alert, channel);
    }
  }

  /**
   * معالجة الأخطاء
   */
  private async handleError(error: any): Promise<void> {
    console.error(`[AlertService] معالجة خطأ: ${error.type || 'unknown'}`);

    // إنشاء تنبيه للخطأ
    const errorAlert = {
      id: `error_${Date.now()}`,
      severity: 'critical' as const,
      message: `خطأ في النظام: ${error.error || error.message || 'خطأ غير معروف'}`,
      timestamp: Date.now(),
      type: 'system_error',
      details: error,
    };

    await this.handleAlert(errorAlert);
  }

  /**
   * تحديد القنوات المناسبة حسب شدة التنبيه
   */
  private getChannelsForSeverity(severity: string): AlertChannel[] {
    return this.channels.filter(channel => {
      if (!channel.enabled) return false;

      switch (severity) {
        case 'critical':
          return true; // جميع القنوات للتنبيهات الحرجة
        case 'high':
          return channel.type !== 'console'; // كل شيء عدا وحدة التحكم
        case 'medium':
          return ['webhook', 'slack'].includes(channel.type);
        case 'low':
          return channel.type === 'console';
        default:
          return channel.type === 'console';
      }
    });
  }

  /**
   * إرسال تنبيه عبر قناة محددة
   */
  private async sendAlert(alert: any, channel: AlertChannel): Promise<void> {
    const notification: AlertNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertId: alert.id,
      channelId: channel.id,
      status: 'pending',
      retryCount: 0,
    };

    this.notifications.push(notification);

    try {
      await this.sendNotification(alert, channel, notification);
      notification.status = 'sent';
      notification.sentAt = Date.now();
      
      console.log(`[AlertService] تم إرسال التنبيه عبر ${channel.name}`);
    } catch (error) {
      console.error(`[AlertService] فشل إرسال التنبيه عبر ${channel.name}:`, error);
      notification.status = 'failed';
      notification.error = error instanceof Error ? error.message : String(error);
      
      // إعادة المحاولة
      if (notification.retryCount < this.maxRetries) {
        setTimeout(() => {
          this.retryNotification(notification, alert, channel);
        }, this.retryDelay * (notification.retryCount + 1));
      }
    }
  }

  /**
   * إرسال الإشعار الفعلي
   */
  private async sendNotification(alert: any, channel: AlertChannel, notification: AlertNotification): Promise<void> {
    switch (channel.type) {
      case 'console':
        this.sendConsoleAlert(alert, channel);
        break;
      case 'webhook':
        await this.sendWebhookAlert(alert, channel);
        break;
      case 'slack':
        await this.sendSlackAlert(alert, channel);
        break;
      default:
        throw new Error(`نوع قناة غير مدعوم: ${channel.type}`);
    }
  }

  /**
   * إرسال تنبيه لوحدة التحكم
   */
  private sendConsoleAlert(alert: any, channel: AlertChannel): void {
    const timestamp = new Date(alert.timestamp).toLocaleString('ar-EG');
    const message = `🚨 [${alert.severity.toUpperCase()}] ${alert.message} - ${timestamp}`;
    
    switch (alert.severity) {
      case 'critical':
        console.error(message);
        break;
      case 'high':
        console.warn(message);
        break;
      default:
        console.log(message);
    }
  }

  /**
   * إرسال تنبيه عبر Webhook
   */
  private async sendWebhookAlert(alert: any, channel: AlertChannel): Promise<void> {
    const payload = {
      alert: {
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        type: alert.type || 'monitoring',
      },
      system: {
        name: 'PromptStudio',
        environment: process.env.NODE_ENV || 'development',
        hostname: require('os').hostname(),
      },
    };

    const response = await fetch(channel.config.url, {
      method: channel.config.method || 'POST',
      headers: channel.config.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * إرسال تنبيه لـ Slack
   */
  private async sendSlackAlert(alert: any, channel: AlertChannel): Promise<void> {
    const color = this.getSeverityColor(alert.severity);
    const timestamp = new Date(alert.timestamp).toLocaleString('ar-EG');
    
    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      icon_emoji: channel.config.iconEmoji,
      attachments: [
        {
          color,
          title: `تنبيه ${alert.severity} - PromptStudio`,
          text: alert.message,
          fields: [
            {
              title: 'الوقت',
              value: timestamp,
              short: true,
            },
            {
              title: 'الشدة',
              value: alert.severity,
              short: true,
            },
          ],
          footer: 'PromptStudio Monitoring',
          ts: Math.floor(alert.timestamp / 1000),
        },
      ],
    };

    const response = await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * الحصول على لون الشدة
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#00aa00';
      default: return '#888888';
    }
  }

  /**
   * إعادة محاولة إرسال الإشعار
   */
  private async retryNotification(notification: AlertNotification, alert: any, channel: AlertChannel): Promise<void> {
    notification.retryCount++;
    notification.status = 'pending';
    
    console.log(`[AlertService] إعادة محاولة ${notification.retryCount}/${this.maxRetries} لإرسال التنبيه عبر ${channel.name}`);
    
    try {
      await this.sendNotification(alert, channel, notification);
      notification.status = 'sent';
      notification.sentAt = Date.now();
      
      console.log(`[AlertService] نجحت إعادة المحاولة لإرسال التنبيه عبر ${String(channel.name).replace(/[\r\n]/g, '')}`);
    } catch (error) {
      console.error(`[AlertService] فشلت إعادة المحاولة ${notification.retryCount} لإرسال التنبيه عبر ${String(channel.name).replace(/[\r\n]/g, '')}:`, error);
      notification.status = 'failed';
      notification.error = error instanceof Error ? error.message : String(error);
      
      // إعادة المحاولة مرة أخرى إذا لم نصل للحد الأقصى
      if (notification.retryCount < this.maxRetries) {
        setTimeout(() => {
          this.retryNotification(notification, alert, channel);
        }, this.retryDelay * (notification.retryCount + 1));
      } else {
        console.error(`[AlertService] فشل نهائي في إرسال التنبيه عبر ${String(channel.name).replace(/[\r\n]/g, '')} بعد ${this.maxRetries} محاولات`);
      }
    }
  }

  /**
   * إضافة قناة تنبيه جديدة
   */
  addChannel(channel: Omit<AlertChannel, 'id'>): string {
    const id = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.channels.push({ ...channel, id });
    console.log(`[AlertService] تم إضافة قناة جديدة: ${String(channel.name).replace(/[\r\n]/g, '')}`);
    return id;
  }

  /**
   * تحديث قناة تنبيه
   */
  updateChannel(channelId: string, updates: Partial<AlertChannel>): boolean {
    const channel = this.channels.find(c => c.id === channelId);
    if (channel) {
      Object.assign(channel, updates);
      console.log(`[AlertService] تم تحديث القناة: ${String(channel.name).replace(/[\r\n]/g, '')}`);
      return true;
    }
    return false;
  }

  /**
   * حذف قناة تنبيه
   */
  removeChannel(channelId: string): boolean {
    const index = this.channels.findIndex(c => c.id === channelId);
    if (index !== -1) {
      const channel = this.channels[index];
      this.channels.splice(index, 1);
      console.log(`[AlertService] تم حذف القناة: ${String(channel.name).replace(/[\r\n]/g, '')}`);
      return true;
    }
    return false;
  }

  /**
   * الحصول على جميع القنوات
   */
  getChannels(): AlertChannel[] {
    return [...this.channels];
  }

  /**
   * الحصول على إحصائيات الإشعارات
   */
  getNotificationStats(): {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    byChannel: Record<string, { sent: number; failed: number; pending: number }>;
  } {
    const stats = {
      total: this.notifications.length,
      sent: 0,
      failed: 0,
      pending: 0,
      byChannel: {} as Record<string, { sent: number; failed: number; pending: number }>,
    };

    for (const notification of this.notifications) {
      stats[notification.status]++;
      
      if (!stats.byChannel[notification.channelId]) {
        stats.byChannel[notification.channelId] = { sent: 0, failed: 0, pending: 0 };
      }
      stats.byChannel[notification.channelId][notification.status]++;
    }

    return stats;
  }

  /**
   * تنظيف الإشعارات القديمة
   */
  cleanupOldNotifications(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    const initialCount = this.notifications.length;
    
    this.notifications = this.notifications.filter(notification => {
      return !notification.sentAt || notification.sentAt > cutoff;
    });
    
    const removedCount = initialCount - this.notifications.length;
    if (removedCount > 0) {
      console.log(`[AlertService] تم تنظيف ${removedCount} إشعار قديم`);
    }
    
    return removedCount;
  }

  /**
   * اختبار قناة تنبيه
   */
  async testChannel(channelId: string): Promise<boolean> {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) {
      throw new Error('القناة غير موجودة');
    }

    const testAlert = {
      id: `test_${Date.now()}`,
      severity: 'low',
      message: 'هذا تنبيه تجريبي للتأكد من عمل القناة',
      timestamp: Date.now(),
      type: 'test',
    };

    try {
      const testNotification: AlertNotification = {
        id: `test_notif_${Date.now()}`,
        alertId: testAlert.id,
        channelId: channel.id,
        status: 'pending',
        retryCount: 0,
      };

      await this.sendNotification(testAlert, channel, testNotification);
      console.log(`[AlertService] نجح اختبار القناة: ${String(channel.name).replace(/[\r\n]/g, '')}`);
      return true;
    } catch (error) {
      console.error(`[AlertService] فشل اختبار القناة ${String(channel.name).replace(/[\r\n]/g, '')}:`, error);
      return false;
    }
  }
}

// إنشاء مثيل مشترك
export const alertService = new AlertService();
export default AlertService;