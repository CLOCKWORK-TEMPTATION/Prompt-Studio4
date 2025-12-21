import { z } from "zod";

// Groq API configuration (OpenAI-compatible)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// Default model for Groq
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export interface Message {
  role: "system" | "user" | "assistant" | "developer";
  content: string;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

export interface CompletionResponse {
  output: string;
  latency: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface CritiqueResponse {
  score: number;
  issues: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    suggestion?: string;
  }>;
  rewrittenPrompt?: string;
  reasoning: string;
}

export class LLMProvider {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || GROQ_BASE_URL;
  }

  private getApiKey(sessionKey?: string): string {
    // Priority: session API key > environment secret
    const key = sessionKey || GROQ_API_KEY;
    if (!key) {
      throw new Error("NO_API_KEY");
    }
    return key;
  }

  /**
   * Run a completion request
   */
  async complete(request: CompletionRequest, sessionKey?: string): Promise<CompletionResponse> {
    const apiKey = this.getApiKey(sessionKey);
    const startTime = Date.now();

    // Convert "developer" role to "system" for API compatibility
    const messages = request.messages.map((msg) => ({
      role: msg.role === "developer" ? "system" : msg.role,
      content: msg.content,
    }));

    // Use default model if not specified or if it's an OpenAI model
    let model = request.model;
    if (model.startsWith("gpt-") || model.startsWith("o1-")) {
      model = DEFAULT_MODEL;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      output: data.choices[0].message.content,
      latency,
      tokenUsage: data.usage
        ? {
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens,
            total: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Critique a prompt and suggest improvements
   */
  async critique(prompt: {
    system: string;
    developer: string;
    user: string;
    context: string;
  }, sessionKey?: string): Promise<CritiqueResponse> {
    const critiquePrompt = `أنت خبير في هندسة المطالبات (Prompt Engineering). قم بتحليل المطالبة التالية وتقديم تقييم شامل.

**المطالبة المراد تحليلها:**

System: ${prompt.system || "(فارغ)"}
Developer: ${prompt.developer || "(فارغ)"}
User: ${prompt.user || "(فارغ)"}
Context: ${prompt.context || "(فارغ)"}

**المطلوب منك:**
1. قيّم جودة المطالبة من 0 إلى 100
2. اكتشف المشاكل والأخطاء (Clarity, Specificity, Structure, Role Definition, Context)
3. قدم نسخة محسنة من المطالبة (Rewrite) إذا لزم الأمر

**قدم الإجابة حصراً بتنسيق JSON التالي:**
{
  "score": <رقم من 0-100>,
  "reasoning": "<تحليلك المفصل>",
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "message": "<وصف المشكلة>",
      "suggestion": "<اقتراح للتحسين>"
    }
  ],
  "rewrittenPrompt": {
    "system": "<النسخة المحسنة>",
    "developer": "<النسخة المحسنة>",
    "user": "<النسخة المحسنة>",
    "context": "<النسخة المحسنة>"
  }
}`;

    const response = await this.complete({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "أنت خبير هندسة مطالبات. مخرجاتك حصراً JSON صالح.",
        },
        { role: "user", content: critiquePrompt },
      ],
      temperature: 0.3,
    }, sessionKey);

    // Parse the JSON response
    try {
      const output = response.output.trim();
      // Remove markdown code blocks if present
      const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, output];
      const jsonText = jsonMatch[1] || output;
      const result = JSON.parse(jsonText);

      return {
        score: result.score,
        issues: result.issues || [],
        rewrittenPrompt: result.rewrittenPrompt
          ? JSON.stringify(result.rewrittenPrompt)
          : undefined,
        reasoning: result.reasoning || "",
      };
    } catch (error) {
      // Fallback if parsing fails
      return {
        score: 50,
        issues: [
          {
            severity: "error",
            message: "فشل تحليل الـ JSON من النموذج",
            suggestion: "حاول مرة أخرى",
          },
        ],
        reasoning: "حدث خطأ أثناء تحليل النتيجة",
      };
    }
  }
}

export const llmProvider = new LLMProvider();
