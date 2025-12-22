# SDK Generator

نظام توليد SDK متكامل لـ PromptStudio يدعم 5 لغات برمجية.

## اللغات المدعومة

- **TypeScript** - SDK كامل مع Types
- **Python** - مع Dataclasses و Type Hints
- **JavaScript/Node.js** - SDK متوافق
- **Go** - SDK مع Structs
- **cURL/Bash** - أوامر Shell

## الاستخدام السريع

```typescript
import { SDKGenerator } from './advanced-index';

// توليد SDK لـ TypeScript
const sdk = SDKGenerator.generate({
  promptConfig: {
    id: 'my-prompt',
    name: 'My Prompt',
    description: 'Description',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    stopSequences: [],
    variables: [
      {
        name: 'input',
        type: 'string',
        description: 'Input text',
        required: true,
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  language: 'typescript',
  options: {
    includeRetryLogic: true,
    includeErrorHandling: true,
  }
});

console.log(sdk.code);
console.log(sdk.dependencies);
```

## توليد حزمة كاملة

```typescript
const package = SDKGenerator.generatePackage({
  promptConfig: myConfig,
  language: 'python',
});

console.log(package.sdk.code);        // الكود
console.log(package.readme);          // README
console.log(package.packageInfo);     // معلومات الحزمة
console.log(package.examples);        // أمثلة
```

## توليد جميع اللغات

```typescript
const packages = SDKGenerator.generateAll(promptConfig);

packages.forEach((pkg, language) => {
  console.log(`${language}: ${pkg.sdk.filename}`);
  // حفظ الملفات
});
```

## الخيارات

```typescript
interface SDKGenerationOptions {
  language: 'typescript' | 'python' | 'javascript' | 'go' | 'curl';
  asyncMode: boolean;              // دعم async/await
  includeRetryLogic: boolean;      // إعادة المحاولة
  includeErrorHandling: boolean;   // معالجة الأخطاء
  functionName: string;            // اسم الدالة
  className: string;               // اسم الكلاس
  includeTypes: boolean;           // Types/Interfaces
  includeDocstrings: boolean;      // التوثيق
  retryAttempts: number;           // عدد المحاولات
  retryDelay: number;              // التأخير (ms)
  timeout: number;                 // Timeout (ms)
}
```

## الميزات

### ✅ معالجة الأخطاء
جميع SDKs تتضمن معالجة أخطاء شاملة:

```typescript
try {
  const result = await client.execute(input);
} catch (error) {
  if (error instanceof PromptStudioError) {
    console.error(`[${error.code}] ${error.message}`);
  }
}
```

### ✅ Retry Logic
إعادة محاولة تلقائية مع exponential backoff:

```typescript
// يتم تكوينها تلقائياً
// 3 محاولات بشكل افتراضي
// تأخير متزايد: 1s, 2s, 4s
```

### ✅ Streaming
دعم Streaming API:

```typescript
await client.executeStream(input, (chunk) => {
  process.stdout.write(chunk);
});
```

### ✅ Validation
التحقق التلقائي من المدخلات:

```typescript
// يتحقق من المعاملات المطلوبة
// يتحقق من الأنواع
// يرمي أخطاء validation واضحة
```

## هيكل الملفات

```
sdk-generator/
├── types.ts                          # الأنواع الأساسية
├── template-util.ts                  # أدوات القوالب
├── advanced-typescript-generator.ts  # TypeScript
├── advanced-python-generator.ts      # Python
├── javascript-generator.ts           # JavaScript
├── go-generator.ts                   # Go
├── curl-generator.ts                 # cURL/Bash
├── advanced-index.ts                 # النظام الرئيسي
└── __tests__/
    └── sdk-generator.test.ts         # الاختبارات
```

## الاختبارات

```bash
npm test -- server/lib/sdk-generator/__tests__/sdk-generator.test.ts
```

الاختبارات تغطي:
- Consistency - نفس المدخلات = نفس المخرجات
- Completeness - جميع العناصر المطلوبة موجودة
- Syntactic Validity - الكود صحيح نحوياً
- Configuration Compatibility - يعمل مع جميع التكوينات
- Package Generation - توليد حزم كاملة
- Feature Toggles - الخيارات تعمل بشكل صحيح
- Idempotence - تكرار التوليد = نفس النتيجة
- Dependencies - القائمة صحيحة

## API Endpoints

راجع [server/routes/sdk.ts](../../routes/sdk.ts):

- `POST /api/sdk/generate` - توليد SDK
- `POST /api/sdk/generate-package` - حزمة كاملة
- `POST /api/sdk/generate-all` - جميع اللغات
- `GET /api/sdk/languages` - اللغات المدعومة
- `POST /api/sdk/download` - تحميل ملف

## إضافة لغة جديدة

1. أنشئ ملف generator جديد (مثل `ruby-generator.ts`)
2. نفذ دالة `generateRubySDK(config, options): GeneratedSDK`
3. أضف اللغة إلى `SupportedLanguage` في `advanced-index.ts`
4. أضف الحالة في `SDKGenerator.generate()`
5. أضف اختبارات في `__tests__/sdk-generator.test.ts`

## الوثائق

- [EPIC9 Summary](../../../EPIC9-SUMMARY.md)
- [Epic 9 Documentation](../../../docs/EPIC9-SDK-GENERATION.md)
- [Tests](../__tests__/sdk-generator.test.ts)

## المساهمة

عند إضافة ميزات جديدة:

1. أضف الاختبارات أولاً
2. نفذ الميزة
3. تأكد من نجاح جميع الاختبارات
4. حدث الوثائق

## الترخيص

MIT License
