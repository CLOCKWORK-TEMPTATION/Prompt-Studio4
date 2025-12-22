import * as Y from 'yjs';
import { WebSocket } from 'ws';

/**
 * مدير CRDT للتحرير التعاوني في الوقت الفعلي
 * يستخدم Yjs لإدارة البيانات المشتركة والمزامنة
 */
export class CRDTManager {
  private documents: Map<string, Y.Doc> = new Map();
  private connections: Map<string, Set<WebSocket>> = new Map();
  private logger = console;

  /**
   * إنشاء أو الحصول على مستند CRDT
   */
  getDocument(sessionId: string): Y.Doc {
    if (!this.documents.has(sessionId)) {
      const doc = new Y.Doc();
      this.documents.set(sessionId, doc);
      
      // إعداد مستمع للتغييرات
      doc.on('update', (update: Uint8Array) => {
        this.broadcastUpdate(sessionId, update);
      });

      this.logger.info(`تم إنشاء مستند CRDT جديد للجلسة: ${sessionId}`);
    }

    return this.documents.get(sessionId)!;
  }

  /**
   * إضافة اتصال WebSocket لجلسة معينة
   */
  addConnection(sessionId: string, ws: WebSocket): void {
    if (!this.connections.has(sessionId)) {
      this.connections.set(sessionId, new Set());
    }

    this.connections.get(sessionId)!.add(ws);

    // إرسال الحالة الحالية للمستند للاتصال الجديد
    const doc = this.getDocument(sessionId);
    const state = Y.encodeStateAsUpdate(doc);
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'sync',
        sessionId,
        update: Array.from(state)
      }));
    }

    this.logger.info(`تم إضافة اتصال جديد للجلسة: ${sessionId}`);
  }

  /**
   * إزالة اتصال WebSocket
   */
  removeConnection(sessionId: string, ws: WebSocket): void {
    const connections = this.connections.get(sessionId);
    if (connections) {
      connections.delete(ws);
      
      if (connections.size === 0) {
        this.connections.delete(sessionId);
        // يمكن الاحتفاظ بالمستند لفترة أو حذفه حسب الحاجة
        this.logger.info(`تم إزالة جميع الاتصالات للجلسة: ${sessionId}`);
      }
    }
  }

  /**
   * تطبيق تحديث على مستند CRDT
   */
  applyUpdate(sessionId: string, update: Uint8Array): void {
    const doc = this.getDocument(sessionId);
    Y.applyUpdate(doc, update);
  }

  /**
   * بث التحديث لجميع الاتصالات المتصلة بالجلسة
   */
  private broadcastUpdate(sessionId: string, update: Uint8Array): void {
    const connections = this.connections.get(sessionId);
    if (!connections) return;

    const message = JSON.stringify({
      type: 'update',
      sessionId,
      update: Array.from(update)
    });

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * الحصول على محتوى المستند كنص
   */
  getDocumentContent(sessionId: string): string {
    const doc = this.getDocument(sessionId);
    const yText = doc.getText('content');
    return yText.toString();
  }

  /**
   * تحديث محتوى المستند
   */
  updateDocumentContent(sessionId: string, content: string): void {
    const doc = this.getDocument(sessionId);
    const yText = doc.getText('content');
    
    // مسح المحتوى الحالي وإدراج الجديد
    yText.delete(0, yText.length);
    yText.insert(0, content);
  }

  /**
   * الحصول على إحصائيات الجلسة
   */
  getSessionStats(sessionId: string): {
    activeConnections: number;
    documentSize: number;
    lastUpdate: Date;
  } {
    const connections = this.connections.get(sessionId);
    const doc = this.documents.get(sessionId);

    return {
      activeConnections: connections?.size || 0,
      documentSize: doc ? Y.encodeStateAsUpdate(doc).length : 0,
      lastUpdate: new Date()
    };
  }

  /**
   * تنظيف الجلسات غير النشطة
   */
  cleanup(): void {
    const inactiveSessions: string[] = [];

    this.documents.forEach((doc, sessionId) => {
      const connections = this.connections.get(sessionId);
      if (!connections || connections.size === 0) {
        inactiveSessions.push(sessionId);
      }
    });

    inactiveSessions.forEach(sessionId => {
      this.documents.delete(sessionId);
      this.connections.delete(sessionId);
      this.logger.info(`تم تنظيف الجلسة غير النشطة: ${sessionId}`);
    });
  }

  /**
   * الحصول على قائمة الجلسات النشطة
   */
  getActiveSessions(): string[] {
    return Array.from(this.connections.keys());
  }
}

// إنشاء مثيل مشترك
export const crdtManager = new CRDTManager();

// تنظيف دوري للجلسات غير النشطة
setInterval(() => {
  crdtManager.cleanup();
}, 5 * 60 * 1000); // كل 5 دقائق