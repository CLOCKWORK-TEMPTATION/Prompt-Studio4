/**
 * Share utilities for prompt sharing via URL
 */

export interface ShareablePrompt {
  rawIdea: string;
  goal: string;
  constraints: string;
  outputFormat: string;
}

/**
 * Encode prompt to shareable URL
 */
export function encodePromptToUrl(prompt: ShareablePrompt): string {
  const params = new URLSearchParams({
    idea: prompt.rawIdea,
    goal: prompt.goal,
    constraints: prompt.constraints,
    format: prompt.outputFormat,
  });
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/studio?${params.toString()}`;
}

/**
 * Decode prompt from URL parameters
 */
export function decodePromptFromUrl(): ShareablePrompt | null {
  const params = new URLSearchParams(window.location.search);
  
  const idea = params.get('idea');
  const goal = params.get('goal');
  const constraints = params.get('constraints');
  const format = params.get('format');

  if (!idea) return null;

  return {
    rawIdea: idea || '',
    goal: goal || '',
    constraints: constraints || '',
    outputFormat: format || '',
  };
}

/**
 * Copy share URL to clipboard
 */
export async function copyShareUrl(prompt: ShareablePrompt): Promise<boolean> {
  try {
    const url = encodePromptToUrl(prompt);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy share URL:', error);
    return false;
  }
}

/**
 * Share via Web Share API if available
 */
export async function sharePrompt(prompt: ShareablePrompt): Promise<boolean> {
  if (!navigator.share) {
    return copyShareUrl(prompt);
  }

  try {
    const url = encodePromptToUrl(prompt);
    await navigator.share({
      title: 'مشاركة موجهة',
      text: prompt.rawIdea,
      url: url,
    });
    return true;
  } catch (error) {
    console.error('Failed to share:', error);
    return false;
  }
}

/**
 * Generate a short ID for the prompt
 */
export function generatePromptId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Create a compact share link (useful for databases)
 */
export interface CompactShareLink {
  id: string;
  prompt: ShareablePrompt;
  createdAt: Date;
}

export function createCompactShareLink(prompt: ShareablePrompt): CompactShareLink {
  return {
    id: generatePromptId(),
    prompt,
    createdAt: new Date(),
  };
}
