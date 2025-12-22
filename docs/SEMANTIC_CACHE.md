# التخزين المؤقت الدلالي (Semantic Caching)

## نظرة عامة

نظام التخزين المؤقت الدلالي هو نظام متقدم لتخزين نتائج استدعاءات LLM بناءً على التشابه الدلالي للمطالبات، مما يقلل من التكلفة ويحسن الأداء.

## الميزات الرئيسية

### 1. التشابه الدلالي
- استخدام OpenAI Embeddings لحساب التشابه بين المطالبات
- خوارزمية Cosine Similarity للبحث الدقيق
- عتبة تشابه قابلة للتكوين (افتراضياً 85%)

### 2. التخزين المؤقت الذكي
- تخزين فوري للمطالبات المتطابقة (Hash-based)
- بحث دلالي للمطالبات المتشابهة
- انتهاء صلاحية تلقائي (TTL)
- حد أقصى لحجم التخزين مع إزالة تلقائية للعناصر القديمة

### 3. التحليلات والإحصائيات
- معدل الإصابة (Hit Rate)
- عدد الرموز المحفوظة
- التكلفة المقدرة المحفوظة
- رسومات بيانية يومية للأداء

### 4. التنظيف التلقائي
- مُجدول دوري لحذف العناصر منتهية الصلاحية
- فترة زمنية قابلة للتكوين (افتراضياً كل ساعة)
- تنظيف يدوي عند الطلب

## البنية المعمارية

```
┌─────────────────────────────────────────────┐
│           Client Application                │
│   ┌─────────────────────────────────────┐   │
│   │     Analytics Dashboard             │   │
│   │  - Charts & Statistics              │   │
│   │  - Configuration Panel              │   │
│   │  - Scheduler Management             │   │
│   └─────────────────────────────────────┘   │
└────────────────┬────────────────────────────┘
                 │ HTTP/REST API
                 │
┌────────────────▼────────────────────────────┐
│         Express Server (Node.js)            │
│   ┌─────────────────────────────────────┐   │
│   │   SemanticCacheService              │   │
│   │  - lookup(prompt)                   │   │
│   │  - store(prompt, response)          │   │
│   │  - generateEmbedding(text)          │   │
│   │  - cosineSimilarity(v1, v2)         │   │
│   │  - cleanup()                        │   │
│   └────────┬───────────────┬────────────┘   │
│            │               │                 │
│   ┌────────▼──────┐   ┌───▼──────────────┐  │
│   │  OpenAI API   │   │  CacheScheduler  │  │
│   │  Embeddings   │   │  Auto-Cleanup    │  │
│   └───────────────┘   └──────────────────┘  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│          PostgreSQL Database                │
│   ┌─────────────────────────────────────┐   │
│   │  semantic_cache                     │   │
│   │  - id, prompt, promptHash           │   │
│   │  - embedding (jsonb vector)         │   │
│   │  - response, model, hitCount        │   │
│   │  - expiresAt, lastAccessedAt        │   │
│   └─────────────────────────────────────┘   │
│   ┌─────────────────────────────────────┐   │
│   │  cache_statistics                   │   │
│   │  - date, totalHits, totalMisses     │   │
│   │  - tokensSaved, costSaved           │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## API Reference

### 1. البحث في التخزين المؤقت
```typescript
POST /api/cache/lookup
Content-Type: application/json

{
  "prompt": "ما هي عاصمة فرنسا؟",
  "model": "llama-3.3-70b-versatile",
  "threshold": 0.85,
  "tags": ["geography"]
}

Response:
{
  "hit": true,
  "entry": {
    "id": "uuid",
    "prompt": "ما هي عاصمة فرنسا؟",
    "response": "عاصمة فرنسا هي باريس",
    "model": "llama-3.3-70b-versatile",
    "hitCount": 5,
    "tokensSaved": 120
  },
  "similarity": 1.0,
  "cached": true
}
```

### 2. حفظ في التخزين المؤقت
```typescript
POST /api/cache/store
Content-Type: application/json

{
  "prompt": "ما هي عاصمة فرنسا؟",
  "response": "عاصمة فرنسا هي باريس",
  "model": "llama-3.3-70b-versatile",
  "tags": ["geography"],
  "ttlSeconds": 3600,
  "userId": "user-123"
}

Response:
{
  "id": "uuid",
  "prompt": "...",
  "response": "...",
  "embedding": [...],
  "expiresAt": "2024-01-01T12:00:00Z",
  "tags": [...]
}
```

### 3. الحصول على الإحصائيات
```typescript
GET /api/cache/analytics

Response:
{
  "totalEntries": 1523,
  "hitRate": 67.5,
  "totalHits": 2340,
  "totalMisses": 1127,
  "tokensSaved": 456789,
  "estimatedCostSaved": 4.5678,
  "averageSimilarity": 0.92,
  "cacheSize": 52428800,
  "topTags": [...],
  "dailyStats": [...]
}
```

### 4. التنظيف اليدوي
```typescript
POST /api/cache/cleanup

Response:
{
  "success": true,
  "deletedCount": 45,
  "duration": 234
}
```

### 5. حالة المُجدول
```typescript
GET /api/cache/cleanup/status

Response:
{
  "isRunning": true,
  "isEnabled": true,
  "intervalMinutes": 60,
  "isCleanupInProgress": false
}
```

## التكوين

### متغيرات البيئة

```bash
# OpenAI API Key (مطلوب للتخزين المؤقت الدلالي)
OPENAI_API_KEY=sk-...

# تكوين المُجدول
CACHE_CLEANUP_ENABLED=true
CACHE_CLEANUP_INTERVAL_MINUTES=60
```

### التكوين عبر API

```typescript
PUT /api/cache/config
Content-Type: application/json

{
  "enabled": true,
  "similarityThreshold": 0.85,
  "defaultTTLSeconds": 3600,
  "maxCacheSize": 10000
}
```

## خوارزمية التشابه الدلالي

### Cosine Similarity

نستخدم خوارزمية Cosine Similarity لحساب التشابه بين متجهين:

```
similarity = (A · B) / (||A|| × ||B||)

حيث:
- A · B = الجداء القياسي (Dot Product)
- ||A|| = طول المتجه A
- ||B|| = طول المتجه B
```

### خصائص الخوارزمية

1. **التماثل (Symmetry)**: `sim(A, B) = sim(B, A)`
2. **التطابق الذاتي**: `sim(A, A) = 1.0`
3. **النطاق**: `-1 ≤ similarity ≤ 1`
4. **المتجهات المتعامدة**: `sim(A⊥B) = 0`

## معالجة الأخطاء

### 1. أخطاء OpenAI API

```typescript
RATE_LIMIT_EXCEEDED: "Too many requests to OpenAI API"
→ يتم استخدام Fallback embedding محلي

INVALID_API_KEY: "OpenAI API key is invalid"
→ يتم استخدام Fallback embedding محلي

OPENAI_SERVER_ERROR: "OpenAI service is temporarily unavailable"
→ يتم تسجيل miss وعدم إيقاف التطبيق
```

### 2. أخطاء قاعدة البيانات

- في حالة فشل الاتصال، يتم إعادة المحاولة
- في حالة فشل التخزين، يتم تسجيل الخطأ ومتابعة العمل
- النظام لا يتوقف بسبب أخطاء التخزين المؤقت

## الاختبارات

### Property-Based Testing

تم استخدام `fast-check` لاختبار الخصائص الرياضية:

```bash
npm test server/__tests__/semantic-cache.test.ts
```

الخصائص المُختبرة:
1. التماثل في حساب التشابه
2. التطابق الذاتي = 1
3. النطاق بين -1 و 1
4. المتجهات المتعامدة = 0
5. المتجهات المتعاكسة = -1
6. الحتمية في الـ Hash
7. عدم التصادم في الـ Hash
8. التطبيع الصحيح
9. ثبات طول المتجه
10. الحتمية في Embeddings

### اختبارات الانحدار

- متجهات فارغة
- متجهات بأطوال مختلفة
- متجهات صفرية
- أرقام عائمة صغيرة جداً

## الأداء والتحسين

### التحسينات المطبقة

1. **Hash-based Exact Match**: بحث فوري قبل البحث الدلالي
2. **Limited Scan**: فحص آخر 1000 عنصر فقط للبحث الدلالي
3. **Automatic Eviction**: إزالة 10% من العناصر الأقدم عند امتلاء التخزين
4. **Scheduled Cleanup**: تنظيف دوري للعناصر منتهية الصلاحية
5. **Fallback Embedding**: embedding محلي في حالة فشل OpenAI API

### الإحصائيات المتوقعة

- معدل الإصابة: 60-80% (حسب نوع الاستخدام)
- تقليل التكلفة: 50-70% من تكلفة API
- وقت الاستجابة: أسرع 10-100x من استدعاء LLM الفعلي

## أمثلة الاستخدام

### مثال 1: البحث البسيط

```typescript
const result = await fetch('/api/cache/lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'ما هي عاصمة مصر؟',
    model: 'llama-3.3-70b-versatile'
  })
});

if (result.hit) {
  console.log('Cache hit!', result.entry.response);
} else {
  // استدعاء LLM الفعلي
}
```

### مثال 2: التخزين بعد استدعاء LLM

```typescript
const llmResponse = await callLLM(prompt);

await fetch('/api/cache/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt,
    response: llmResponse,
    model: 'llama-3.3-70b-versatile',
    tags: ['general'],
    ttlSeconds: 3600
  })
});
```

### مثال 3: الإبطال بناءً على الوسوم

```typescript
await fetch('/api/cache/invalidate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'tag',
    tags: ['outdated', 'deprecated']
  })
});
```

## الخلاصة

نظام التخزين المؤقت الدلالي يوفر:

✅ تقليل تكلفة استدعاءات LLM بنسبة 50-70%
✅ تحسين وقت الاستجابة بمقدار 10-100x
✅ إحصائيات وتحليلات شاملة
✅ تنظيف تلقائي وإدارة ذكية للتخزين
✅ معالجة أخطاء متقدمة ومتانة عالية
✅ واجهة مستخدم غنية بالمعلومات

---

**تم التنفيذ في**: Epic 8 - التخزين المؤقت الدلالي
**الإصدار**: 1.0.0
**التاريخ**: ديسمبر 2025

