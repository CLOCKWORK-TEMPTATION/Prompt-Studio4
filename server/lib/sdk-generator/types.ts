// ============================================================
// Prompt Configuration Types
// ============================================================

export interface PromptConfig {
  id: string;
  name: string;
  description: string;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  variables: PromptVariable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
}

// ============================================================
// SDK Generation Types
// ============================================================

export interface SDKGenerationOptions {
  language: 'python' | 'typescript' | 'curl';
  asyncMode: boolean;
  includeRetryLogic: boolean;
  includeErrorHandling: boolean;
  functionName: string;
  className: string;
  includeTypes: boolean;
  includeDocstrings: boolean;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

export interface GeneratedSDK {
  language: 'python' | 'typescript' | 'curl';
  code: string;
  types?: string;
  filename: string;
  dependencies: string[];
}
