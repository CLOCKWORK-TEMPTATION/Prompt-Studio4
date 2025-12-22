# دليل اختبارات التخزين المؤقت الدلالي

## نظرة عامة

هذا الدليل يوضح كيفية تشغيل واستخدام اختبارات Property-Based للتخزين المؤقت الدلالي.

## تشغيل الاختبارات

### جميع الاختبارات
```bash
npm test
```

### اختبارات التخزين المؤقت فقط
```bash
npm test server/__tests__/semantic-cache.test.ts
```

### اختبارات مع تغطية الكود
```bash
npm run test:coverage
```

### وضع المراقبة
```bash
npm run test:watch
```

## بنية الاختبارات

### 1. اختبارات الخاصية (Property Tests)

#### الخاصية 1-5: خوارزمية التشابه الدلالي
- **التماثل**: `sim(A, B) = sim(B, A)`
- **التطابق الذاتي**: `sim(A, A) = 1`
- **النطاق**: `-1 ≤ sim ≤ 1`
- **المتجهات المتعامدة**: `sim = 0`
- **المتجهات المتعاكسة**: `sim = -1`

```typescript
// مثال على اختبار التماثل
it('يجب أن يكون التشابه متماثلاً', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.float({ min: -1, max: 1 })),
      fc.array(fc.float({ min: -1, max: 1 })),
      async (vec1, vec2) => {
        const sim1 = cosineSimilarity(vec1, vec2);
        const sim2 = cosineSimilarity(vec2, vec1);
        expect(Math.abs(sim1 - sim2)).toBeLessThan(0.0001);
      }
    )
  );
});
```

#### الخاصية 6-8: تخزين الهاش
- **الحتمية**: نفس النص → نفس الهاش
- **عدم التصادم**: نصوص مختلفة → هاشات مختلفة
- **التطبيع**: حالات أحرف ومسافات مختلفة → نفس الهاش

#### الخاصية 9-10: إنتاج Embeddings
- **ثبات الطول**: جميع المتجهات بطول 1536
- **الحتمية**: نفس النص → نفس embedding

#### الخاصية 11-12: التكوين والإعدادات
- قيم افتراضية معقولة
- تحديث صحيح للتكوين

#### الخاصية 13-15: سيناريوهات متكاملة
- استرجاع بعد التخزين
- البحث الدلالي عن نصوص متشابهة
- عدم التطابق مع نصوص مختلفة

#### الخاصية 16-18: الأداء والحدود
- معالجة النصوص الطويلة
- معالجة النصوص الفارغة
- معالجة الأحرف الخاصة

#### الخاصية 19-20: التنظيف
- انتهاء الصلاحية
- الإبطال الشامل

### 2. اختبارات الانحدار (Regression Tests)

هذه الاختبارات تمنع عودة أخطاء معروفة:

```typescript
it('يجب ألا يفشل مع متجهات فارغة', () => {
  const vec1 = [];
  const vec2 = [];
  const similarity = cosineSimilarity(vec1, vec2);
  expect(similarity).toBe(0);
});
```

## متطلبات الاختبار

### متغيرات البيئة

```bash
# للاختبار مع OpenAI API الحقيقي
OPENAI_API_KEY=sk-...

# للاختبار بدون OpenAI (استخدام fallback)
# لا تحتاج لتعيين المفتاح
```

### قاعدة البيانات

الاختبارات تتطلب قاعدة بيانات PostgreSQL:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/test_db
```

## معدلات النجاح المتوقعة

### اختبارات الخاصية
- **numRuns**: 50-100 (عدد الحالات العشوائية لكل اختبار)
- **معدل النجاح المتوقع**: 100%

### اختبارات الانحدار
- **معدل النجاح المتوقع**: 100%

## الأخطاء الشائعة وحلولها

### 1. فشل الاتصال بقاعدة البيانات
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**الحل**: تأكد من تشغيل PostgreSQL وصحة DATABASE_URL

### 2. فشل OpenAI API
```
Error: OPENAI_SERVER_ERROR
```
**الحل**: الاختبارات يجب أن تستخدم fallback تلقائياً، إذا استمر الخطأ تحقق من الشبكة

### 3. نفاد الذاكرة
```
JavaScript heap out of memory
```
**الحل**: قلل numRuns في الاختبارات أو زد حد الذاكرة:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

## إضافة اختبارات جديدة

### نموذج اختبار خاصية جديد

```typescript
it('وصف الخاصية', async () => {
  await fc.assert(
    fc.asyncProperty(
      // مولدات البيانات العشوائية
      fc.string({ minLength: 1, maxLength: 100 }),
      fc.integer({ min: 0, max: 1000 }),
      
      // دالة الاختبار
      async (randomString, randomNumber) => {
        // تنفيذ الاختبار
        const result = await someFunction(randomString, randomNumber);
        
        // التحقق من الخاصية
        expect(result).toSatisfy(someCondition);
      }
    ),
    { 
      numRuns: 50,        // عدد الحالات العشوائية
      timeout: 30000      // الوقت الأقصى (ms)
    }
  );
});
```

## تقرير التغطية

بعد تشغيل `npm run test:coverage`، ستجد التقرير في:

```
coverage/
  lcov-report/
    index.html    # افتح هذا الملف في المتصفح
```

### الأهداف المتوقعة للتغطية

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## المساهمة

عند إضافة ميزات جديدة:

1. أضف اختبارات خاصية للخوارزميات الرياضية
2. أضف اختبارات انحدار للأخطاء المكتشفة
3. تأكد من تحديث التوثيق
4. تأكد من نجاح جميع الاختبارات قبل الـ commit

## الموارد الإضافية

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Jest Documentation](https://jestjs.io/)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)

---

**آخر تحديث**: ديسمبر 2025

