import { llmProvider } from "./llm-provider";

export interface Agent1Output {
  system: string;
  developer: string;
  user: string;
  context: string;
  variables: Array<{ id: string; name: string; value: string }>;
  modelHints?: string;
}

export interface Agent2Output {
  criticisms: string[];
  alternativePrompt: {
    system: string;
    developer: string;
    user: string;
    context: string;
  };
  fixes: string[];
}

export interface Agent3Output {
  finalPrompt: {
    system: string;
    developer: string;
    user: string;
    context: string;
  };
  finalVariables: Array<{ id: string; name: string; value: string }>;
  decisionNotes: string[];
}

/**
 * Agent 1 (المُحوِّل): يحول الفكرة الخام إلى الأقسام الأربعة
 */
export async function runAgent1(
  rawIdea: string,
  goal?: string,
  constraints?: string,
  outputFormat?: string,
  modelConfig?: { model: string; temperature: number; maxTokens?: number }
): Promise<Agent1Output> {
  const promptText = `أنت خبير في هندسة المطالبات (Prompt Engineering) لنماذج الذكاء الاصطناعي.

**مهمتك:** تحويل فكرة/طلب المستخدم الخام إلى المطالبة المُهيكلة ذات الأقسام الأربعة:
1. **System**: دور النموذج (من هو؟ مثلاً: "أنت خبير في...")
2. **Developer**: تعليمات تقنية وقيود (كيف يجيب؟ القيود؟ النبرة؟)
3. **User**: المطلوب من المستخدم (المهمة الرئيسية)
4. **Context**: سياق إضافي أو معلومات خلفية

**المدخلات:**
- الفكرة الخام: ${rawIdea}
${goal ? `- الهدف النهائي: ${goal}` : ""}
${constraints ? `- القيود: ${constraints}` : ""}
${outputFormat ? `- شكل المخرجات المطلوب: ${outputFormat}` : ""}

**القواعد:**
- اكتب بالعربية الفصحى الواضحة
- استخرج المتغيرات {{var}} إذا كانت موجودة أو مفيدة (مثل {{topic}}, {{code}}, {{language}})
- اجعل System واضحاً ومحدداً للدور
- اجعل Developer يحتوي على التعليمات التقنية والأسلوب
- اجعل User يحتوي على المهمة الفعلية
- Context اختياري (استخدمه إذا كان هناك معلومات خلفية مهمة)

**قدم الإجابة حصراً بتنسيق JSON التالي (بدون أي نص إضافي):**
{
  "system": "...",
  "developer": "...",
  "user": "...",
  "context": "...",
  "variables": [
    {"id": "v1", "name": "variableName", "value": "defaultValue"}
  ],
  "modelHints": "ملاحظات اختيارية عن النموذج المناسب أو إعدادات مقترحة"
}`;

  const result = await llmProvider.complete({
    model: modelConfig?.model || "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "أنت خبير هندسة مطالبات. مخرجاتك حصراً JSON صالح." },
      { role: "user", content: promptText },
    ],
    temperature: modelConfig?.temperature || 0.3,
    max_tokens: modelConfig?.maxTokens || 2000,
  });

  return parseAgentOutput<Agent1Output>(result.output);
}

/**
 * Agent 2 (المُشكِّك): يراجع مخرجات Agent 1 ويقترح تحسينات
 */
export async function runAgent2(
  agent1Output: Agent1Output,
  originalIdea: string,
  modelConfig?: { model: string; temperature: number; maxTokens?: number }
): Promise<Agent2Output> {
  const promptText = `أنت مُراجع نقدي (Critical Reviewer) متخصص في هندسة المطالبات.

**مهمتك:** مراجعة المطالبة التالية التي أنتجها وكيل آخر وتقديم نقد بنّاء.

**الفكرة الأصلية للمستخدم:**
${originalIdea}

**المطالبة المُقترحة (من Agent 1):**
- System: ${agent1Output.system}
- Developer: ${agent1Output.developer}
- User: ${agent1Output.user}
- Context: ${agent1Output.context}
- Variables: ${JSON.stringify(agent1Output.variables, null, 2)}

**المطلوب منك:**
1. **Criticisms**: اكتشف نقاط الضعف والثغرات والافتراضات الخاطئة (قائمة قصيرة)
2. **Fixes**: اقترح إصلاحات محددة
3. **AlternativePrompt**: اكتب نسخة بديلة محسّنة من المطالبة (الأقسام الأربعة)

**قدم الإجابة حصراً بتنسيق JSON التالي:**
{
  "criticisms": [
    "النقد الأول...",
    "النقد الثاني..."
  ],
  "fixes": [
    "الإصلاح الأول...",
    "الإصلاح الثاني..."
  ],
  "alternativePrompt": {
    "system": "...",
    "developer": "...",
    "user": "...",
    "context": "..."
  }
}`;

  const result = await llmProvider.complete({
    model: modelConfig?.model || "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "أنت مراجع نقدي دقيق. مخرجاتك حصراً JSON صالح." },
      { role: "user", content: promptText },
    ],
    temperature: modelConfig?.temperature || 0.4,
    max_tokens: modelConfig?.maxTokens || 2000,
  });

  return parseAgentOutput<Agent2Output>(result.output);
}

/**
 * Agent 3 (الحَكَم): يدمج الأفضل من Agent 1 و Agent 2
 */
export async function runAgent3(
  agent1Output: Agent1Output,
  agent2Output: Agent2Output,
  originalIdea: string,
  modelConfig?: { model: string; temperature: number; maxTokens?: number }
): Promise<Agent3Output> {
  const promptText = `أنت حَكَم ومُقيِّم نهائي (Final Judge) لاختيار أفضل مطالبة.

**الفكرة الأصلية:**
${originalIdea}

**المطالبة الأولى (Agent 1):**
- System: ${agent1Output.system}
- Developer: ${agent1Output.developer}
- User: ${agent1Output.user}
- Context: ${agent1Output.context}

**النقد والمطالبة البديلة (Agent 2):**
النقد: ${agent2Output.criticisms.join(", ")}
الإصلاحات المقترحة: ${agent2Output.fixes.join(", ")}

المطالبة البديلة:
- System: ${agent2Output.alternativePrompt.system}
- Developer: ${agent2Output.alternativePrompt.developer}
- User: ${agent2Output.alternativePrompt.user}
- Context: ${agent2Output.alternativePrompt.context}

**مهمتك:**
1. قارن بين المطالبتين
2. اختر الأفضل أو ادمج نقاط القوة من كليهما
3. أنتج **النسخة النهائية المثلى**
4. اشرح قراراتك في decisionNotes (قائمة قصيرة)

**قدم الإجابة حصراً بتنسيق JSON التالي:**
{
  "finalPrompt": {
    "system": "...",
    "developer": "...",
    "user": "...",
    "context": "..."
  },
  "finalVariables": [
    {"id": "v1", "name": "variableName", "value": "defaultValue"}
  ],
  "decisionNotes": [
    "القرار الأول: اخترت X لأن...",
    "القرار الثاني: دمجت Y مع Z لأن..."
  ]
}`;

  const result = await llmProvider.complete({
    model: modelConfig?.model || "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "أنت حكم نهائي حكيم. مخرجاتك حصراً JSON صالح." },
      { role: "user", content: promptText },
    ],
    temperature: modelConfig?.temperature || 0.2,
    max_tokens: modelConfig?.maxTokens || 2000,
  });

  const agent3Result = parseAgentOutput<Agent3Output>(result.output);

  // If Agent 3 didn't provide variables, use Agent 1's variables
  if (!agent3Result.finalVariables || agent3Result.finalVariables.length === 0) {
    agent3Result.finalVariables = agent1Output.variables || [];
  }

  return agent3Result;
}

/**
 * Helper: Parse JSON output from LLM (handles markdown code blocks)
 */
function parseAgentOutput<T>(output: string): T {
  try {
    const trimmed = output.trim();
    // Remove markdown code blocks if present
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, trimmed];
    const jsonText = jsonMatch[1] || trimmed;
    return JSON.parse(jsonText);
  } catch (error) {
    const sanitizedOutput = String(output).replace(/[\r\n]/g, ' ').substring(0, 100);
    console.error("Failed to parse agent output:", sanitizedOutput);
    throw new Error(`فشل تحليل مخرجات الوكيل: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
  }
}
