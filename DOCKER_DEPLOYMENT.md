# دليل النشر باستخدام Docker

هذا الدليل يوضح كيفية نشر Prompt Studio باستخدام Docker و Docker Compose.

## المتطلبات الأساسية

- Docker Engine 20.10 أو أحدث
- Docker Compose 2.0 أو أحدث
- Node.js 18+ (للتطوير المحلي فقط)

## البنية العامة

```
prompt-studio/
├── Dockerfile                    # تعريف صورة التطبيق
├── docker-compose.yml           # التكوين الأساسي
├── docker-compose.override.yml  # إعدادات التطوير
├── docker-compose.prod.yml      # إعدادات الإنتاج
├── docker-compose.test.yml      # إعدادات الاختبار
├── init-db.sql                  # تهيئة قاعدة البيانات
└── .env.example.new            # مثال على متغيرات البيئة
```

## التثبيت والتشغيل

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd prompt-studio
```

### 2. إعداد متغيرات البيئة

```bash
# نسخ ملف البيئة النموذجي
cp .env.example.new .env

# تعديل المتغيرات حسب البيئة
nano .env
```

### 3. تشغيل في بيئة التطوير

```bash
# تشغيل جميع الخدمات
docker-compose up -d

# متابعة السجلات
docker-compose logs -f app

# إيقاف الخدمات
docker-compose down
```

### 4. الوصول للتطبيق

- **التطبيق**: http://localhost:5000
- **PgAdmin**: http://localhost:8080 (لإدارة قاعدة البيانات)
- **Redis Commander**: http://localhost:8081 (لإدارة Redis)

## بيئات النشر المختلفة

### بيئة التطوير

```bash
# تشغيل مع إعدادات التطوير (يتم تلقائياً)
docker-compose up -d

# أو تحديد الملفات صراحة
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

### بيئة الإنتاج

```bash
# تشغيل مع إعدادات الإنتاج
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# أو مع Nginx reverse proxy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile with-nginx up -d
```

### بيئة الاختبار

```bash
# تشغيل الاختبارات
docker-compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit

# تشغيل اختبارات محددة
docker-compose -f docker-compose.yml -f docker-compose.test.yml run --rm app npm run test -- --testPathPattern=integration
```

## إدارة قاعدة البيانات

### الوصول المباشر لـ PostgreSQL

```bash
# الدخول للحاوي
docker-compose exec db psql -U postgres -d promptstudio

# أو من خارج الحاوي
psql -h localhost -p 5432 -U postgres -d promptstudio
```

### إدارة Redis

```bash
# الدخول للحاوي
docker-compose exec redis redis-cli

# فحص الاتصال
docker-compose exec redis redis-cli ping
```

## إدارة السجلات والمراقبة

### متابعة السجلات

```bash
# جميع الخدمات
docker-compose logs -f

# خدمة محددة
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f redis
```

### فحص صحة الخدمات

```bash
# فحص جميع الخدمات
docker-compose ps

# فحص استخدام الموارد
docker stats

# فحص صحة التطبيق
curl http://localhost:5000/api/health
```

## النسخ الاحتياطي والاستعادة

### نسخ احتياطي لقاعدة البيانات

```bash
# نسخ احتياطي
docker-compose exec db pg_dump -U postgres promptstudio > backup_$(date +%Y%m%d_%H%M%S).sql

# نسخ احتياطي مضغوط
docker-compose exec db pg_dump -U postgres promptstudio | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### استعادة قاعدة البيانات

```bash
# إنشاء قاعدة بيانات جديدة
docker-compose exec db createdb -U postgres promptstudio_restore

# استعادة من النسخة الاحتياطية
docker-compose exec -T db psql -U postgres promptstudio_restore < backup.sql
```

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### خطأ في بناء الصورة

```bash
# تنظيف الـ cache وإعادة البناء
docker system prune -f
docker-compose build --no-cache

# فحص أخطاء البناء
docker-compose build --progress=plain
```

#### مشاكل في قاعدة البيانات

```bash
# إعادة إنشاء قاعدة البيانات
docker-compose down -v
docker-compose up -d db

# فحص سجلات قاعدة البيانات
docker-compose logs db
```

#### مشاكل في Redis

```bash
# إعادة تشغيل Redis
docker-compose restart redis

# فحص اتصال Redis
docker-compose exec redis redis-cli ping
```

#### مشاكل في التطبيق

```bash
# إعادة تشغيل التطبيق
docker-compose restart app

# الدخول للحاوي للتحقق
docker-compose exec app sh

# فحص متغيرات البيئة
docker-compose exec app env
```

### فحص استخدام الموارد

```bash
# مراقبة الموارد
docker stats

# فحص أحجام الحاويات
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# تنظيف غير المستخدم
docker system prune -f
```

## الأمان

### إعدادات الأمان الأساسية

1. **تغيير كلمات المرور الافتراضية** في ملف `.env`
2. **استخدام HTTPS** في الإنتاج مع Nginx
3. **تقييد الوصول** للمنافذ غير الضرورية
4. **تحديث الصور** بانتظام

### أوامر الأمان

```bash
# فحص الثغرات الأمنية
docker scan promptstudio_app

# تحديث الصور
docker-compose pull

# فحص الشبكات
docker network ls
docker network inspect promptstudio_default
```

## التحجيم والأداء

### تحجيم الخدمات

```bash
# تحجيم التطبيق
docker-compose up -d --scale app=3

# تحجيم قاعدة البيانات (إذا كانت تدعم الـ replication)
docker-compose up -d --scale db=2
```

### تحسين الأداء

```bash
# تخصيص موارد Redis
docker-compose up -d redis

# مراقبة الأداء
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## النشر في السحابة

### Docker Hub

```bash
# بناء ونشر الصورة
docker build -t myusername/promptstudio:latest .
docker push myusername/promptstudio:latest

# استخدام الصورة في docker-compose
services:
  app:
    image: myusername/promptstudio:latest
```

### Kubernetes

```bash
# تحويل docker-compose إلى Kubernetes
docker-compose config > docker-compose-resolved.yml
kubectl create -f docker-compose-resolved.yml
```

## الدعم والمساعدة

للمساعدة والدعم:

- **التوثيق**: https://docs.promptstudio.ai/docker
- **الدعم**: support@promptstudio.ai
- **GitHub Issues**: https://github.com/yourorg/promptstudio/issues

---

## ملاحظات مهمة

- تأكد من عمل نسخ احتياطي قبل أي تحديث كبير
- راقب استخدام الموارد بانتظام
- حدث الصور والتبعيات بانتظام لسد الثغرات الأمنية
- استخدم secrets management في الإنتاج بدلاً من متغيرات البيئة
