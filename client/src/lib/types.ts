export interface Variable {
  id: string;
  name: string;
  value: string;
  type?: 'string' | 'number' | 'array' | 'object';
  description?: string;
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
  id: string;
  promptVersion: PromptSections;
  variables: Variable[];
  settings: ModelSettings;
  output: string;
  timestamp: number;
  rating?: number;
  notes?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  duration?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: PromptSections;
  defaultVariables: Variable[];
  tags: string[];
}

export interface CritiqueIssue {
  title: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string;
  fix: string;
  section: keyof PromptSections;
  autoFixable?: boolean;
}

export interface CritiqueResult {
  score: number;
  issues: CritiqueIssue[];
  improvements: string[];
  metrics?: {
    clarity: number;
    specificity: number;
    structure: number;
    examples: number;
  };
}

export interface PromptVersion {
  id: string;
  sections: PromptSections;
  variables: Variable[];
  timestamp: number;
  label?: string;
  parentId?: string;
}

export interface TokenEstimate {
  system: number;
  developer: number;
  user: number;
  context: number;
  total: number;
  estimatedCost: number;
}
