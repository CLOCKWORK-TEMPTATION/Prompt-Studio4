import { z } from "zod";

// API configuration for different providers
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const OPENAI_BASE_URL = "https://api.openai.com/v1";
const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const GOOGLE_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Default model for Groq
const DEFAULT_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct";

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
  private groqBaseUrl: string;
  private openaiBaseUrl: string;
  private anthropicBaseUrl: string;
  private googleBaseUrl: string;

  constructor() {
    this.groqBaseUrl = GROQ_BASE_URL;
    this.openaiBaseUrl = OPENAI_BASE_URL;
    this.anthropicBaseUrl = ANTHROPIC_BASE_URL;
    this.googleBaseUrl = GOOGLE_BASE_URL;
  }

  private getApiKey(provider: string, sessionKey?: string): string {
    // Priority: session API key > environment secret
    let key: string | undefined;
    
    switch (provider) {
      case "groq":
        key = sessionKey || GROQ_API_KEY;
        break;
      case "openai":
        key = sessionKey || OPENAI_API_KEY;
        break;
      case "anthropic":
        key = sessionKey || ANTHROPIC_API_KEY;
        break;
      case "google":
        key = sessionKey || GOOGLE_AI_API_KEY;
        break;
      default:
        key = sessionKey || GROQ_API_KEY; // fallback to Groq
    }
    
    if (!key) {
      throw new Error(`NO_API_KEY_FOR_${provider.toUpperCase()}`);
    }
    return key;
  }

  private getProviderFromModel(model: string): string {
    if (model.startsWith("gpt-")) return "openai";
    if (model.startsWith("claude-")) return "anthropic";
    if (model.startsWith("models/gemini-")) return "google";
    return "groq"; // default
  }

  /**
   * Run a completion request
   */
  async complete(request: CompletionRequest, sessionKey?: string): Promise<CompletionResponse> {
    const provider = this.getProviderFromModel(request.model);
    const apiKey = this.getApiKey(provider, sessionKey);
    const startTime = Date.now();

    // Convert "developer" role to "system" for API compatibility
    const messages = request.messages.map((msg) => ({
      role: msg.role === "developer" ? "system" : msg.role,
      content: msg.content,
    }));

    let response: Response;
    let model = request.model;

    switch (provider) {
      case "openai":
        response = await this.callOpenAI(model, messages, request, apiKey);
        break;
      case "anthropic":
        response = await this.callAnthropic(model, messages, request, apiKey);
        break;
      case "google":
        response = await this.callGoogle(model, messages, request, apiKey);
        break;
      case "groq":
      default:
        response = await this.callGroq(model, messages, request, apiKey);
        break;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${provider.toUpperCase()} API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return this.parseResponse(data, latency, provider);
  }

  private async callGroq(model: string, messages: any[], request: CompletionRequest, apiKey: string): Promise<Response> {
    return fetch(`${this.groqBaseUrl}/chat/completions`, {
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
  }

  private async callOpenAI(model: string, messages: any[], request: CompletionRequest, apiKey: string): Promise<Response> {
    return fetch(`${this.openaiBaseUrl}/chat/completions`, {
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
  }

  private async callAnthropic(model: string, messages: any[], request: CompletionRequest, apiKey: string): Promise<Response> {
    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === "system")?.content || "";
    const userMessages = messages.filter(m => m.role !== "system");
    
    return fetch(`${this.anthropicBaseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: systemMessage,
        messages: userMessages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens || 1000,
      }),
    });
  }

  private async callGoogle(model: string, messages: any[], request: CompletionRequest, apiKey: string): Promise<Response> {
    // Convert messages format for Google
    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    return fetch(`${this.googleBaseUrl}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.max_tokens,
        },
      }),
    });
  }

  private parseResponse(data: any, latency: number, provider: string): CompletionResponse {
    let output: string;
    let tokenUsage: any = undefined;

    switch (provider) {
      case "anthropic":
        output = data.content[0].text;
        tokenUsage = data.usage ? {
          prompt: data.usage.input_tokens,
          completion: data.usage.output_tokens,
          total: data.usage.input_tokens + data.usage.output_tokens,
        } : undefined;
        break;
      case "google":
        output = data.candidates[0].content.parts[0].text;
        tokenUsage = data.usageMetadata ? {
          prompt: data.usageMetadata.promptTokenCount,
          completion: data.usageMetadata.candidatesTokenCount,
          total: data.usageMetadata.totalTokenCount,
        } : undefined;
        break;
      case "openai":
      case "groq":
      default:
        output = data.choices[0].message.content;
        tokenUsage = data.usage ? {
          prompt: data.usage.prompt_tokens,
          completion: data.usage.completion_tokens,
          total: data.usage.total_tokens,
        } : undefined;
        break;
    }

    return {
      output,
      latency,
      tokenUsage,
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
