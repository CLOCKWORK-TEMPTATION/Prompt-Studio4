# إعداد مفاتيح API لـ Strands Agents

## الخيار الأول: Amazon Bedrock (الافتراضي - مُوصى به للبدء)

### 1. الحصول على مفتاح API من Bedrock
1. اذهب إلى [Bedrock Console](https://console.aws.amazon.com/bedrock)
2. انقر على "API keys" في القائمة الجانبية
3. انقر على "Generate long-term API key"
4. اختر مدة 30 يوم (للتطوير)
5. انسخ المفتاح واحفظه بأمان (يظهر مرة واحدة فقط)

### 2. تفعيل الوصول للنماذج (محدث)
النماذج الآن مُفعلة تلقائياً عند أول استخدام! لا تحتاج لتفعيل يدوي.
- نماذج Anthropic Claude متاحة فوراً
- للمستخدمين الجدد: قد تحتاج تقديم تفاصيل حالة الاستخدام لنماذج Anthropic
- النماذج من AWS Marketplace تحتاج تفعيل مرة واحدة من مستخدم لديه صلاحيات

### 3. إعداد متغير البيئة
بعد تحميل ملف CSV من Bedrock، افتحه وانسخ المفتاح من عمود "Secret access key"، ثم:

```bash
# في Windows Command Prompt
set AWS_BEDROCK_API_KEY=your_bedrock_api_key_here

# في Windows PowerShell
$env:AWS_BEDROCK_API_KEY="your_bedrock_api_key_here"

# أو أضف إلى ملف .env في مجلد المشروع
AWS_BEDROCK_API_KEY=your_bedrock_api_key_here
```

## خيارات أخرى (اختيارية)

### Anthropic Claude (مباشر)
```bash
# احصل على مفتاح من: https://console.anthropic.com/
pip install 'strands-agents[anthropic]'
set ANTHROPIC_API_KEY=your_anthropic_key
```

### OpenAI GPT
```bash
# احصل على مفتاح من: https://platform.openai.com/api-keys
pip install 'strands-agents[openai]'
set OPENAI_API_KEY=your_openai_key
```

### Google Gemini
```bash
# احصل على مفتاح من: https://aistudio.google.com/apikey
pip install 'strands-agents[gemini]'
set GOOGLE_API_KEY=your_google_key
```

## اختبار الإعداد

بعد إعداد أي من المفاتيح أعلاه، شغّل:
```bash
python agent_example.py
```

## أمثلة للاختبار

جرب هذه الأسئلة مع الوكيل:
- "احسب 15 * 23 + 45"
- "اكتب كود Python لحساب مضروب العدد 5"
- "اجلب بيانات من https://api.github.com/users/octocat"
- "ما هو الجذر التربيعي لـ 144؟"