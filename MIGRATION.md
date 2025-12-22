# دليل الترحيل (Migration Guide)

هذا الدليل يساعدك في ترحيل مشروعك إلى الإصدار الأحدث من **Prompt Engineering Studio**.

---

## الترحيل إلى الإصدار 1.0.0

### نظرة عامة

الإصدار 1.0.0 هو الإصدار الأول الكامل ويتضمن تغييرات جوهرية في البنية والميزات. إذا كنت تستخدم إصداراً تجريبياً سابقاً، اتبع هذا الدليل للترحيل.

---

## المتطلبات المسبقة

### البرمجيات المطلوبة

| البرنامج | الحد الأدنى | الموصى به |
|---------|------------|-----------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |
| PostgreSQL | 14.0 | 16.x |
| Redis | 6.0 | 7.x (اختياري) |
| Docker | 24.0 | الأحدث (اختياري) |

### مفاتيح API المطلوبة

```bash
# مطلوب - مزود LLM الأساسي
GROQ_API_KEY=gsk_...

# اختياري - للتخزين المؤقت الدلالي
OPENAI_API_KEY=sk-...

# اختياري - للنشر السحابي
VERCEL_TOKEN=...
NETLIFY_TOKEN=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
CLOUDFLARE_API_TOKEN=...
```

---

## خطوات الترحيل

### الخطوة 1: النسخ الاحتياطي

```bash
# نسخ احتياطي لقاعدة البيانات
pg_dump -U postgres -d promptstudio > backup_$(date +%Y%m%d).sql

# نسخ احتياطي لملف البيئة
cp .env .env.backup

# نسخ احتياطي للملفات المخصصة
cp -r custom/ custom_backup/
```

### الخطوة 2: تحديث الكود

```bash
# سحب آخر التغييرات
git fetch origin
git checkout main
git pull origin main

# أو استنساخ المشروع من جديد
git clone <repo-url> prompt-studio-new
```

### الخطوة 3: تحديث التبعيات

```bash
# حذف node_modules القديم
rm -rf node_modules
rm package-lock.json

# تثبيت التبعيات الجديدة
npm install
```

### الخطوة 4: تحديث متغيرات البيئة

#### 4.1 إنشاء ملف .env جديد

```bash
cp .env.example .env
```

#### 4.2 المتغيرات المطلوبة

```bash
# =============================================================================
# إعدادات التطبيق الأساسية
# =============================================================================

# بيئة التشغيل
NODE_ENV=production

# المنفذ
PORT=5000

# سر JWT للتوقيع
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# سر الجلسات
SESSION_SECRET=your-session-secret-change-this-in-production

# =============================================================================
# قاعدة البيانات
# =============================================================================

# رابط PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/promptstudio

# =============================================================================
# مزودي LLM
# =============================================================================

# Groq API (مطلوب)
GROQ_API_KEY=gsk_your_groq_api_key

# OpenAI API (اختياري - للتخزين المؤقت الدلالي)
OPENAI_API_KEY=sk_your_openai_api_key

# =============================================================================
# التخزين المؤقت
# =============================================================================

# Redis (اختياري)
REDIS_URL=redis://localhost:6379

# تفعيل التخزين المؤقت
CACHE_ENABLED=true

# عتبة التشابه الدلالي (0-1)
CACHE_SIMILARITY_THRESHOLD=0.85

# =============================================================================
# الأمان
# =============================================================================

# أصول CORS المسموح بها
CORS_ORIGIN=http://localhost:3000,http://localhost:5000,https://your-domain.com
```

#### 4.3 المتغيرات الجديدة في 1.0.0

| المتغير | القيمة الافتراضية | الوصف |
|---------|------------------|-------|
| `CACHE_ENABLED` | `true` | تفعيل التخزين المؤقت الدلالي |
| `CACHE_SIMILARITY_THRESHOLD` | `0.85` | عتبة التشابه للتخزين المؤقت |
| `CACHE_CLEANUP_INTERVAL_MINUTES` | `60` | فترة التنظيف التلقائي |
| `WEBSOCKET_ENABLED` | `true` | تفعيل التعاون الحي |
| `SDK_GENERATION_ENABLED` | `true` | تفعيل توليد SDK |

### الخطوة 5: ترحيل قاعدة البيانات

#### 5.1 تطبيق التغييرات الجديدة

```bash
# تطبيق migrations
npm run db:push

# أو باستخدام Drizzle Kit مباشرة
npx drizzle-kit push
```

#### 5.2 الجداول الجديدة في 1.0.0

```sql
-- جدول التخزين المؤقت الدلالي
CREATE TABLE semantic_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  prompt_hash VARCHAR(64) NOT NULL,
  embedding JSONB,
  response TEXT NOT NULL,
  model VARCHAR(100),
  hit_count INTEGER DEFAULT 0,
  tokens_saved INTEGER DEFAULT 0,
  tags TEXT[],
  user_id VARCHAR(100),
  expires_at TIMESTAMP,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول إحصائيات التخزين المؤقت
CREATE TABLE cache_statistics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_hits INTEGER DEFAULT 0,
  total_misses INTEGER DEFAULT 0,
  tokens_saved BIGINT DEFAULT 0,
  cost_saved DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول جلسات التعاون
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id),
  name VARCHAR(255),
  created_by VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5.3 التغييرات على الجداول الموجودة

```sql
-- إضافة أعمدة جديدة لجدول prompts
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false;

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_semantic_cache_hash ON semantic_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_expires ON semantic_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_statistics_date ON cache_statistics(date);
```

### الخطوة 6: تحديث Docker (إن وجد)

#### 6.1 تحديث docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/promptstudio
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=promptstudio
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
```

#### 6.2 إعادة بناء الحاويات

```bash
# إيقاف الحاويات القديمة
docker-compose down

# إعادة البناء
docker-compose build --no-cache

# التشغيل
docker-compose up -d
```

### الخطوة 7: التحقق من الترحيل

```bash
# تشغيل الاختبارات
npm test

# التحقق من صحة الخادم
curl http://localhost:5000/api/health

# التحقق من APIs
curl http://localhost:5000/api/templates
curl http://localhost:5000/api/sdk/languages
curl http://localhost:5000/api/cache/analytics
```

---

## تغييرات API (Breaking Changes)

### APIs المتغيرة

#### 1. نقاط نهاية الوكلاء

**قبل:**
```
POST /api/compose
```

**بعد:**
```
POST /api/agents/compose
```

#### 2. نقاط نهاية التشغيل

**قبل:**
```
POST /api/run
```

**بعد:**
```
POST /api/ai/run
```

#### 3. هيكل الاستجابة

**قبل:**
```json
{
  "result": "...",
  "error": null
}
```

**بعد:**
```json
{
  "success": true,
  "data": {
    "result": "..."
  },
  "error": null,
  "timestamp": "2025-12-22T00:00:00Z"
}
```

### APIs الجديدة

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/api/cache/lookup` | POST | البحث في التخزين المؤقت |
| `/api/cache/store` | POST | حفظ في التخزين المؤقت |
| `/api/cache/analytics` | GET | إحصائيات التخزين |
| `/api/sdk/generate` | POST | توليد SDK |
| `/api/sdk/languages` | GET | اللغات المدعومة |
| `/api/collaboration/sessions` | GET/POST | إدارة جلسات التعاون |
| `/api/deploy` | POST | نشر سحابي |

---

## ترحيل الكود

### تحديث استيرادات العميل

**قبل:**
```typescript
import { apiClient } from './api';
```

**بعد:**
```typescript
import { apiClient } from '@/lib/api';
```

### تحديث استخدام الـ Hooks

**قبل:**
```typescript
const { data } = useQuery(['templates'], fetchTemplates);
```

**بعد:**
```typescript
const { data } = useQuery({
  queryKey: ['templates'],
  queryFn: fetchTemplates
});
```

### تحديث مكونات التعاون

```typescript
// استيراد جديد
import {
  CollaborationProvider,
  useCollaboration,
  CollaborationIndicator
} from '@/components/collaboration';

// استخدام
function Editor() {
  return (
    <CollaborationProvider roomId="room-1" userName="User">
      <CollaborationIndicator />
      <YourEditorComponent />
    </CollaborationProvider>
  );
}
```

---

## استكشاف الأخطاء

### مشاكل شائعة

#### 1. خطأ في الاتصال بقاعدة البيانات

```
Error: Connection refused to PostgreSQL
```

**الحل:**
```bash
# التأكد من تشغيل PostgreSQL
sudo systemctl start postgresql

# التحقق من رابط الاتصال
echo $DATABASE_URL
```

#### 2. خطأ في التبعيات

```
Error: Cannot find module 'xyz'
```

**الحل:**
```bash
# إعادة تثبيت التبعيات
rm -rf node_modules
npm install
```

#### 3. خطأ في الـ Migrations

```
Error: Relation "xyz" already exists
```

**الحل:**
```bash
# إعادة تعيين قاعدة البيانات (تحذير: يحذف البيانات)
npm run db:drop
npm run db:push

# أو تطبيق migrations يدوياً
npx drizzle-kit generate
npx drizzle-kit push
```

#### 4. خطأ في WebSocket

```
Error: WebSocket connection failed
```

**الحل:**
```bash
# التأكد من فتح المنفذ
sudo ufw allow 5000

# التأكد من إعدادات CORS
# في .env
CORS_ORIGIN=http://localhost:3000,http://localhost:5000
```

#### 5. خطأ في التخزين المؤقت الدلالي

```
Error: OpenAI API key is invalid
```

**الحل:**
```bash
# التخزين المؤقت يعمل بدون OpenAI (يستخدم Fallback)
# لكن للحصول على أفضل نتائج، أضف مفتاح صالح
OPENAI_API_KEY=sk_your_key_here
```

---

## التراجع (Rollback)

إذا واجهت مشاكل، يمكنك التراجع:

```bash
# استعادة الكود القديم
git checkout <previous-commit>

# استعادة قاعدة البيانات
psql -U postgres -d promptstudio < backup_YYYYMMDD.sql

# استعادة متغيرات البيئة
cp .env.backup .env

# إعادة تثبيت التبعيات القديمة
npm install
```

---

## الدعم والمساعدة

### الموارد

- [CHANGELOG.md](CHANGELOG.md) - سجل التغييرات الكامل
- [docs/](docs/) - الوثائق التفصيلية
- [examples/](examples/) - أمثلة الاستخدام

### الإبلاغ عن المشاكل

إذا واجهت مشاكل أثناء الترحيل:

1. تحقق من [المشاكل الشائعة](#استكشاف-الأخطاء)
2. راجع [CHANGELOG.md](CHANGELOG.md) للتغييرات
3. افتح Issue في GitHub مع:
   - وصف المشكلة
   - رسالة الخطأ
   - خطوات إعادة الإنتاج
   - بيئة التشغيل

---

## قائمة التحقق النهائية

- [ ] نسخ احتياطي لقاعدة البيانات
- [ ] نسخ احتياطي لملف .env
- [ ] تحديث الكود من Git
- [ ] تثبيت التبعيات الجديدة
- [ ] تحديث متغيرات البيئة
- [ ] تطبيق migrations قاعدة البيانات
- [ ] تحديث Docker (إن وجد)
- [ ] تشغيل الاختبارات
- [ ] التحقق من APIs
- [ ] اختبار التعاون الحي
- [ ] اختبار التخزين المؤقت
- [ ] اختبار توليد SDK

---

**تاريخ التحديث**: 2025-12-22
**الإصدار**: 1.0.0
