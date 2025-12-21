import { CritiqueResult, RunResult, PromptSections, ModelSettings, Variable } from "./types";

// Mock Data
export const MOCK_TEMPLATES = [
  {
    id: "1",
    name: "محلل الكود البرمجي",
    description: "قالب لتحليل الأكواد واكتشاف الأخطاء وتقديم تحسينات.",
    category: "Development",
    tags: ["Code", "Review", "Bugfix"],
    sections: {
      system: "أنت خبير هندسة برمجيات متخصص في مراجعة الكود (Code Review).",
      developer: "ركز على الأمان، الأداء، وقابلية القراءة.",
      user: "قم بتحليل الكود التالي وقدم تقريراً بالمشاكل والحلول المقترحة:\n\n{{code}}",
      context: "اللغة المستخدمة هي TypeScript."
    },
    defaultVariables: [{ id: "v1", name: "code", value: "console.log('hello')", type: "string" }]
  },
  {
    id: "2",
    name: "كاتب المحتوى التسويقي",
    description: "توليد محتوى تسويقي جذاب لمنصات التواصل الاجتماعي.",
    category: "Marketing",
    tags: ["Social Media", "Copywriting"],
    sections: {
      system: "أنت كاتب محتوى إبداعي محترف.",
      developer: "استخدم نبرة حماسية وجذابة. استخدم الرموز التعبيرية بحكمة.",
      user: "اكتب منشوراً لمنصة {{platform}} عن المنتج التالي: {{product_name}}.",
      context: "الجمهور المستهدف هو الشباب من عمر 18-25."
    },
    defaultVariables: [
      { id: "v1", name: "platform", value: "Twitter", type: "string" },
      { id: "v2", name: "product_name", value: "سماعات عازلة للضوضاء", type: "string" }
    ]
  },
  {
    id: "3",
    name: "مُحلل البيانات",
    description: "تحليل البيانات واستخراج الرؤى والأنماط.",
    category: "Data Science",
    tags: ["Analytics", "Data", "Insights"],
    sections: {
      system: "أنت محلل بيانات خبير متخصص في استخراج الرؤى من البيانات.",
      developer: "قدم تحليلاً شاملاً مع رسوم بيانية مقترحة. استخدم الأرقام والإحصائيات.",
      user: "حلل البيانات التالية وقدم رؤى قابلة للتنفيذ:\n\n{{data}}",
      context: "التركيز على الاتجاهات والأنماط الرئيسية."
    },
    defaultVariables: [{ id: "v1", name: "data", value: "", type: "string" }]
  },
  {
    id: "4",
    name: "مُترجم تقني",
    description: "ترجمة احترافية للمستندات التقنية.",
    category: "Translation",
    tags: ["Translation", "Technical", "Localization"],
    sections: {
      system: "أنت مترجم محترف متخصص في الترجمة التقنية.",
      developer: "حافظ على المصطلحات التقنية. اجعل الترجمة طبيعية وسلسة.",
      user: "ترجم النص التالي من {{source_lang}} إلى {{target_lang}}:\n\n{{text}}",
      context: "المجال التقني: البرمجة والتكنولوجيا."
    },
    defaultVariables: [
      { id: "v1", name: "source_lang", value: "الإنجليزية", type: "string" },
      { id: "v2", name: "target_lang", value: "العربية", type: "string" },
      { id: "v3", name: "text", value: "", type: "string" }
    ]
  },
  {
    id: "5",
    name: "مُولد اختبارات البرمجة",
    description: "إنشاء اختبارات آلية (Unit Tests) للكود.",
    category: "Development",
    tags: ["Testing", "TDD", "Quality"],
    sections: {
      system: "أنت خبير في كتابة الاختبارات الآلية (Unit Tests).",
      developer: "استخدم أفضل ممارسات TDD. غطّي الحالات الحدية (Edge Cases).",
      user: "اكتب اختبارات شاملة للدالة التالية:\n\n{{function_code}}\n\nاستخدم إطار العمل: {{framework}}",
      context: "تأكد من تغطية جميع السيناريوهات المحتملة."
    },
    defaultVariables: [
      { id: "v1", name: "function_code", value: "", type: "string" },
      { id: "v2", name: "framework", value: "Jest", type: "string" }
    ]
  },
  {
    id: "6",
    name: "مُحسّن SEO",
    description: "تحسين النصوص لمحركات البحث.",
    category: "Marketing",
    tags: ["SEO", "Content", "Optimization"],
    sections: {
      system: "أنت خبير في تحسين محركات البحث (SEO) والكتابة التسويقية.",
      developer: "ركز على الكلمات المفتاحية الطبيعية. حافظ على قابلية القراءة.",
      user: "حسّن المقال التالي لمحركات البحث مع التركيز على الكلمات المفتاحية: {{keywords}}\n\nالمقال:\n{{article}}",
      context: "الهدف: زيادة الترتيب في نتائج البحث."
    },
    defaultVariables: [
      { id: "v1", name: "keywords", value: "", type: "string" },
      { id: "v2", name: "article", value: "", type: "string" }
    ]
  }
];

export const MOCK_TECHNIQUES = [
  {
    id: "t1",
    title: "Chain of Thought (CoT)",
    description: "اطلب من النموذج التفكير خطوة بخطوة قبل الوصول للإجابة النهائية.",
    goodExample: "فكر خطوة بخطوة. أولاً قم بتحليل المشكلة، ثم اقترح حلولاً، ثم اختر الأفضل.",
    badExample: "حل المشكلة مباشرة.",
    commonMistakes: ["عدم تحديد خطوات واضحة", "تعقيد الطلب أكثر من اللازم"]
  },
  {
    id: "t2",
    title: "Few-Shot Prompting",
    description: "تزويد النموذج بأمثلة (Input-Output) لتعليمه النمط المطلوب.",
    goodExample: "الكلمة: سعيد\nالضد: حزين\n\nالكلمة: سريع\nالضد: بطيء\n\nالكلمة: قوي\nالضد:",
    badExample: "ما هو ضد كلمة قوي؟",
    commonMistakes: ["أمثلة غير متناسقة", "أمثلة تحتوي على أخطاء"]
  },
  {
    id: "t3",
    title: "Role Prompting",
    description: "تحديد دور أو شخصية واضحة للنموذج يحسن جودة الإجابات.",
    goodExample: "أنت طبيب متخصص في أمراض القلب بخبرة 20 عاماً. اشرح...",
    badExample: "اشرح لي عن أمراض القلب.",
    commonMistakes: ["دور عام جداً", "عدم تحديد مستوى الخبرة"]
  },
  {
    id: "t4",
    title: "Output Format Specification",
    description: "تحديد تنسيق الإخراج المطلوب يضمن نتائج منظمة وقابلة للمعالجة.",
    goodExample: "قدم الإجابة بصيغة JSON:\n{\n  \"summary\": \"...\",\n  \"steps\": [...]\n}",
    badExample: "أعطني النتيجة.",
    commonMistakes: ["عدم توضيح البنية المطلوبة", "طلب تنسيقات معقدة دون أمثلة"]
  },
  {
    id: "t5",
    title: "Constraint-Based Prompting",
    description: "وضع قيود واضحة يحسن التحكم في المخرجات.",
    goodExample: "اكتب ملخصاً في 3 نقاط فقط، كل نقطة لا تتجاوز 15 كلمة.",
    badExample: "اكتب ملخصاً قصيراً.",
    commonMistakes: ["قيود متناقضة", "قيود غامضة مثل 'قصير' أو 'طويل'"]
  },
  {
    id: "t6",
    title: "Negative Prompting",
    description: "توضيح ما لا تريده يمنع الإجابات غير المرغوبة.",
    goodExample: "اشرح الموضوع بلغة بسيطة. تجنب المصطلحات التقنية والاختصارات.",
    badExample: "اشرح الموضوع بشكل بسيط.",
    commonMistakes: ["التركيز فقط على النفي دون توضيح البديل", "نفي أشياء كثيرة جداً"]
  }
];

// Mock API Functions
export const mockCritique = async (sections: PromptSections): Promise<CritiqueResult> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate latency

  const issues = [];
  let clarityScore = 100;
  let specificityScore = 100;
  let structureScore = 100;
  let examplesScore = 50;
  
  // Check system role
  if (!sections.system.length) {
    issues.push({
      title: "غياب دور النظام (System Role)",
      severity: "high",
      evidence: "قسم System فارغ",
      fix: "أضف تعريفاً للشخصية، مثلاً: 'أنت مساعد ذكي متخصص في...'",
      section: "system",
      autoFixable: true
    });
    clarityScore -= 30;
    structureScore -= 20;
  } else if (sections.system.length < 20) {
    issues.push({
      title: "دور النظام قصير جداً",
      severity: "medium",
      evidence: "قسم System أقل من 20 حرفاً",
      fix: "وسّع وصف الدور ليكون أكثر تحديداً حول الشخصية والمهام المتوقعة",
      section: "system",
      autoFixable: false
    });
    clarityScore -= 15;
  }
  
  // Check for variable syntax errors
  const allText = `${sections.system} ${sections.developer} ${sections.user} ${sections.context}`;
  const openBrackets = (allText.match(/{{/g) || []).length;
  const closeBrackets = (allText.match(/}}/g) || []).length;
  if (openBrackets !== closeBrackets) {
    issues.push({
      title: "صيغة متغير خاطئة",
      severity: "high",
      evidence: `عدد الأقواس المفتوحة (${openBrackets}) لا يساوي المغلقة (${closeBrackets})`,
      fix: "تأكد من إغلاق جميع المتغيرات بـ }}",
      section: "user",
      autoFixable: false
    });
    structureScore -= 25;
  }
  
  // Check for examples (few-shot prompting)
  const hasExamples = allText.includes("مثال:") || allText.includes("Example:") || 
                      allText.includes("Input:") || allText.includes("Output:");
  if (hasExamples) {
    examplesScore = 100;
  } else {
    issues.push({
      title: "عدم وجود أمثلة توضيحية",
      severity: "low",
      evidence: "لا توجد أمثلة في المطالبة",
      fix: "أضف أمثلة (Input/Output) لتحسين دقة النتائج باستخدام Few-Shot Prompting",
      section: "user",
      autoFixable: false
    });
  }
  
  // Check for vague language
  const vagueTerms = ["شيء", "أي شيء", "نوعاً ما", "ربما", "قد يكون"];
  const foundVague = vagueTerms.filter(term => allText.includes(term));
  if (foundVague.length > 0) {
    issues.push({
      title: "استخدام لغة غامضة",
      severity: "medium",
      evidence: `تم العثور على مصطلحات غامضة: ${foundVague.join(", ")}`,
      fix: "استبدل المصطلحات الغامضة بتعليمات واضحة ومحددة",
      section: "user",
      autoFixable: false
    });
    specificityScore -= 20;
    clarityScore -= 15;
  }
  
  // Check for output format specification
  const hasOutputFormat = allText.includes("JSON") || allText.includes("Markdown") || 
                          allText.includes("قائمة") || allText.includes("جدول") ||
                          allText.includes("تنسيق:");
  if (!hasOutputFormat && sections.user.length > 50) {
    issues.push({
      title: "عدم تحديد تنسيق الإخراج",
      severity: "low",
      evidence: "لم يتم تحديد التنسيق المطلوب للإجابة",
      fix: "حدد تنسيق الإخراج المطلوب (JSON، Markdown، قائمة، إلخ)",
      section: "developer",
      autoFixable: true
    });
    specificityScore -= 10;
  }
  
  // Check for length - too short prompts
  if (sections.user.length < 10) {
    issues.push({
      title: "مطالبة المستخدم قصيرة جداً",
      severity: "medium",
      evidence: "قسم User أقل من 10 أحرف",
      fix: "وسّع المطالبة لتكون أكثر وضوحاً وتحديداً",
      section: "user",
      autoFixable: false
    });
    specificityScore -= 20;
  }
  
  // Calculate overall score
  const metrics = {
    clarity: Math.max(0, Math.min(100, clarityScore)),
    specificity: Math.max(0, Math.min(100, specificityScore)),
    structure: Math.max(0, Math.min(100, structureScore)),
    examples: Math.max(0, Math.min(100, examplesScore)),
  };
  
  const overallScore = Math.round(
    (metrics.clarity * 0.3 + metrics.specificity * 0.3 + metrics.structure * 0.25 + metrics.examples * 0.15)
  );
  
  const improvements = [];
  if (metrics.clarity < 80) improvements.push("حسّن وضوح التعليمات واستخدم لغة مباشرة");
  if (metrics.specificity < 80) improvements.push("كن أكثر تحديداً في طلبك وتجنب المصطلحات الغامضة");
  if (metrics.structure < 80) improvements.push("نظم المطالبة بشكل أفضل (System → Developer → User → Context)");
  if (metrics.examples < 80) improvements.push("أضف أمثلة توضيحية (Few-Shot Examples) لتحسين الدقة");
  
  return {
    score: overallScore,
    issues: issues as any,
    improvements,
    metrics,
  };
};

export const mockRun = async (sections: PromptSections, vars: Variable[], settings: ModelSettings): Promise<RunResult> => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate LLM generation

  let promptText = `${sections.system}\n${sections.developer}\n${sections.user}\n${sections.context}`;
  vars.forEach(v => {
    promptText = promptText.replace(new RegExp(`{{${v.name}}}`, 'g'), v.value);
  });

  // Simulate token usage
  const promptTokens = Math.floor(promptText.length / 3); // Rough estimate
  const completionTokens = Math.floor(Math.random() * 500) + 100;
  const totalTokens = promptTokens + completionTokens;
  
  // Simulate cost based on model
  const pricing: Record<string, number> = {
    "gpt-4o": 0.000015,
    "claude-3-5-sonnet": 0.000018,
    "gemini-pro": 0.000008,
  };
  const costPerToken = pricing[settings.model] || 0.00001;
  const estimatedCost = totalTokens * costPerToken;
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    promptVersion: sections,
    variables: vars,
    settings,
    output: `هذه نتيجة محاكاة للنموذج ${settings.model}.\n\nبناءً على طلبك:\n"${sections.user.substring(0, 50)}..."\n\nإليك الإجابة المقترحة:\n- نقطة أولى\n- نقطة ثانية\n- خلاصة.`,
    timestamp: Date.now(),
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalTokens,
    },
    cost: estimatedCost,
    duration: 2.1 + Math.random() * 3, // 2-5 seconds
  };
};
