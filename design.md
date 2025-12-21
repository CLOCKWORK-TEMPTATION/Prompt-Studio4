# تصميم دمج PromptStudio

## نظرة عامة

يهدف هذا المشروع إلى دمج مستودع PromptStudio الخارجي مع التطبيق الحالي لإنشاء منصة شاملة لهندسة المطالبات. التطبيق الحالي يوفر نظام وكلاء ثلاثي متقدم مع سير عمل من 7 مراحل، بينما PromptStudio يوفر ميزات إضافية قوية مثل التعاون الحي، توليد SDK، النشر السحابي، والتخزين المؤقت الدلالي.

الهدف هو إنشاء تطبيق موحد يجمع أفضل ما في العالمين دون فقدان أي وظائف من أي من التطبيقين.

## المعمارية

### البنية العامة

```
التطبيق المدمج
├── Frontend (Next.js 16 + React 19)
│   ├── التطبيق الحالي (نظام الوكلاء الثلاثة)
│   ├── PromptStudio (محرر المطالبات المتقدم)
│   ├── التعاون الحي (CRDT + WebSocket)
│   ├── توليد SDK
│   └── النشر السحابي
│
├── Backend (Express + TypeScript)
│   ├── APIs الحالية (نظام الوكلاء)
│   ├── APIs PromptStudio
│   ├── خدمات التعاون الحي
│   ├── خدمات التخزين المؤقت الدلالي
│   └── خدمات توليد SDK
│
├── Database (PostgreSQL + Drizzle ORM)
│   ├── جداول التطبيق الحالي
│   ├── جداول PromptStudio
│   └── جداول التكامل
│
└── Infrastructure
    ├── Redis (التخزين المؤقت + pub/sub)
    ├── WebSocket (التعاون الحي)
    └── Docker (التشغيل الموحد)
```

### استراتيجية الدمج

1. **الدمج التدريجي**: دمج المكونات تدريجياً لتجنب كسر الوظائف الموجودة
2. **التوافق العكسي**: الحفاظ على جميع APIs والوظائف الحالية
3. **التوحيد القياسي**: استخدام نفس المعايير والأنماط في كلا التطبيقين
4. **الفصل المنطقي**: فصل الوظائف الجديدة في وحدات منفصلة قابلة للاختبار

## المكونات والواجهات

### 1. مكونات الواجهة الأمامية

#### المكونات الحالية (محفوظة)
- `WorkflowStepper` - خطوات سير العمل السبع
- `StageHeader` - رأس المرحلة
- `Stage0Idea` إلى `Stage6Organize` - مراحل العمل
- جميع مكونات shadcn/ui الموجودة

#### المكونات الجديدة (من PromptStudio)
```typescript
// مكونات محرر المطالبات المتقدم
interface PromptEditorComponents {
  AdvancedPromptEditor: React.FC<AdvancedPromptEditorProps>
  VariableManager: React.FC<VariableManagerProps>
  ModelConfigPanel: React.FC<ModelConfigProps>
  PromptTester: React.FC<PromptTesterProps>
}

// مكونات التعاون الحي
interface CollaborationComponents {
  CollaborativeEditor: React.FC<CollaborativeEditorProps>
  PresenceIndicator: React.FC<PresenceProps>
  CommentSystem: React.FC<CommentSystemProps>
  VersionHistory: React.FC<VersionHistoryProps>
}

// مكونات توليد SDK
interface SDKGeneratorComponents {
  SDKGenerator: React.FC<SDKGeneratorProps>
  CodePreview: React.FC<CodePreviewProps>
  DownloadManager: React.FC<DownloadManagerProps>
}

// مكونات النشر السحابي
interface CloudDeploymentComponents {
  DeploymentWizard: React.FC<DeploymentWizardProps>
  CloudProviderSelector: React.FC<CloudProviderProps>
  DeploymentStatus: React.FC<DeploymentStatusProps>
}
```

## نماذج البيانات

### الجداول الحالية (محفوظة)
جميع الجداول الموجودة في `shared/schema.ts` ستبقى كما هي:
- `templates`, `techniques`, `prompts`, `promptVersions`
- `runs`, `runRatings`, `agentComposeRuns`, `agentComposeResults`

### الجداول الجديدة (من PromptStudio)
```typescript
// جداول التعاون الحي
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull(),
  isPublic: boolean("is_public").default(false),
  settings: jsonb("settings").$type<SessionSettings>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// جداول التخزين المؤقت الدلالي
export const semanticCache = pgTable("semantic_cache", {
  id: serial("id").primaryKey(),
  promptHash: text("prompt_hash").notNull().unique(),
  promptText: text("prompt_text").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  response: text("response").notNull(),
  model: text("model").notNull(),
  settings: jsonb("settings").$type<ModelSettings>().notNull(),
  tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`),
  hitCount: integer("hit_count").default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## خصائص الصحة

*الخاصية هي سمة أو سلوك يجب أن يكون صحيحاً عبر جميع عمليات التنفيذ الصالحة للنظام - في الأساس، بيان رسمي حول ما يجب أن يفعله النظام. الخصائص تعمل كجسر بين المواصفات المقروءة بشرياً وضمانات الصحة القابلة للتحقق آلياً.*

### خصائص الدمج الأساسية

**الخاصية 1: الحفاظ على الوظائف الحالية**
*لأي* وظيفة موجودة في التطبيق الحالي، يجب أن تعمل بنفس الطريقة بعد الدمج
**تتحقق من: المتطلبات 7.1, 7.2, 7.3, 7.4, 7.5**

**الخاصية 2: دمج التبعيات بدون تعارض**
*لأي* تبعية مشتركة بين التطبيقين، يجب اختيار الإصدار الأحدث المتوافق دون كسر الوظائف
**تتحقق من: المتطلبات 5.1, 5.2**

**الخاصية 3: توحيد قاعدة البيانات**
*لأي* جدول جديد يتم إضافته، يجب ألا يتعارض مع الجداول الموجودة ويجب أن يتبع نفس نمط التسمية
**تتحقق من: المتطلبات 2.1, 2.2, 2.3**

**الخاصية 4: توحيد واجهة المستخدم**
*لأي* مكون جديد يتم إضافته، يجب أن يستخدم نفس نظام التصميم والمتغيرات المستخدمة في التطبيق الحالي
**تتحقق من: المتطلبات 3.1, 3.3**

**الخاصية 5: توحيد APIs**
*لأي* نقطة نهاية جديدة، يجب أن تتبع نفس نمط المصادقة ومعالجة الأخطاء المستخدم في التطبيق الحالي
**تتحقق من: المتطلبات 4.1, 4.3, 4.4**

### خصائص الوظائف الجديدة

**الخاصية 6: التعاون الحي**
*لأي* جلسة تعاون، يجب أن تحافظ على تزامن البيانات بين جميع المشاركين في الوقت الفعلي
**تتحقق من: المتطلبات 8.2**

**الخاصية 7: التخزين المؤقت الدلالي**
*لأي* مطالبة متشابهة دلالياً، يجب أن يعيد النظام النتيجة المخزنة مؤقتاً إذا كان مستوى التشابه أعلى من العتبة المحددة
**تتحقق من: المتطلبات 8.2**

**الخاصية 8: توليد SDK**
*لأي* مطالبة صالحة، يجب أن ينتج مولد SDK كود قابل للتشغيل وخالي من الأخطاء النحوية
**تتحقق من: المتطلبات 8.2**

## معالجة الأخطاء

### استراتيجية معالجة الأخطاء الموحدة

1. **نمط الاستجابة الموحد**
```typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}
```

2. **فئات الأخطاء**
- أخطاء التحقق من صحة البيانات
- أخطاء المصادقة والتخويل
- أخطاء الموارد غير الموجودة
- أخطاء التعارض
- أخطاء الخدمات الخارجية

## استراتيجية الاختبار

### اختبار الوحدة والتكامل

1. **اختبار المكونات الجديدة**
- اختبار مكونات React الجديدة
- اختبار الخدمات الجديدة
- اختبار وظائف المساعدة

2. **اختبار التكامل**
- اختبار تكامل قاعدة البيانات
- اختبار تكامل APIs
- اختبار تكامل WebSocket

### اختبار قائم على الخصائص

سنستخدم مكتبة **fast-check** لـ TypeScript لتنفيذ اختبارات قائمة على الخصائص. كل اختبار خاصية سيتم تشغيله لـ 100 تكرار على الأقل لضمان التغطية الشاملة.

**متطلبات اختبار الخصائص:**
- كل خاصية صحة يجب أن تُنفذ بواسطة اختبار خاصية واحد
- كل اختبار خاصية يجب أن يُعلم بتعليق يشير إلى الخاصية في وثيقة التصميم
- تنسيق التعليق: `**Feature: prompt-studio-integration, Property {number}: {property_text}**`
- الحد الأدنى 100 تكرار لكل اختبار خاصية