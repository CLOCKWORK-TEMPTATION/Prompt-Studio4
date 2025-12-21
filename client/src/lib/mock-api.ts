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
    defaultVariables: [{ id: "v1", name: "code", value: "console.log('hello')" }]
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
      { id: "v1", name: "platform", value: "Twitter" },
      { id: "v2", name: "product_name", value: "سماعات عازلة للضوضاء" }
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
  }
];

// Mock API Functions
export const mockCritique = async (sections: PromptSections): Promise<CritiqueResult> => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate latency

  const issues = [];
  if (!sections.system.length) {
    issues.push({
      title: "غياب دور النظام (System Role)",
      severity: "high",
      evidence: "قسم System فارغ",
      fix: "أضف تعريفاً للشخصية، مثلاً: 'أنت مساعد ذكي متخصص في...'",
      section: "system"
    });
  }
  if (sections.user.includes("{{") && !sections.user.includes("}}")) {
    issues.push({
      title: "صيغة متغير خاطئة",
      severity: "medium",
      evidence: "يوجد أقواس مفتوحة {{ بدون إغلاق",
      fix: "تأكد من إغلاق المتغيرات بـ }}",
      section: "user"
    });
  }
  
  return {
    score: Math.max(0, 100 - (issues.length * 20)),
    issues: issues as any,
    improvements: ["جرب إضافة أمثلة لزيادة الدقة", "حدد تنسيق الإخراج (JSON/Markdown)"]
  };
};

export const mockRun = async (sections: PromptSections, vars: Variable[], settings: ModelSettings): Promise<RunResult> => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate LLM generation

  let promptText = `${sections.system}\n${sections.developer}\n${sections.user}\n${sections.context}`;
  vars.forEach(v => {
    promptText = promptText.replace(new RegExp(`{{${v.name}}}`, 'g'), v.value);
  });

  return {
    id: Math.random().toString(36).substr(2, 9),
    promptVersion: sections,
    variables: vars,
    settings,
    output: `هذه نتيجة محاكاة للنموذج ${settings.model}.\n\nبناءً على طلبك:\n"${sections.user.substring(0, 50)}..."\n\nإليك الإجابة المقترحة:\n- نقطة أولى\n- نقطة ثانية\n- خلاصة.`,
    timestamp: Date.now()
  };
};
