# مخطط قاعدة البيانات - Prompt Studio 4

> **قاعدة البيانات**: PostgreSQL 14+
> **ORM**: Drizzle ORM
> **ملف المخطط**: `/shared/schema.ts`

---

## نظرة عامة

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Entity Relationship Diagram                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   ┌──────────┐       ┌──────────┐       ┌─────────────────────┐                    │
│   │ tenants  │──────<│  users   │──────<│ collaboration       │                    │
│   └──────────┘       └──────────┘       │ _sessions           │                    │
│        │                  │              └─────────────────────┘                    │
│        │                  │                       │                                 │
│        │                  │              ┌────────┴────────┐                        │
│        │                  │              │                 │                        │
│   ┌────┴─────┐      ┌────┴─────┐   ┌────┴──────┐   ┌──────┴───────┐                │
│   │ prompts  │      │ semantic │   │ session   │   │ edit_history │                │
│   └──────────┘      │ _cache   │   │ _members  │   └──────────────┘                │
│        │            └──────────┘   └───────────┘                                   │
│        │                 │                                                          │
│   ┌────┴─────────┐  ┌────┴────┐                                                    │
│   │ prompt       │  │ cache   │                                                    │
│   │ _versions    │  │ _tags   │                                                    │
│   └──────────────┘  └─────────┘                                                    │
│        │                                                                            │
│   ┌────┴────┐                                                                       │
│   │  runs   │──────<┌──────────────┐                                               │
│   └─────────┘       │ run_ratings  │                                               │
│                     └──────────────┘                                               │
│                                                                                     │
│   ┌────────────┐       ┌────────────────────┐                                      │
│   │ templates  │       │ agent_compose_runs │                                      │
│   └────────────┘       └────────────────────┘                                      │
│                                 │                                                   │
│   ┌────────────┐       ┌───────┴────────────┐                                      │
│   │ techniques │       │ agent_compose      │                                      │
│   └────────────┘       │ _results           │                                      │
│                        └────────────────────┘                                      │
│                                                                                     │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────┐                      │
│   │ cache_config    │   │ cache_statistics │   │ marketplace │                      │
│   └─────────────────┘   └─────────────────┘   │ _prompts    │                      │
│                                                └─────────────┘                      │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## الجداول الأساسية (Core Tables)

### 1. templates

قوالب الـ Prompts الجاهزة للاستخدام.

```sql
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  sections JSONB NOT NULL,
  default_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**أنواع البيانات المخصصة:**

```typescript
// sections
{
  system: string;      // System prompt
  developer: string;   // Developer instructions
  user: string;        // User message template
  context: string;     // Additional context
}

// default_variables
Array<{
  id: string;
  name: string;
  value: string;
}>
```

**الفهارس المقترحة:**
```sql
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
```

---

### 2. techniques

تقنيات هندسة الـ Prompts وأفضل الممارسات.

```sql
CREATE TABLE techniques (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  good_example TEXT NOT NULL,
  bad_example TEXT NOT NULL,
  common_mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
  snippet TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**أنواع البيانات:**
```typescript
// common_mistakes
string[]  // Array of mistake descriptions
```

---

### 3. runs

سجل تنفيذ الـ Prompts.

```sql
CREATE TABLE runs (
  id SERIAL PRIMARY KEY,
  prompt_version_id TEXT REFERENCES prompt_versions(id) ON DELETE SET NULL,
  sections JSONB NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT NOT NULL,
  temperature INTEGER NOT NULL,  -- Stored as integer (× 100)
  max_tokens INTEGER,
  output TEXT NOT NULL,
  latency INTEGER,               -- Milliseconds
  token_usage JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**أنواع البيانات:**
```typescript
// sections
{
  system: string;
  developer: string;
  user: string;
  context: string;
}

// variables
Array<{ id: string; name: string; value: string }>

// token_usage
{
  prompt: number;
  completion: number;
  total: number;
}
```

**الفهارس:**
```sql
CREATE INDEX idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX idx_runs_model ON runs(model);
CREATE INDEX idx_runs_prompt_version ON runs(prompt_version_id);
```

---

### 4. run_ratings

تقييمات وملاحظات على التشغيلات.

```sql
CREATE TABLE run_ratings (
  id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  rating INTEGER,                    -- 1-5
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**القيود:**
```sql
ALTER TABLE run_ratings ADD CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5);
```

---

## جداول Multi-Tenancy

### 5. tenants

المستأجرون/المؤسسات.

```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  api_key TEXT UNIQUE NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**أنواع البيانات:**
```typescript
// config
{
  maxUsers?: number;
  features?: string[];
  theme?: {
    primaryColor: string;
    logo: string;
  };
  quotas?: {
    runsPerDay: number;
    cacheSize: number;
  };
}
```

---

### 6. users

المستخدمون.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- UUID
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  color TEXT DEFAULT '#3B82F6',
  tenant_id TEXT REFERENCES tenants(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**الفهارس:**
```sql
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

---

## جداول Prompts المتقدمة

### 7. prompts

الـ Prompts مع دعم الإصدارات والملكية.

```sql
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL,
  description TEXT,
  tenant_id TEXT REFERENCES tenants(id),
  owner_id TEXT REFERENCES users(id),
  active_version_id TEXT,           -- Points to active prompt_version
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**الفهارس:**
```sql
CREATE INDEX idx_prompts_tenant ON prompts(tenant_id);
CREATE INDEX idx_prompts_owner ON prompts(owner_id);
```

---

### 8. prompt_versions

إصدارات الـ Prompts.

```sql
CREATE TABLE prompt_versions (
  id TEXT PRIMARY KEY,              -- UUID
  prompt_id TEXT REFERENCES prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT,                     -- Simple text content
  sections JSONB,                   -- Structured content
  variables JSONB DEFAULT '[]'::jsonb,
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**أنواع البيانات:**
```typescript
// sections
{
  system: string;
  developer: string;
  user: string;
  context: string;
}

// variables
Array<{ id: string; name: string; value: string }>

// performance_metrics
{
  avgLatency?: number;
  avgTokens?: number;
  successRate?: number;
  runCount?: number;
}
```

**الفهارس:**
```sql
CREATE INDEX idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE UNIQUE INDEX idx_prompt_versions_unique ON prompt_versions(prompt_id, version);
```

---

## جداول التعاون (Collaboration)

### 9. collaboration_sessions

جلسات التعاون الفوري.

```sql
CREATE TABLE collaboration_sessions (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL,
  description TEXT,
  content TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  share_token TEXT UNIQUE NOT NULL,
  tenant_id TEXT REFERENCES tenants(id),
  owner_id TEXT REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**الفهارس:**
```sql
CREATE INDEX idx_sessions_tenant ON collaboration_sessions(tenant_id);
CREATE INDEX idx_sessions_owner ON collaboration_sessions(owner_id);
CREATE INDEX idx_sessions_share_token ON collaboration_sessions(share_token);
CREATE INDEX idx_sessions_active ON collaboration_sessions(is_active) WHERE is_active = TRUE;
```

---

### 10. session_members

أعضاء جلسات التعاون.

```sql
CREATE TABLE session_members (
  id TEXT PRIMARY KEY,              -- UUID
  user_id TEXT NOT NULL REFERENCES users(id),
  session_id TEXT NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'VIEWER',       -- OWNER, EDITOR, VIEWER
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_seen_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**القيود:**
```sql
ALTER TABLE session_members ADD CONSTRAINT valid_role
  CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER'));
CREATE UNIQUE INDEX idx_session_members_unique ON session_members(user_id, session_id);
```

---

### 11. edit_history

تاريخ التعديلات للجلسات.

```sql
CREATE TABLE edit_history (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  operation JSONB NOT NULL,
  content_before TEXT,
  content_after TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**أنواع البيانات:**
```typescript
// operation
{
  type: 'insert' | 'delete' | 'replace';
  position: number;
  length?: number;
  content?: string;
  origin?: string;  // 'user' | 'undo' | 'redo' | 'sync'
}
```

**الفهارس:**
```sql
CREATE INDEX idx_edit_history_session ON edit_history(session_id);
CREATE INDEX idx_edit_history_user ON edit_history(user_id);
CREATE INDEX idx_edit_history_created ON edit_history(created_at DESC);
```

---

## جداول Semantic Cache

### 12. semantic_cache

التخزين المؤقت الدلالي للاستجابات.

```sql
CREATE TABLE semantic_cache (
  id TEXT PRIMARY KEY,              -- UUID
  prompt TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  embedding JSONB NOT NULL,         -- Vector as JSON array
  response TEXT NOT NULL,
  model TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0,
  tokens_saved INTEGER DEFAULT 0,
  user_id TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
```

**الفهارس:**
```sql
CREATE INDEX idx_cache_prompt_hash ON semantic_cache(prompt_hash);
CREATE INDEX idx_cache_model ON semantic_cache(model);
CREATE INDEX idx_cache_expires ON semantic_cache(expires_at);
CREATE INDEX idx_cache_user ON semantic_cache(user_id);
```

---

### 13. cache_tags

وسوم التخزين المؤقت للتنظيم والبحث.

```sql
CREATE TABLE cache_tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cache_id TEXT NOT NULL REFERENCES semantic_cache(id) ON DELETE CASCADE
);
```

**الفهارس:**
```sql
CREATE INDEX idx_cache_tags_name ON cache_tags(name);
CREATE INDEX idx_cache_tags_cache ON cache_tags(cache_id);
```

---

### 14. cache_statistics

إحصائيات التخزين المؤقت اليومية.

```sql
CREATE TABLE cache_statistics (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP NOT NULL UNIQUE,
  total_hits INTEGER DEFAULT 0 NOT NULL,
  total_misses INTEGER DEFAULT 0 NOT NULL,
  tokens_saved INTEGER DEFAULT 0 NOT NULL,
  cost_saved DOUBLE PRECISION DEFAULT 0 NOT NULL
);
```

**الفهارس:**
```sql
CREATE INDEX idx_cache_stats_date ON cache_statistics(date DESC);
```

---

### 15. cache_config

تكوينات التخزين المؤقت.

```sql
CREATE TABLE cache_config (
  id SERIAL PRIMARY KEY,
  enabled BOOLEAN DEFAULT TRUE NOT NULL,
  similarity_threshold DOUBLE PRECISION DEFAULT 0.85 NOT NULL,
  default_ttl_seconds INTEGER DEFAULT 3600 NOT NULL,
  max_cache_size INTEGER DEFAULT 1000 NOT NULL,
  invalidation_rules JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**أنواع البيانات:**
```typescript
// invalidation_rules
Array<{
  type: 'tag' | 'pattern' | 'time' | 'count';
  value: string | number;
  action: 'delete' | 'refresh';
}>
```

---

## جداول Marketplace

### 16. marketplace_prompts

سوق الـ Prompts للمشاركة والاكتشاف.

```sql
CREATE TABLE marketplace_prompts (
  id TEXT PRIMARY KEY,              -- UUID
  author_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',    -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**القيود:**
```sql
ALTER TABLE marketplace_prompts ADD CONSTRAINT valid_status
  CHECK (status IN ('pending', 'approved', 'rejected'));
```

**الفهارس:**
```sql
CREATE INDEX idx_marketplace_author ON marketplace_prompts(author_id);
CREATE INDEX idx_marketplace_category ON marketplace_prompts(category);
CREATE INDEX idx_marketplace_status ON marketplace_prompts(status);
CREATE INDEX idx_marketplace_featured ON marketplace_prompts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_marketplace_tags ON marketplace_prompts USING GIN(tags);
```

---

## جداول Agent Compose

### 17. agent_compose_runs

تشغيلات نظام الوكلاء الثلاثي.

```sql
CREATE TABLE agent_compose_runs (
  id SERIAL PRIMARY KEY,
  status TEXT DEFAULT 'pending' NOT NULL,    -- pending, running, completed, failed
  stage TEXT DEFAULT 'agent1' NOT NULL,      -- agent1, agent2, agent3, done
  progress INTEGER DEFAULT 0 NOT NULL,       -- 0-100
  input_raw TEXT NOT NULL,
  input_goal TEXT,
  input_constraints TEXT,
  input_output_format TEXT,
  model_config JSONB NOT NULL,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  finished_at TIMESTAMP
);
```

**أنواع البيانات:**
```typescript
// model_config
{
  model: string;
  temperature: number;
  maxTokens?: number;
}
```

**القيود:**
```sql
ALTER TABLE agent_compose_runs ADD CONSTRAINT valid_status
  CHECK (status IN ('pending', 'running', 'completed', 'failed'));
ALTER TABLE agent_compose_runs ADD CONSTRAINT valid_stage
  CHECK (stage IN ('agent1', 'agent2', 'agent3', 'done'));
ALTER TABLE agent_compose_runs ADD CONSTRAINT valid_progress
  CHECK (progress >= 0 AND progress <= 100);
```

---

### 18. agent_compose_results

نتائج نظام الوكلاء الثلاثي.

```sql
CREATE TABLE agent_compose_results (
  id SERIAL PRIMARY KEY,
  run_id INTEGER NOT NULL UNIQUE REFERENCES agent_compose_runs(id) ON DELETE CASCADE,
  agent1_json JSONB,
  agent2_json JSONB,
  agent3_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**أنواع البيانات:**
```typescript
// agent1_json - Converter Agent Output
{
  system: string;
  developer: string;
  user: string;
  context: string;
  variables: Array<{ id: string; name: string; value: string }>;
  modelHints?: string;
}

// agent2_json - Critic Agent Output
{
  criticisms: string[];
  alternativePrompt: {
    system: string;
    developer: string;
    user: string;
    context: string;
  };
  fixes: string[];
}

// agent3_json - Judge Agent Output
{
  finalPrompt: {
    system: string;
    developer: string;
    user: string;
    context: string;
  };
  finalVariables: Array<{ id: string; name: string; value: string }>;
  decisionNotes: string[];
}
```

---

## جدول الجلسات (Sessions)

### session

جدول تخزين الجلسات (يُنشأ تلقائياً بواسطة connect-pg-simple).

```sql
CREATE TABLE "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  PRIMARY KEY ("sid")
);

CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

---

## Migrations

### تشغيل الترحيلات

```bash
# إنشاء ترحيل جديد
npm run db:generate

# تطبيق الترحيلات
npm run db:push

# بذر البيانات الأولية
npm run db:seed
```

### ملفات الترحيل

```
migrations/
├── 0001_initial.sql
├── 0002_add_tenants.sql
├── 0003_add_collaboration.sql
├── 0004_add_semantic_cache.sql
├── 0005_add_marketplace.sql
└── 0006_add_agent_compose.sql
```

---

## استعلامات شائعة

### البحث في القوالب
```sql
SELECT * FROM templates
WHERE LOWER(name) LIKE LOWER('%search%')
   OR LOWER(description) LIKE LOWER('%search%')
ORDER BY created_at DESC;
```

### الحصول على إحصائيات Cache
```sql
SELECT
  SUM(total_hits) as hits,
  SUM(total_misses) as misses,
  SUM(tokens_saved) as tokens,
  SUM(cost_saved) as cost
FROM cache_statistics
WHERE date >= NOW() - INTERVAL '7 days';
```

### تنظيف Cache المنتهي
```sql
DELETE FROM semantic_cache
WHERE expires_at < NOW();
```

### الحصول على جلسات التعاون النشطة
```sql
SELECT cs.*, COUNT(sm.id) as member_count
FROM collaboration_sessions cs
LEFT JOIN session_members sm ON sm.session_id = cs.id
WHERE cs.is_active = TRUE
GROUP BY cs.id
ORDER BY cs.updated_at DESC;
```

### إحصائيات استخدام النماذج
```sql
SELECT
  model,
  COUNT(*) as run_count,
  AVG(latency) as avg_latency,
  SUM((token_usage->>'total')::int) as total_tokens
FROM runs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY model
ORDER BY run_count DESC;
```

---

## النسخ الاحتياطي

### نسخ احتياطي كامل
```bash
pg_dump -h localhost -U postgres -d promptstudio -F c -f backup.dump
```

### استعادة
```bash
pg_restore -h localhost -U postgres -d promptstudio -c backup.dump
```

### نسخ احتياطي للجداول الهامة فقط
```bash
pg_dump -h localhost -U postgres -d promptstudio \
  -t templates -t techniques -t runs \
  -F c -f core_backup.dump
```

---

## الأمان

### صلاحيات المستخدم
```sql
-- إنشاء مستخدم للتطبيق
CREATE USER promptstudio_app WITH PASSWORD 'secure_password';

-- منح الصلاحيات
GRANT CONNECT ON DATABASE promptstudio TO promptstudio_app;
GRANT USAGE ON SCHEMA public TO promptstudio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO promptstudio_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO promptstudio_app;
```

### Row Level Security (اختياري)
```sql
-- تفعيل RLS للجداول متعددة المستأجرين
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON prompts
  USING (tenant_id = current_setting('app.tenant_id')::text);
```

---

## المراقبة

### استعلامات المراقبة
```sql
-- حجم الجداول
SELECT
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- الاتصالات النشطة
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- الاستعلامات البطيئة
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## المراجع

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
