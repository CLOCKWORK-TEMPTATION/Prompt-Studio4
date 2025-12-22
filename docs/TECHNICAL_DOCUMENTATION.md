# التوثيق التقني الشامل - Prompt Studio 4

> **الإصدار**: 4.0
> **تاريخ التحديث**: 2024-12-22
> **الحالة**: مشروع مدمج ومُحدَّث

---

## جدول المحتويات

1. [نظرة عامة على البنية](#نظرة-عامة-على-البنية)
2. [هيكل المجلدات](#هيكل-المجلدات)
3. [الخدمات الخلفية (Backend Services)](#الخدمات-الخلفية)
4. [توثيق واجهات برمجة التطبيقات (APIs)](#توثيق-واجهات-برمجة-التطبيقات)
5. [مخطط قاعدة البيانات](#مخطط-قاعدة-البيانات)
6. [نظام WebSocket](#نظام-websocket)
7. [التقنيات المستخدمة](#التقنيات-المستخدمة)
8. [التشغيل والنشر](#التشغيل-والنشر)

---

## نظرة عامة على البنية

Prompt Studio 4 هو منصة متكاملة لإدارة وتطوير واختبار ونشر الـ Prompts باستخدام الذكاء الاصطناعي. يتبع المشروع نموذج **Monorepo** مع فصل واضح بين:

```
┌─────────────────────────────────────────────────────────────────┐
│                        العميل (Client)                          │
│   React + TypeScript + TailwindCSS + shadcn/ui                 │
├─────────────────────────────────────────────────────────────────┤
│                    WebSocket (Socket.IO + Y.js)                 │
│              للتعاون الفوري والتحرير المتزامن                    │
├─────────────────────────────────────────────────────────────────┤
│                     الخادم (Server)                              │
│           Express.js + TypeScript + Drizzle ORM                 │
├─────────────────────────────────────────────────────────────────┤
│                    قاعدة البيانات                                │
│                     PostgreSQL                                  │
└─────────────────────────────────────────────────────────────────┘
```

### المميزات الرئيسية

- **إدارة القوالب (Templates)**: إنشاء وتحرير وتصنيف قوالب الـ Prompts
- **تقنيات كتابة Prompts**: مكتبة من أفضل الممارسات والتقنيات
- **Tri-Agent Composer**: نظام ثلاثي الوكلاء لتحسين الـ Prompts
- **Semantic Cache**: تخزين مؤقت ذكي مع دعم التشابه الدلالي
- **SDK Generator**: توليد SDKs تلقائياً بعدة لغات برمجة
- **Cloud Deployment**: نشر الـ Prompts على منصات سحابية
- **Real-time Collaboration**: تعاون فوري باستخدام CRDT و Y.js

---

## هيكل المجلدات

```
Prompt-Studio4/
├── app/                    # Next.js App Router (صفحات إضافية)
│   ├── api/               # API Routes لـ Next.js
│   ├── runs/              # صفحة سجل التشغيل
│   ├── settings/          # صفحة الإعدادات
│   ├── studio/            # صفحة الاستوديو الرئيسية
│   ├── techniques/        # صفحة التقنيات
│   └── templates/         # صفحة القوالب
│
├── client/                # تطبيق React الرئيسي
│   ├── src/
│   │   ├── components/    # مكونات واجهة المستخدم
│   │   │   ├── collaboration/  # مكونات التعاون الفوري
│   │   │   ├── layout/         # مكونات التخطيط
│   │   │   ├── stages/         # مراحل سير العمل
│   │   │   └── ui/             # مكونات shadcn/ui
│   │   ├── hooks/         # React Hooks مخصصة
│   │   ├── lib/           # دوال مساعدة
│   │   └── pages/         # صفحات التطبيق
│   │       ├── Analytics.tsx        # تحليلات الأداء
│   │       ├── CloudDeployment.tsx  # نشر سحابي
│   │       ├── Collaboration.tsx    # التعاون الفوري
│   │       ├── Home.tsx             # الصفحة الرئيسية
│   │       ├── SDKGenerator.tsx     # مولد SDK
│   │       ├── Studio.tsx           # الاستوديو الرئيسي
│   │       └── ...
│   └── public/            # الملفات الثابتة
│
├── server/                # خادم Express.js
│   ├── routes/            # مسارات API إضافية
│   │   ├── deployment.ts  # مسارات النشر السحابي
│   │   └── sdk.ts         # مسارات SDK
│   ├── services/          # خدمات الأعمال
│   │   ├── CRDTManager.ts           # إدارة CRDT للتعاون
│   │   ├── CacheCleanupScheduler.ts # جدولة تنظيف Cache
│   │   ├── CloudDeploymentService.ts# خدمة النشر السحابي
│   │   ├── DeploymentService.ts     # خدمة النشر العامة
│   │   ├── SDKGeneratorService.ts   # خدمة توليد SDK
│   │   └── SemanticCacheService.ts  # خدمة التخزين الدلالي
│   ├── lib/               # مكتبات داخلية
│   │   └── sdk-generator/ # مولد SDK المتقدم
│   ├── websocket/         # WebSocket handlers
│   ├── agents.ts          # وكلاء الذكاء الاصطناعي
│   ├── index.ts           # نقطة الدخول للخادم
│   ├── llm-provider.ts    # موفر LLM (Groq)
│   ├── routes.ts          # تعريف جميع المسارات
│   ├── storage.ts         # طبقة التخزين (Drizzle)
│   └── websocket.ts       # إعداد WebSocket
│
├── shared/                # كود مشترك
│   └── schema.ts          # مخطط قاعدة البيانات (Drizzle)
│
├── migrations/            # ملفات ترحيل قاعدة البيانات
├── components/            # مكونات Next.js إضافية
├── hooks/                 # React Hooks عامة
├── lib/                   # مكتبات عامة
├── docs/                  # التوثيق
└── examples/              # أمثلة الاستخدام
```

---

## الخدمات الخلفية

### 1. SemanticCacheService
خدمة التخزين المؤقت الدلالي للاستجابات.

```typescript
// المميزات:
- البحث بالتشابه الدلالي (Semantic Similarity)
- عتبة تشابه قابلة للتكوين (0.0 - 1.0)
- TTL تلقائي للعناصر المخزنة
- إحصائيات شاملة (hits, misses, tokens saved)
- إبطال يدوي أو تلقائي

// الاستخدام:
const result = await semanticCacheService.lookup({ prompt, model });
await semanticCacheService.store({ prompt, response, model });
```

### 2. SDKGeneratorService
خدمة توليد SDKs تلقائياً من الـ Prompts.

```typescript
// اللغات المدعومة:
- TypeScript/JavaScript
- Python
- Java
- Go
- Ruby
- PHP
- C#
- Rust

// المميزات:
- توليد كود نظيف ومنظم
- دعم Type Safety
- توليد وثائق تلقائية
- اختبارات تلقائية
```

### 3. CloudDeploymentService
خدمة نشر الـ Prompts على منصات سحابية.

```typescript
// المنصات المدعومة:
- AWS Lambda
- Google Cloud Functions
- Azure Functions
- Vercel Edge Functions
- Cloudflare Workers

// المميزات:
- نشر بنقرة واحدة
- إدارة الإصدارات
- مراقبة الأداء
- Rollback تلقائي
```

### 4. CRDTManager
إدارة مستندات CRDT للتعاون الفوري.

```typescript
// المميزات:
- تزامن تلقائي بين المستخدمين
- حل الصراعات تلقائياً
- دعم Offline-first
- تاريخ التغييرات
```

### 5. LLM Provider
موفر خدمات الذكاء الاصطناعي.

```typescript
// الموفرون المدعومون:
- Groq (الافتراضي)
- قابل للتوسيع لموفرين آخرين

// المميزات:
- إدارة مفاتيح API
- Rate limiting
- Error handling
- Retry logic
```

---

## توثيق واجهات برمجة التطبيقات

### Health Check
```http
GET /api/health
Response: { ok: true, status: "healthy", timestamp: "ISO8601" }
```

---

### Templates API

#### الحصول على جميع القوالب
```http
GET /api/templates
Query: ?search=keyword (اختياري)
Response: Template[]
```

#### الحصول على قالب محدد
```http
GET /api/templates/:id
Response: Template
```

#### إنشاء قالب جديد
```http
POST /api/templates
Body: {
  name: string,
  description: string,
  category: string,
  tags: string[],
  sections: {
    system: string,
    developer: string,
    user: string,
    context: string
  },
  defaultVariables: Array<{ id: string, name: string, value: string }>
}
Response: Template
```

#### تحديث قالب
```http
PUT /api/templates/:id
Body: Partial<Template>
Response: Template
```

#### حذف قالب
```http
DELETE /api/templates/:id
Response: 204 No Content
```

---

### Techniques API

#### الحصول على جميع التقنيات
```http
GET /api/techniques
Response: Technique[]
```

#### الحصول على تقنية محددة
```http
GET /api/techniques/:id
Response: Technique
```

#### إنشاء تقنية جديدة
```http
POST /api/techniques
Body: {
  title: string,
  description: string,
  goodExample: string,
  badExample: string,
  commonMistakes: string[],
  snippet?: string
}
Response: Technique
```

#### تحديث تقنية
```http
PUT /api/techniques/:id
Body: Partial<Technique>
Response: Technique
```

#### حذف تقنية
```http
DELETE /api/techniques/:id
Response: 204 No Content
```

---

### Runs API

#### الحصول على سجل التشغيل
```http
GET /api/runs
Query: ?limit=100 (اختياري)
Response: Run[]
```

#### الحصول على تشغيل محدد
```http
GET /api/runs/:id
Response: Run
```

---

### Run Ratings API

#### الحصول على تقييم تشغيل
```http
GET /api/runs/:runId/rating
Response: RunRating | null
```

#### إنشاء تقييم
```http
POST /api/runs/:runId/rating
Body: {
  rating: number,
  notes?: string,
  tags?: string[]
}
Response: RunRating
```

#### تحديث تقييم
```http
PUT /api/runs/:runId/rating/:id
Body: Partial<RunRating>
Response: RunRating
```

---

### AI API

#### تشغيل Prompt
```http
POST /api/ai/run
Body: {
  sections: {
    system: string,
    developer: string,
    user: string,
    context: string
  },
  variables: Array<{ id: string, name: string, value: string }>,
  model: string,
  temperature: number (0-2),
  maxTokens?: number,
  promptVersionId?: string
}
Response: {
  runId: number,
  output: string,
  latency: number,
  tokenUsage: { prompt: number, completion: number, total: number }
}
```

#### نقد Prompt
```http
POST /api/ai/critique
Body: {
  sections: {
    system: string,
    developer: string,
    user: string,
    context: string
  }
}
Response: CritiqueResult
```

---

### Agent Compose API (Tri-Agent System)

#### بدء عملية Compose
```http
POST /api/agents/compose
Body: {
  rawIdea: string,
  goal?: string,
  constraints?: string,
  outputFormat?: string,
  modelConfig?: {
    model: string,
    temperature: number,
    maxTokens?: number
  }
}
Response: { runId: number }
```

#### الحصول على حالة Compose
```http
GET /api/agents/compose/:runId
Response: {
  status: "pending" | "running" | "completed" | "failed",
  stage: "agent1" | "agent2" | "agent3" | "done",
  progress: number (0-100),
  error?: string,
  result?: {
    agent1: Agent1Output,
    agent2: Agent2Output,
    agent3: Agent3Output
  }
}
```

---

### Session API Key Management

#### تفعيل مفتاح API
```http
POST /api/session/api-key
Body: { apiKey: string }
Response: { success: true, message: string }
```

#### إلغاء مفتاح API
```http
DELETE /api/session/api-key
Response: { success: true, message: string }
```

#### حالة مفتاح API
```http
GET /api/session/api-key/status
Response: {
  hasSessionKey: boolean,
  hasEnvironmentKey: boolean,
  canRun: boolean
}
```

---

### Semantic Cache API

#### البحث في Cache
```http
POST /api/cache/lookup
Body: { prompt: string, model: string }
Response: { hit: boolean, response?: string, similarity?: number }
```

#### حفظ في Cache
```http
POST /api/cache/store
Body: { prompt: string, response: string, model: string }
Response: CacheEntry
```

#### الحصول على التكوينات
```http
GET /api/cache/config
Response: CacheConfig
```

#### تحديث التكوينات
```http
PUT /api/cache/config
Body: Partial<CacheConfig>
Response: CacheConfig
```

#### الحصول على التحليلات
```http
GET /api/cache/analytics
Response: CacheAnalytics
```

#### إبطال Cache
```http
POST /api/cache/invalidate
Body: { pattern?: string, tags?: string[], all?: boolean }
Response: { invalidated: number }
```

#### تنظيف يدوي
```http
POST /api/cache/cleanup
Response: { cleaned: number }
```

#### حالة المُجدول
```http
GET /api/cache/cleanup/status
Response: CleanupStatus
```

#### تحديث إعدادات المُجدول
```http
PUT /api/cache/cleanup/config
Body: { intervalMinutes?: number, enabled?: boolean }
Response: { success: true, config: CleanupStatus }
```

---

### SDK Generation API

#### توليد SDK
```http
POST /api/sdk/generate
Body: {
  promptId: string,
  language: "typescript" | "python" | "java" | "go" | ...,
  options?: SDKOptions
}
Response: GeneratedSDK
```

#### اختبار SDK
```http
POST /api/sdk/test
Body: {
  sdk: GeneratedSDK,
  promptId: string
}
Response: TestResult
```

#### اللغات المدعومة
```http
GET /api/sdk/languages
Response: { languages: string[] }
```

---

### Collaboration API

#### إنشاء جلسة تعاون
```http
POST /api/collaboration/sessions
Body: {
  name: string,
  description?: string,
  initialContent?: string
}
Response: {
  id: string,
  name: string,
  description: string,
  createdAt: string,
  activeConnections: number
}
```

#### الحصول على جلسة
```http
GET /api/collaboration/sessions/:sessionId
Response: {
  id: string,
  content: string,
  stats: SessionStats
}
```

#### قائمة الجلسات النشطة
```http
GET /api/collaboration/sessions
Response: Array<{ id: string, stats: SessionStats }>
```

---

### Cloud Deployment API

#### نشر Prompt
```http
POST /api/deploy
Body: {
  promptId: string,
  config: DeploymentConfig
}
Response: DeploymentResult
```

#### حالة النشر
```http
GET /api/deploy/:deploymentId
Response: DeploymentStatus
```

#### قائمة النشرات
```http
GET /api/deploy
Response: Deployment[]
```

#### حذف نشر
```http
DELETE /api/deploy/:deploymentId
Response: 204 No Content
```

#### المنصات المدعومة
```http
GET /api/deploy/platforms
Response: { platforms: string[] }
```

---

## مخطط قاعدة البيانات

### الجداول الأساسية

#### 1. templates
قوالب الـ Prompts الأساسية.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| name | text | اسم القالب |
| description | text | وصف القالب |
| category | text | التصنيف |
| tags | jsonb | الوسوم (مصفوفة) |
| sections | jsonb | أقسام الـ Prompt |
| default_variables | jsonb | المتغيرات الافتراضية |
| created_at | timestamp | تاريخ الإنشاء |

#### 2. techniques
تقنيات كتابة الـ Prompts.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| title | text | عنوان التقنية |
| description | text | وصف التقنية |
| good_example | text | مثال جيد |
| bad_example | text | مثال سيء |
| common_mistakes | jsonb | الأخطاء الشائعة |
| snippet | text | مقتطف الكود |
| created_at | timestamp | تاريخ الإنشاء |

#### 3. runs
سجل تشغيل الـ Prompts.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| prompt_version_id | text | معرف إصدار الـ Prompt |
| sections | jsonb | أقسام الـ Prompt |
| variables | jsonb | المتغيرات المستخدمة |
| model | text | النموذج المستخدم |
| temperature | integer | درجة الحرارة (×100) |
| max_tokens | integer | الحد الأقصى للـ Tokens |
| output | text | الناتج |
| latency | integer | زمن الاستجابة (ms) |
| token_usage | jsonb | استهلاك الـ Tokens |
| created_at | timestamp | تاريخ الإنشاء |

#### 4. run_ratings
تقييمات التشغيل.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| run_id | integer | معرف التشغيل (FK) |
| rating | integer | التقييم |
| notes | text | ملاحظات |
| tags | jsonb | وسوم التقييم |
| created_at | timestamp | تاريخ الإنشاء |

---

### جداول Multi-Tenancy

#### 5. tenants
المستأجرون (Organizations).

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | text | المعرف (UUID) |
| name | text | اسم المستأجر |
| domain | text | النطاق (فريد) |
| api_key | text | مفتاح API (فريد) |
| config | jsonb | التكوينات |
| is_active | boolean | نشط/غير نشط |
| created_at | timestamp | تاريخ الإنشاء |
| updated_at | timestamp | تاريخ التحديث |

#### 6. users
المستخدمون.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | text | المعرف (UUID) |
| email | text | البريد الإلكتروني (فريد) |
| name | text | الاسم |
| avatar | text | رابط الصورة |
| color | text | لون المستخدم |
| tenant_id | text | معرف المستأجر (FK) |
| created_at | timestamp | تاريخ الإنشاء |
| updated_at | timestamp | تاريخ التحديث |

---

### جداول Prompts المتقدمة

#### 7. prompts
الـ Prompts مع دعم الإصدارات.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | text | المعرف (UUID) |
| name | text | الاسم |
| description | text | الوصف |
| tenant_id | text | معرف المستأجر (FK) |
| owner_id | text | معرف المالك (FK) |
| active_version_id | text | الإصدار النشط |
| created_at | timestamp | تاريخ الإنشاء |
| updated_at | timestamp | تاريخ التحديث |

#### 8. prompt_versions
إصدارات الـ Prompts.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | text | المعرف (UUID) |
| prompt_id | text | معرف الـ Prompt (FK) |
| version | integer | رقم الإصدار |
| content | text | المحتوى البسيط |
| sections | jsonb | الأقسام المهيكلة |
| variables | jsonb | المتغيرات |
| performance_metrics | jsonb | مقاييس الأداء |
| created_at | timestamp | تاريخ الإنشاء |

---

### جداول التعاون

#### 9. collaboration_sessions
جلسات التعاون الفوري.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | text | المعرف (UUID) |
| name | text | اسم الجلسة |
| description | text | الوصف |
| content | text | المحتوى الحالي |
| is_active | boolean | نشطة/غير نشطة |
| share_token | text | رمز المشاركة (فريد) |
| tenant_id | text | معرف المستأجر (FK) |
| owner_id | text | معرف المالك (FK) |
| created_at | timestamp | تاريخ الإنشاء |
| updated_at | timestamp | تاريخ التحديث |

#### 10. session_members
أعضاء الجلسة.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | text | المعرف (UUID) |
| user_id | text | معرف المستخدم (FK) |
| session_id | text | معرف الجلسة (FK) |
| role | text | الدور (OWNER/EDITOR/VIEWER) |
| joined_at | timestamp | تاريخ الانضمام |
| last_seen_at | timestamp | آخر ظهور |

#### 11. edit_history
تاريخ التعديلات.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| session_id | text | معرف الجلسة (FK) |
| user_id | text | معرف المستخدم (FK) |
| operation | jsonb | العملية |
| content_before | text | المحتوى قبل |
| content_after | text | المحتوى بعد |
| created_at | timestamp | تاريخ الإنشاء |

---

### جداول Semantic Cache

#### 12. semantic_cache
التخزين المؤقت الدلالي.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | text | المعرف (UUID) |
| prompt | text | الـ Prompt |
| prompt_hash | text | Hash الـ Prompt |
| embedding | jsonb | Vector التضمين |
| response | text | الاستجابة |
| model | text | النموذج |
| hit_count | integer | عدد الإصابات |
| tokens_saved | integer | Tokens الموفرة |
| user_id | text | معرف المستخدم (FK) |
| created_at | timestamp | تاريخ الإنشاء |
| last_accessed_at | timestamp | آخر وصول |
| expires_at | timestamp | تاريخ الانتهاء |

#### 13. cache_tags
وسوم الـ Cache.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| name | text | اسم الوسم |
| cache_id | text | معرف الـ Cache (FK) |

#### 14. cache_statistics
إحصائيات الـ Cache اليومية.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| date | timestamp | التاريخ (فريد) |
| total_hits | integer | إجمالي الإصابات |
| total_misses | integer | إجمالي الإخفاقات |
| tokens_saved | integer | Tokens الموفرة |
| cost_saved | double | التكلفة الموفرة |

#### 15. cache_config
تكوينات الـ Cache.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| enabled | boolean | مفعل/معطل |
| similarity_threshold | double | عتبة التشابه |
| default_ttl_seconds | integer | TTL الافتراضي |
| max_cache_size | integer | الحجم الأقصى |
| invalidation_rules | jsonb | قواعد الإبطال |
| updated_at | timestamp | تاريخ التحديث |

---

### جداول Marketplace

#### 16. marketplace_prompts
سوق الـ Prompts.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | text | المعرف (UUID) |
| author_id | text | معرف المؤلف (FK) |
| title | text | العنوان |
| description | text | الوصف |
| content | text | المحتوى |
| category | text | التصنيف |
| tags | jsonb | الوسوم |
| is_featured | boolean | مميز |
| status | text | الحالة |
| created_at | timestamp | تاريخ الإنشاء |
| updated_at | timestamp | تاريخ التحديث |

---

### جداول Agent Compose

#### 17. agent_compose_runs
تشغيلات نظام الوكلاء.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| status | text | الحالة |
| stage | text | المرحلة |
| progress | integer | التقدم (0-100) |
| input_raw | text | الفكرة الخام |
| input_goal | text | الهدف |
| input_constraints | text | القيود |
| input_output_format | text | تنسيق الإخراج |
| model_config | jsonb | تكوين النموذج |
| error | text | الخطأ (إن وجد) |
| created_at | timestamp | تاريخ الإنشاء |
| finished_at | timestamp | تاريخ الانتهاء |

#### 18. agent_compose_results
نتائج نظام الوكلاء.

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | serial | المعرف الرئيسي |
| run_id | integer | معرف التشغيل (FK, فريد) |
| agent1_json | jsonb | ناتج الوكيل 1 |
| agent2_json | jsonb | ناتج الوكيل 2 |
| agent3_json | jsonb | ناتج الوكيل 3 |
| created_at | timestamp | تاريخ الإنشاء |

---

## نظام WebSocket

### البنية
يستخدم المشروع **Socket.IO** مع **Y.js** للتعاون الفوري.

### الأحداث

#### Client → Server

| الحدث | البيانات | الوصف |
|-------|----------|-------|
| `join-room` | `{ roomId, user }` | الانضمام لغرفة |
| `leave-room` | `roomId` | مغادرة غرفة |
| `sync-update` | `{ roomId, update }` | إرسال تحديث Y.js |
| `cursor-update` | `{ roomId, position }` | تحديث موقع المؤشر |
| `selection-update` | `{ roomId, selection }` | تحديث التحديد |
| `ping` | - | فحص الاتصال |

#### Server → Client

| الحدث | البيانات | الوصف |
|-------|----------|-------|
| `sync-initial` | `Uint8Array` | الحالة الأولية |
| `sync-update` | `Uint8Array` | تحديث من مستخدم آخر |
| `user-joined` | `{ userId, userName, color }` | انضمام مستخدم |
| `user-left` | `{ userId, userName }` | مغادرة مستخدم |
| `users-list` | `ClientInfo[]` | قائمة المستخدمين |
| `cursor-update` | `{ userId, position, ... }` | موقع مؤشر مستخدم |
| `selection-update` | `{ userId, selection, ... }` | تحديد مستخدم |
| `pong` | - | رد على ping |

---

## التقنيات المستخدمة

### Frontend
- **React 18** - إطار عمل واجهة المستخدم
- **TypeScript** - لغة البرمجة
- **TailwindCSS** - تنسيق CSS
- **shadcn/ui** - مكونات UI
- **React Query** - إدارة حالة الخادم
- **Socket.IO Client** - WebSocket
- **Y.js** - CRDT للتعاون
- **Vite** - أداة البناء

### Backend
- **Node.js** - بيئة التشغيل
- **Express.js** - إطار عمل الخادم
- **TypeScript** - لغة البرمجة
- **Drizzle ORM** - ORM لقاعدة البيانات
- **Socket.IO** - WebSocket Server
- **Zod** - التحقق من البيانات
- **connect-pg-simple** - تخزين الجلسات

### Database
- **PostgreSQL** - قاعدة البيانات الرئيسية

### AI/ML
- **Groq API** - مزود LLM
- **Llama 3.3** - النموذج الافتراضي

### DevOps
- **Docker** - حاويات
- **Docker Compose** - إدارة الخدمات
- **GitHub Actions** - CI/CD

---

## التشغيل والنشر

### متطلبات التشغيل

```bash
# Node.js 18+
node --version

# PostgreSQL 14+
psql --version

# Docker (اختياري)
docker --version
```

### المتغيرات البيئية

```env
# قاعدة البيانات
DATABASE_URL=postgresql://user:password@localhost:5432/promptstudio

# الجلسات
SESSION_SECRET=your-secret-key

# Groq API
GROQ_API_KEY=your-groq-api-key

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# الإنتاج
NODE_ENV=production
PORT=5000
```

### التشغيل المحلي

```bash
# تثبيت التبعيات
npm install

# تهيئة قاعدة البيانات
npm run db:push

# بذر البيانات الأولية
npm run db:seed

# التشغيل (development)
npm run dev

# التشغيل (production)
npm run build
npm start
```

### التشغيل بـ Docker

```bash
# تشغيل جميع الخدمات
docker-compose up -d

# تشغيل بيئة الإنتاج
docker-compose -f docker-compose.prod.yml up -d

# عرض السجلات
docker-compose logs -f
```

---

## المراجع

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Socket.IO](https://socket.io)
- [Y.js](https://yjs.dev)
- [Groq API](https://groq.com)
- [shadcn/ui](https://ui.shadcn.com)

---

> **ملاحظة**: هذا التوثيق يعكس الحالة الحالية للمشروع المدمج. للحصول على أحدث التغييرات، راجع الكود المصدري مباشرة.
