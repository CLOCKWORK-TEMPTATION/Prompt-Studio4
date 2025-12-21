import { Template, PromptSections, Variable } from "./types";

/**
 * Export a template to JSON format
 */
export function exportTemplate(template: Template): string {
  return JSON.stringify(template, null, 2);
}

/**
 * Export multiple templates
 */
export function exportTemplates(templates: Template[]): string {
  return JSON.stringify(templates, null, 2);
}

/**
 * Import a template from JSON string
 */
export function importTemplate(jsonString: string): Template {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.id || !data.name || !data.sections) {
      throw new Error("Invalid template format: missing required fields");
    }
    
    // Validate sections
    const requiredSections: (keyof PromptSections)[] = ['system', 'developer', 'user', 'context'];
    for (const section of requiredSections) {
      if (typeof data.sections[section] !== 'string') {
        throw new Error(`Invalid template format: missing or invalid section '${section}'`);
      }
    }
    
    return data as Template;
  } catch (error) {
    throw new Error(`Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import multiple templates
 */
export function importTemplates(jsonString: string): Template[] {
  try {
    const data = JSON.parse(jsonString);
    
    if (!Array.isArray(data)) {
      throw new Error("Invalid format: expected an array of templates");
    }
    
    return data.map((item, index) => {
      try {
        return importTemplate(JSON.stringify(item));
      } catch (error) {
        throw new Error(`Error in template ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  } catch (error) {
    throw new Error(`Failed to import templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export current prompt as template
 */
export function exportCurrentPrompt(
  name: string,
  description: string,
  sections: PromptSections,
  variables: Variable[],
  category: string = "Custom",
  tags: string[] = []
): Template {
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    description,
    category,
    sections: { ...sections },
    defaultVariables: [...variables],
    tags,
  };
}

/**
 * Download template as JSON file
 */
export function downloadTemplate(template: Template, filename?: string): void {
  const json = exportTemplate(template);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${template.name.replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download multiple templates as JSON file
 */
export function downloadTemplates(templates: Template[], filename: string = 'templates.json'): void {
  const json = exportTemplates(templates);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Local storage for custom templates
 */
const CUSTOM_TEMPLATES_KEY = 'custom_templates';

export function saveCustomTemplate(template: Template): void {
  const templates = getCustomTemplates();
  const existingIndex = templates.findIndex(t => t.id === template.id);
  
  if (existingIndex >= 0) {
    templates[existingIndex] = template;
  } else {
    templates.push(template);
  }
  
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
}

export function getCustomTemplates(): Template[] {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function deleteCustomTemplate(id: string): void {
  const templates = getCustomTemplates().filter(t => t.id !== id);
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
}

export function clearCustomTemplates(): void {
  localStorage.removeItem(CUSTOM_TEMPLATES_KEY);
}
