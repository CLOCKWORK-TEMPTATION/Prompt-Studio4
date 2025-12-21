import { PromptSections, TokenEstimate } from "./types";

// Model pricing per 1M tokens (input / output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "claude-3-5-sonnet": { input: 3, output: 15 },
  "claude-3-5-haiku": { input: 1, output: 5 },
  "gemini-pro": { input: 0.5, output: 1.5 },
  "gemini-flash": { input: 0.075, output: 0.3 },
};

/**
 * Rough token estimation (1 token ≈ 4 characters for English, ~2-3 for Arabic)
 * This is a simplified version. For production, use tiktoken or similar.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  // Arabic text tends to use more tokens per character
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const otherChars = text.length - arabicChars;
  
  // Approximate: Arabic ~2.5 chars/token, English ~4 chars/token
  return Math.ceil((arabicChars / 2.5) + (otherChars / 4));
}

/**
 * Calculate token estimates for all prompt sections
 */
export function calculateTokenEstimate(
  sections: PromptSections,
  model: string,
  maxTokens: number = 1000
): TokenEstimate {
  const systemTokens = estimateTokens(sections.system);
  const developerTokens = estimateTokens(sections.developer);
  const userTokens = estimateTokens(sections.user);
  const contextTokens = estimateTokens(sections.context);
  
  const totalInputTokens = systemTokens + developerTokens + userTokens + contextTokens;
  const totalTokens = totalInputTokens + maxTokens; // Estimate with max completion tokens
  
  // Calculate cost
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["gpt-4o"];
  const inputCost = (totalInputTokens / 1_000_000) * pricing.input;
  const outputCost = (maxTokens / 1_000_000) * pricing.output;
  const estimatedCost = inputCost + outputCost;
  
  return {
    system: systemTokens,
    developer: developerTokens,
    user: userTokens,
    context: contextTokens,
    total: totalInputTokens,
    estimatedCost: estimatedCost,
  };
}

/**
 * Format cost in USD
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Get model display name and info
 */
export function getModelInfo(model: string): { name: string; provider: string; contextWindow: number } {
  const models: Record<string, { name: string; provider: string; contextWindow: number }> = {
    "gpt-4o": { name: "GPT-4o", provider: "OpenAI", contextWindow: 128000 },
    "gpt-4o-mini": { name: "GPT-4o Mini", provider: "OpenAI", contextWindow: 128000 },
    "claude-3-5-sonnet": { name: "Claude 3.5 Sonnet", provider: "Anthropic", contextWindow: 200000 },
    "claude-3-5-haiku": { name: "Claude 3.5 Haiku", provider: "Anthropic", contextWindow: 200000 },
    "gemini-pro": { name: "Gemini Pro", provider: "Google", contextWindow: 1000000 },
    "gemini-flash": { name: "Gemini Flash", provider: "Google", contextWindow: 1000000 },
  };
  
  return models[model] || { name: model, provider: "Unknown", contextWindow: 4096 };
}
