import React from 'react';

export interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export interface ContentBlock {
  id: string;
  title:string;
  description?: string | React.ReactNode;
  details?: string | React.ReactNode;
  examplePrompt?: string | React.ReactNode;
  subItems?: ContentBlock[];
}

export interface PlaygroundExample {
  title: string;
  userInput: string;
  customInstructions: string;
}

export interface HistoryItem {
  id: string;
  userInput: string;
  customInstructions: string;
  generatedPrompt: string;
  timestamp: string;
}

export interface PromptTemplate {
  title: string;
  useCase: string;
  description: string;
  variables: { name: string; description: string }[];
  template: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  templates: PromptTemplate[];
}
