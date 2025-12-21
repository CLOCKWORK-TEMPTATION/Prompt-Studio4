import { z } from "zod";

// OpenAI-compatible API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

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
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || OPENAI_API_KEY || "";
    this.baseUrl = baseUrl || OPENAI_BASE_URL;

    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
  }

  /**
   * Run a completion request
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    // Convert "developer" role to "system" for OpenAI compatibility
    const messages = request.messages.map((msg) => ({
      role: msg.role === "developer" ? "system" : msg.role,
      content: msg.content,
    }));

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
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
  }): Promise<CritiqueResponse> {
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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "أنت خبير هندسة مطالبات. مخرجاتك حصراً JSON صالح.",
        },
        { role: "user", content: critiquePrompt },
      ],
      temperature: 0.3,
    });

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
