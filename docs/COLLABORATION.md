# نظام التعاون الحي (Live Collaboration)

## نظرة عامة

تم تنفيذ نظام تعاون حي متقدم باستخدام WebSocket و CRDT (Conflict-free Replicated Data Type) لتمكين عدة مستخدمين من التعديل على نفس المستند في الوقت الفعلي.

## المكونات الرئيسية

### 1. خادم WebSocket ([server/websocket.ts](server/websocket.ts))

يوفر الخادم:
- إدارة الاتصالات في الوقت الفعلي
- إدارة الغرف (Rooms) للتعاون
- مزامنة التحديثات بين المستخدمين
- تتبع المستخدمين المتصلين
- إدارة دورة حياة الجلسات

**الأحداث الرئيسية:**
- `join-room`: الانضمام إلى غرفة تعاون
- `leave-room`: مغادرة الغرفة
- `sync-initial`: استقبال الحالة الأولية
- `sync-update`: إرسال/استقبال التحديثات
- `cursor-update`: تحديثات موضع المؤشر
- `selection-update`: تحديثات التحديد
- `user-joined`: إشعار بانضمام مستخدم
- `user-left`: إشعار بمغادرة مستخدم

### 2. مدير التعاون ([client/src/lib/collaboration.ts](client/src/lib/collaboration.ts))

يوفر `CollaborationManager`:
- إنشاء وإدارة Y.Doc (مستند CRDT)
- الاتصال بخادم WebSocket
- معالجة التحديثات والمزامنة
- إدارة حالة المستخدمين
- تتبع المؤشرات والتحديدات

**الخصائص الرئيسية:**
```typescript
class CollaborationManager {
  getDoc(): Y.Doc
  getText(fieldName: string): Y.Text
  getMap(mapName: string): Y.Map<any>
  connect(roomId, user, handlers, serverUrl?)
  disconnect()
  updateCursor(position)
  updateSelection(selection)
  isActive(): boolean
}
```

### 3. React Hook ([client/src/hooks/useCollaboration.ts](client/src/hooks/useCollaboration.ts))

Hook سهل الاستخدام للمكونات React:

```typescript
const {
  manager,
  isConnected,
  users,
  cursors,
  selections,
  updateCursor,
  updateSelection
} = useCollaboration({
  roomId: "my-room",
  userName: "John",
  enabled: true,
  onUserJoined: (user) => console.log("User joined:", user)
});
```

### 4. مكونات UI

#### CollaborationProvider
```tsx
<CollaborationProvider roomId="room-123" userName="User">
  <YourComponent />
</CollaborationProvider>
```

#### CollaborationIndicator
مؤشر بصري لحالة الاتصال والمستخدمين المتصلين.

#### CollaborationCursor
عرض مؤشرات المستخدمين الآخرين في الوقت الفعلي.

## خصائص CRDT

النظام يضمن الخصائص التالية:

### 1. التبادلية (Commutativity)
يمكن تطبيق العمليات بأي ترتيب والحصول على نفس النتيجة النهائية.

```javascript
// مثال: إدراجان متزامنان
User1: insert(0, "Hello")
User2: insert(0, "World")
// النتيجة النهائية متسقة في كلا الطرفين
```

### 2. الترابطية (Associativity)
تجميع العمليات لا يؤثر على النتيجة النهائية.

### 3. التقارب (Convergence)
جميع النسخ تصل في النهاية إلى نفس الحالة بعد تطبيق جميع التحديثات.

### 4. الإدمبوتنس (Idempotence)
تطبيق نفس التحديث عدة مرات له نفس تأثير تطبيقه مرة واحدة.

### 5. الحفاظ على السببية (Causality Preservation)
يتم الحفاظ على ترتيب العمليات السببية.

## الاستخدام

### إعداد أساسي

```typescript
import { CollaborationManager } from "@/lib/collaboration";

const manager = new CollaborationManager();

manager.connect("room-id", {
  userId: "user-123",
  userName: "John Doe",
  color: "#FF6B6B"
}, {
  onConnected: () => console.log("Connected"),
  onUserJoined: (user) => console.log("User joined:", user),
  onUserLeft: (user) => console.log("User left:", user)
});

// الحصول على Y.Text للمحرر
const text = manager.getText("content");

// الاستماع للتغييرات
text.observe(() => {
  console.log("Content changed:", text.toString());
});

// إجراء تغييرات
text.insert(0, "Hello, World!");
```

### استخدام مع React

```tsx
import { CollaborationProvider, useCollaborationContext } from "@/components/collaboration";

function App() {
  return (
    <CollaborationProvider roomId="my-room" userName="User">
      <Editor />
    </CollaborationProvider>
  );
}

function Editor() {
  const { manager, isConnected, users } = useCollaborationContext();

  useEffect(() => {
    if (manager) {
      const text = manager.getText("content");
      // ربط المحرر بـ Y.Text
    }
  }, [manager]);

  return (
    <div>
      {isConnected ? "متصل" : "غير متصل"}
      <span>المستخدمون: {users.length}</span>
    </div>
  );
}
```

### استخدام مع Monaco Editor

```typescript
import * as monaco from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';

const editor = monaco.editor.create(element, options);
const yText = manager.getText('content');

// إنشاء ربط بين Monaco و Y.Text
const binding = new MonacoBinding(
  yText,
  editor.getModel(),
  new Set([editor])
);
```

## الاختبارات

### اختبارات الخصائص ([server/__tests__/collaboration.test.ts](server/__tests__/collaboration.test.ts))

تحقق من خصائص CRDT:
- التبادلية
- الترابطية
- الإدمبوتنس
- التقارب
- الحفاظ على السببية
- معالجة الحذف
- خصائص Map CRDT
- تحمل تقسيم الشبكة

### اختبارات التكامل ([server/__tests__/websocket.test.ts](server/__tests__/websocket.test.ts))

تحقق من:
- الاتصال بالخادم
- الانضمام إلى الغرف
- مزامنة التحديثات
- إشعارات المستخدمين
- التعديلات المتزامنة

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل مع المراقبة
npm run test:watch

# تقرير التغطية
npm run test:coverage
```

## مثال تجريبي

افتح [examples/collaboration-demo.html](examples/collaboration-demo.html) في عدة نوافذ متصفح لتجربة التعاون الحي.

### خطوات التجربة:

1. افتح الملف في نافذتين أو أكثر
2. استخدم نفس معرف الغرفة في جميع النوافذ
3. اضغط "اتصل" في كل نافذة
4. ابدأ الكتابة في أي نافذة
5. شاهد التحديثات الفورية في جميع النوافذ

## البنية التحتية

### التقنيات المستخدمة

- **Socket.IO**: اتصالات WebSocket في الوقت الفعلي
- **Yjs**: مكتبة CRDT للمزامنة
- **React**: مكونات UI
- **TypeScript**: سلامة الأنواع
- **Jest**: إطار الاختبار

### هيكل الملفات

```
server/
  websocket.ts          # خادم WebSocket
  __tests__/
    collaboration.test.ts  # اختبارات CRDT
    websocket.test.ts      # اختبارات التكامل

client/src/
  lib/
    collaboration.ts    # مدير التعاون
  hooks/
    useCollaboration.ts # React hook
  components/
    collaboration/
      CollaborationProvider.tsx
      CollaborationIndicator.tsx
      CollaborationCursor.tsx

examples/
  collaboration-demo.html  # مثال تجريبي
```

## الأداء والتحسينات

### تحسينات الأداء:

1. **تنظيف الغرف الفارغة**: يتم تنظيف الغرف تلقائياً كل 5 دقائق
2. **ضغط التحديثات**: استخدام ترميز Y.js الفعال
3. **إعادة الاتصال التلقائي**: Socket.IO يدعم إعادة الاتصال
4. **مزامنة تفاضلية**: إرسال التغييرات فقط، وليس المستند بالكامل

### اعتبارات قابلية التوسع:

- استخدام Redis Adapter لـ Socket.IO للتوسع الأفقي
- تخزين الحالة في قاعدة بيانات للمثابرة
- استخدام CDN للملفات الثابتة
- تطبيق حدود معدل الطلبات

## الأمان

### إجراءات الأمان المطبقة:

1. **CORS**: تكوين CORS مناسب
2. **التحقق من الهوية**: يمكن إضافة مصادقة Socket.IO
3. **التحقق من الصحة**: التحقق من البيانات الواردة
4. **حدود المعدل**: منع إساءة الاستخدام
5. **تنظيف البيانات**: تنظيف المدخلات من المستخدم

### التوصيات:

- تنفيذ مصادقة المستخدم
- استخدام HTTPS في الإنتاج
- تطبيق حدود على حجم الغرفة
- مراقبة الاستخدام غير الطبيعي
- تشفير البيانات الحساسة

## استكشاف الأخطاء

### المشاكل الشائعة:

**1. عدم الاتصال بالخادم:**
- تحقق من عنوان الخادم
- تأكد من تشغيل خادم WebSocket
- تحقق من إعدادات الجدار الناري

**2. عدم المزامنة:**
- تحقق من معرف الغرفة
- تأكد من تطبيق التحديثات بشكل صحيح
- راجع سجلات الخادم

**3. مشاكل الأداء:**
- قلل حجم المستند
- استخدم التحديثات التفاضلية
- راقب استخدام الذاكرة

## المساهمة

لإضافة ميزات جديدة:

1. أضف الاختبارات أولاً
2. نفذ الميزة
3. وثق الاستخدام
4. أرسل pull request

## الترخيص

MIT License - راجع ملف LICENSE للتفاصيل.

## الدعم

للأسئلة أو المشاكل، افتح issue في GitHub.

## مراجع

- [Yjs Documentation](https://docs.yjs.dev/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [CRDT Explained](https://crdt.tech/)
- [Conflict-free Replicated Data Types](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
