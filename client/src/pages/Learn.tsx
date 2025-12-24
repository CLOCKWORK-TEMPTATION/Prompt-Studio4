import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, XCircle, Lightbulb } from "lucide-react";

export default function Learn() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">تعلم هندسة الموجهات</h1>
        <p className="text-muted-foreground text-lg">
          دليل شامل لإتقان فن كتابة الموجهات الفعّالة للذكاء الاصطناعي
        </p>
      </div>

      <Tabs defaultValue="types" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="types">أنواع الموجهات</TabsTrigger>
          <TabsTrigger value="strategies">الاستراتيجيات</TabsTrigger>
          <TabsTrigger value="examples">أمثلة عملية</TabsTrigger>
          <TabsTrigger value="bestpractices">أفضل الممارسات</TabsTrigger>
        </TabsList>

        {/* Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                أنواع الموجهات الأساسية
              </CardTitle>
              <CardDescription>
                تعرف على الأنواع المختلفة من الموجهات وكيفية استخدام كل منها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: "الموجهات المباشرة (Zero-Shot)",
                  description: "موجهات بسيطة بدون أمثلة",
                  example: "ما هي عاصمة فرنسا؟",
                  best: "للمهام البسيطة والمعروفة"
                },
                {
                  title: "الموجهات بأمثلة (Few-Shot)",
                  description: "توفير أمثلة يتعلم منها النموذج",
                  example: "مثال 1: Happy -> إيجابي\nمثال 2: Sad -> سلبي\nNeutral ->",
                  best: "لتحسين دقة المهام المعقدة"
                },
                {
                  title: "موجهات تسلسل الفكر (Chain-of-Thought)",
                  description: "طلب النموذج شرح خطواته",
                  example: "فكر خطوة بخطوة: 25 × 4 = ؟",
                  best: "للعمليات الحسابية والمنطقية"
                },
                {
                  title: "موجهات الدور (Role Prompting)",
                  description: "إعطاء النموذج دوراً محدداً",
                  example: "أنت مهندس برمجيات محترف...",
                  best: "للحصول على إجابات متخصصة"
                }
              ].map((item, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded font-mono text-sm whitespace-pre-wrap">
                      {item.example}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>متى تستخدمه:</strong> {item.best}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategies Tab */}
        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>استراتيجيات فعّالة</CardTitle>
              <CardDescription>
                تقنيات متقدمة لتحسين جودة موجهاتك
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                {
                  title: "1. الوضوح والتحديد",
                  points: [
                    "استخدم لغة واضحة وغير غامضة",
                    "حدد مخرجاتك بالضبط",
                    "تجنب المصطلحات المعقدة"
                  ]
                },
                {
                  title: "2. السياق غني",
                  points: [
                    "قدم معلومات خلفية ذات صلة",
                    "اشرح سبب طلبك",
                    "حدد الجمهور المستهدف"
                  ]
                },
                {
                  title: "3. القيود المحددة",
                  points: [
                    "حدد طول الاستجابة المتوقع",
                    "اذكر الأسلوب والنبرة",
                    "اذكر ما يجب تجنبه"
                  ]
                },
                {
                  title: "4. الأمثلة والعينات",
                  points: [
                    "قدم أمثلة على النتيجة المتوقعة",
                    "استخدم صيغة متسقة",
                    "وضح النمط المطلوب"
                  ]
                }
              ].map((strategy, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">{strategy.title}</h3>
                    <ul className="space-y-2">
                      {strategy.points.map((point, pidx) => (
                        <li key={pidx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أمثلة عملية</CardTitle>
              <CardDescription>
                مقارنات بين موجهات ضعيفة وقوية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  category: "كتابة المقالات",
                  weak: "اكتب مقالة عن الذكاء الاصطناعي",
                  strong: `اكتب مقالة توعوية عن الذكاء الاصطناعي بطول 2000 كلمة:
- الجمهور: موظفون تقنيون مبتدئون
- النبرة: احترافية وودية
- اشمل: التعريف، الفوائد، التحديات
- استخدم عناوين واضحة وأمثلة حقيقية`
                },
                {
                  category: "تحليل البيانات",
                  weak: "حلل هذه البيانات",
                  strong: `حلل البيانات المرفقة ويجب أن تتضمن:
1. ملخص تنفيذي (200 كلمة)
2. الاتجاهات الرئيسية (3-5 نقاط)
3. التوصيات العملية (5 توصيات محددة)
4. الصيغة: استخدم جداول وقوائم نقطية`
                },
                {
                  category: "كود برمجي",
                  weak: "اكتب دالة Python",
                  strong: `اكتب دالة Python تقوم بـ:
- تأخذ معاملين: قائمة أرقام وعدد
- ترجع أكبر N عنصر مرتب تنازليا
- تتعامل مع الأخطاء بشكل آمن
- تتضمن docstring واضح
- تتضمن test cases`
                }
              ].map((example, idx) => (
                <Card key={idx} className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-amber-700">{example.category}</h3>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <p className="font-semibold text-sm text-red-600">موجهة ضعيفة:</p>
                      </div>
                      <p className="text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded">
                        {example.weak}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <p className="font-semibold text-sm text-green-600">موجهة قوية:</p>
                      </div>
                      <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded whitespace-pre-wrap font-mono text-xs">
                        {example.strong}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Best Practices Tab */}
        <TabsContent value="bestpractices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أفضل الممارسات</CardTitle>
              <CardDescription>
                نصائح ذهبية لتحسين موجهاتك
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "✅ افعل",
                  items: [
                    "استخدم لغة بسيطة واضحة",
                    "حدد الهدف بدقة",
                    "قدم سياقاً كافياً",
                    "استخدم أمثلة عملية",
                    "اختبر موجهتك عدة مرات",
                    "احفظ الموجهات الناجحة"
                  ],
                  color: "green"
                },
                {
                  title: "❌ لا تفعل",
                  items: [
                    "لا تكن غامضاً أو مبهماً",
                    "لا تتوقع من النموذج قراءة أفكارك",
                    "لا تستخدم لغة سلبية",
                    "لا تفرط في التفاصيل غير المهمة",
                    "لا تتوقع الكمال من المحاولة الأولى",
                    "لا تنسَ السياق عند البدء من جديد"
                  ],
                  color: "red"
                }
              ].map((section, idx) => (
                <Card key={idx} className={`border-l-4 border-l-${section.color}-500`}>
                  <CardContent className="pt-6">
                    <h3 className={`font-semibold mb-4 text-${section.color}-700`}>
                      {section.title}
                    </h3>
                    <ul className="space-y-2">
                      {section.items.map((item, iidx) => (
                        <li key={iidx} className="flex items-start gap-2 text-sm">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 ${section.color === 'green' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {section.color === 'green' ? '✓' : '✗'}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                نصائح سريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  "جرب التحسين التدريجي: ابدأ بموجهة بسيطة ثم أضف التفاصيل",
                  "استخدم الفواصل: استخدم علامات ترقيم واضحة لفصل الأجزاء",
                  "كن محدداً: استخدم أرقام وتواريخ بدل كلمات عامة",
                  "اختبر المنطق: تحقق من أن موجهتك منطقية وقابلة للتطبيق",
                  "استخدم الصيغ: اترك فراغات للمتغيرات {{مثل_هذا}}",
                  "وثّق الناجح: احفظ الموجهات التي تعطي نتائج جيدة"
                ].map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-white/50 dark:bg-black/20 rounded">
                    <span className="text-yellow-500">💡</span>
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
