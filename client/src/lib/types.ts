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
  id: string;
  promptVersion: PromptSections;
  variables: Variable[];
  settings: ModelSettings;
  output: string;
  timestamp: number;
  rating?: number;
  notes?: string;
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
}

export interface CritiqueResult {
  score: number;
  issues: CritiqueIssue[];
  improvements: string[];
}
