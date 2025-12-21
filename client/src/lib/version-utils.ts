import { PromptSections, PromptVersion, Variable } from "./types";

const VERSION_STORAGE_KEY = "prompt_versions";

/**
 * Save a new version to history
 */
export function saveVersion(
  sections: PromptSections,
  variables: Variable[],
  label?: string,
  parentId?: string
): PromptVersion {
  const version: PromptVersion = {
    id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    sections: { ...sections },
    variables: [...variables],
    timestamp: Date.now(),
    label,
    parentId,
  };
  
  const versions = getVersionHistory();
  versions.unshift(version); // Add to beginning
  
  // Keep only last 50 versions
  const trimmed = versions.slice(0, 50);
  localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(trimmed));
  
  return version;
}

/**
 * Get all version history
 */
export function getVersionHistory(): PromptVersion[] {
  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get a specific version by ID
 */
export function getVersion(id: string): PromptVersion | null {
  const versions = getVersionHistory();
  return versions.find(v => v.id === id) || null;
}

/**
 * Delete a version
 */
export function deleteVersion(id: string): void {
  const versions = getVersionHistory().filter(v => v.id !== id);
  localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions));
}

/**
 * Clear all history
 */
export function clearVersionHistory(): void {
  localStorage.removeItem(VERSION_STORAGE_KEY);
}

/**
 * Compare two versions and return differences
 */
export function compareVersions(v1: PromptVersion, v2: PromptVersion): {
  sectionsChanged: (keyof PromptSections)[];
  variablesChanged: boolean;
} {
  const sectionsChanged: (keyof PromptSections)[] = [];
  
  (Object.keys(v1.sections) as (keyof PromptSections)[]).forEach(key => {
    if (v1.sections[key] !== v2.sections[key]) {
      sectionsChanged.push(key);
    }
  });
  
  const variablesChanged = JSON.stringify(v1.variables) !== JSON.stringify(v2.variables);
  
  return {
    sectionsChanged,
    variablesChanged,
  };
}

/**
 * Format timestamp for display
 */
export function formatVersionTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  
  return date.toLocaleDateString('ar-EG', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
