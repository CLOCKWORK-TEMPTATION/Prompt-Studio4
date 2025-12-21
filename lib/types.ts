export interface Variable {
  id: string;
  name: string;
  value: string;
}

export interface PromptSections {
  system: string;
  developer: string;
  user: string;
  context: string;
}

export interface ModelSettings {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface RunResult {
  runId: number;
  output: string;
  latency: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  sections: PromptSections;
  defaultVariables: Variable[];
  tags: string[];
  createdAt: string;
}

export interface Technique {
  id: number;
  title: string;
  description: string;
  goodExample: string;
  badExample: string;
  commonMistakes: string[];
  snippet: string | null;
  createdAt: string;
}

export interface Run {
  id: number;
  promptVersionId: number | null;
  sections: PromptSections;
  variables: Variable[];
  model: string;
  temperature: number;
  maxTokens: number | null;
  output: string;
  latency: number | null;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  } | null;
  createdAt: string;
}

export interface RunRating {
  id: number;
  runId: number;
  rating: number | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

export interface CritiqueIssue {
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

export interface CritiqueResult {
  score: number;
  issues: CritiqueIssue[];
  rewrittenPrompt?: string;
  reasoning: string;
}

// Agent Compose Types
export interface AgentComposeRequest {
  rawIdea: string;
  goal?: string;
  constraints?: string;
  outputFormat?: string;
  modelConfig?: {
    model: string;
    temperature: number;
    maxTokens?: number;
  };
}

export interface Agent1Output {
  system: string;
  developer: string;
  user: string;
  context: string;
  variables: Variable[];
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
  finalVariables: Variable[];
  decisionNotes: string[];
}

export interface AgentComposeStatus {
  status: "pending" | "running" | "completed" | "failed";
  stage: "agent1" | "agent2" | "agent3" | "done";
  progress: number;
  error?: string;
  result?: {
    agent1: Agent1Output;
    agent2: Agent2Output;
    agent3: Agent3Output;
  };
}
