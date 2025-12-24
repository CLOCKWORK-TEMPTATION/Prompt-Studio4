import {
  CritiqueResult,
  RunResult,
  PromptSections,
  ModelSettings,
  Variable,
  Template,
  Technique,
  Run,
  RunRating,
} from "./types";

const API_BASE = "/api";

// CSRF token management
let csrfToken: string | null = null;

// Get CSRF token from server
async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  
  const response = await fetch(`${API_BASE}/csrf-token`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('فشل في الحصول على CSRF token');
  }
  
  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

// Helper to add CSRF headers
async function getSecureHeaders(additionalHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getCsrfToken();
  return {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
    ...additionalHeaders,
  };
}

// Helper to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Network error" }));
    
    // إذا كان الخطأ متعلق بـ CSRF، نعيد تعيين الـ token
    if (error.code === 'CSRF_INVALID' || error.code === 'CSRF_SESSION_MISSING') {
      csrfToken = null;
    }
    
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

// Templates API
export const templatesApi = {
  getAll: async (search?: string): Promise<Template[]> => {
    const url = search ? `${API_BASE}/templates?search=${encodeURIComponent(search)}` : `${API_BASE}/templates`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getById: async (id: number): Promise<Template> => {
    const response = await fetch(`${API_BASE}/templates/${id}`);
    return handleResponse(response);
  },

  create: async (template: Omit<Template, "id" | "createdAt">): Promise<Template> => {
    const response = await fetch(`${API_BASE}/templates`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(template),
      credentials: "include",
    });
    return handleResponse(response);
  },

  update: async (id: number, template: Partial<Omit<Template, "id" | "createdAt">>): Promise<Template> => {
    const response = await fetch(`${API_BASE}/templates/${id}`, {
      method: "PUT",
      headers: await getSecureHeaders(),
      body: JSON.stringify(template),
      credentials: "include",
    });
    return handleResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/templates/${id}`, {
      method: "DELETE",
      headers: await getSecureHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },
};

// Techniques API
export const techniquesApi = {
  getAll: async (): Promise<Technique[]> => {
    const response = await fetch(`${API_BASE}/techniques`);
    return handleResponse(response);
  },

  getById: async (id: number): Promise<Technique> => {
    const response = await fetch(`${API_BASE}/techniques/${id}`);
    return handleResponse(response);
  },

  create: async (technique: Omit<Technique, "id" | "createdAt">): Promise<Technique> => {
    const response = await fetch(`${API_BASE}/techniques`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(technique),
      credentials: "include",
    });
    return handleResponse(response);
  },

  update: async (id: number, technique: Partial<Omit<Technique, "id" | "createdAt">>): Promise<Technique> => {
    const response = await fetch(`${API_BASE}/techniques/${id}`, {
      method: "PUT",
      headers: await getSecureHeaders(),
      body: JSON.stringify(technique),
      credentials: "include",
    });
    return handleResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/techniques/${id}`, {
      method: "DELETE",
      headers: await getSecureHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },
};

// Runs API
export const runsApi = {
  getAll: async (limit?: number): Promise<Run[]> => {
    const url = limit ? `${API_BASE}/runs?limit=${limit}` : `${API_BASE}/runs`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getById: async (id: number): Promise<Run> => {
    const response = await fetch(`${API_BASE}/runs/${id}`);
    return handleResponse(response);
  },

  getRating: async (runId: number): Promise<RunRating | null> => {
    const response = await fetch(`${API_BASE}/runs/${runId}/rating`);
    return handleResponse(response);
  },

  createRating: async (runId: number, rating: Omit<RunRating, "id" | "runId" | "createdAt">): Promise<RunRating> => {
    const response = await fetch(`${API_BASE}/runs/${runId}/rating`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(rating),
      credentials: "include",
    });
    return handleResponse(response);
  },

  updateRating: async (runId: number, ratingId: number, rating: Partial<Omit<RunRating, "id" | "runId" | "createdAt">>): Promise<RunRating> => {
    const response = await fetch(`${API_BASE}/runs/${runId}/rating/${ratingId}`, {
      method: "PUT",
      headers: await getSecureHeaders(),
      body: JSON.stringify(rating),
      credentials: "include",
    });
    return handleResponse(response);
  },
};

// AI API
export const aiApi = {
  run: async (
    sections: PromptSections,
    variables: Variable[],
    settings: ModelSettings,
    promptVersionId?: number | null
  ): Promise<RunResult> => {
    const response = await fetch(`${API_BASE}/ai/run`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify({
        sections,
        variables,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        promptVersionId,
      }),
      credentials: "include",
    });
    return handleResponse(response);
  },

  critique: async (sections: PromptSections): Promise<CritiqueResult> => {
    const response = await fetch(`${API_BASE}/ai/critique`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify({ sections }),
      credentials: "include",
    });
    return handleResponse(response);
  },
};

// Agent Compose API
export const agentComposeApi = {
  start: async (request: import("./types").AgentComposeRequest): Promise<{ runId: number }> => {
    const response = await fetch(`${API_BASE}/agents/compose`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getStatus: async (runId: number): Promise<import("./types").AgentComposeStatus> => {
    const response = await fetch(`${API_BASE}/agents/compose/${runId}`);
    return handleResponse(response);
  },
};

// Session API Key Management
export const sessionApiKeyApi = {
  activate: async (apiKey: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE}/session/api-key`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify({ apiKey }),
      credentials: "include",
    });
    return handleResponse(response);
  },

  clear: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE}/session/api-key`, {
      method: "DELETE",
      headers: await getSecureHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getStatus: async (): Promise<{ hasSessionKey: boolean; hasEnvironmentKey: boolean; canRun: boolean }> => {
    const response = await fetch(`${API_BASE}/session/api-key/status`, {
      credentials: "include",
    });
    return handleResponse(response);
  },
};
// SDK API
export const sdkApi = {
  generate: async (request: any): Promise<any> => {
    const response = await fetch(`${API_BASE}/sdk/generate`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });
    return handleResponse(response);
  },

  generatePackage: async (request: any): Promise<any> => {
    const response = await fetch(`${API_BASE}/sdk/generate-package`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });
    return handleResponse(response);
  },

  generateAll: async (request: any): Promise<any> => {
    const response = await fetch(`${API_BASE}/sdk/generate-all`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });
    return handleResponse(response);
  },

  download: async (request: any): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/sdk/download`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(request),
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Network error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.blob();
  },

  getLanguages: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/sdk/languages`, {
      credentials: "include",
    });
    return handleResponse(response);
  },
};

// Monitoring API
export const monitoringApi = {
  getCurrentMetrics: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/metrics/current`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  getHistoricalMetrics: async (limit?: number): Promise<any> => {
    const url = limit ? `${API_BASE}/monitoring/metrics/history?limit=${limit}` : `${API_BASE}/monitoring/metrics/history`;
    const response = await fetch(url, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  getHealth: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/health`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  start: async (interval?: number): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/start`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify({ interval }),
      credentials: "include",
    });
    return handleResponse(response);
  },

  stop: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/stop`, {
      method: "POST",
      headers: await getSecureHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getActiveAlerts: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alerts/active`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  getAllAlerts: async (limit?: number): Promise<any> => {
    const url = limit ? `${API_BASE}/monitoring/alerts?limit=${limit}` : `${API_BASE}/monitoring/alerts`;
    const response = await fetch(url, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  resolveAlert: async (alertId: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alerts/${alertId}/resolve`, {
      method: "POST",
      headers: await getSecureHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getAlertRules: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alert-rules`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  addAlertRule: async (rule: any): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alert-rules`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(rule),
      credentials: "include",
    });
    return handleResponse(response);
  },

  updateAlertRule: async (ruleId: string, updates: any): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alert-rules/${ruleId}`, {
      method: "PUT",
      headers: await getSecureHeaders(),
      body: JSON.stringify(updates),
      credentials: "include",
    });
    return handleResponse(response);
  },

  removeAlertRule: async (ruleId: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alert-rules/${ruleId}`, {
      method: "DELETE",
      headers: await getSecureHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getAlertChannels: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alert-channels`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  addAlertChannel: async (channel: any): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alert-channels`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(channel),
      credentials: "include",
    });
    return handleResponse(response);
  },

  updateAlertChannel: async (channelId: string, updates: any): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alert-channels/${channelId}`, {
      method: "PUT",
      headers: await getSecureHeaders(),
      body: JSON.stringify(updates),
      credentials: "include",
    });
    return handleResponse(response);
  },

  removeAlertChannel: async (channelId: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alert-channels/${channelId}`, {
      method: "DELETE",
      headers: await getSecureHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },

  testAlertChannel: async (channelId: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/alert-channels/${channelId}/test`, {
      method: "POST",
      headers: await getSecureHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getNotificationStats: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/notifications/stats`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  cleanupNotifications: async (maxAge?: number): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/notifications/cleanup`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify({ maxAge }),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getReport: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/monitoring/report`, {
      credentials: "include",
    });
    return handleResponse(response);
  },
};

// Settings API
export const settingsApi = {
  getModels: async (): Promise<Array<{ id: string; name: string; provider: string }>> => {
    const response = await fetch(`${API_BASE}/settings/models`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  getSettings: async (): Promise<{
    llm: { baseUrl: string; model: string; hasApiKey: boolean };
    ui: { darkMode: boolean; rtlMode: boolean };
  }> => {
    const response = await fetch(`${API_BASE}/settings`, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  saveSettings: async (settings: {
    llm?: { baseUrl?: string; model?: string; apiKey?: string };
    ui?: { darkMode?: boolean; rtlMode?: boolean };
  }): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify(settings),
      credentials: "include",
    });
    return handleResponse(response);
  },
};

// Prompt Enhancement API
export const promptEnhancementApi = {
  enhance: async (idea: string, customInstructions?: string): Promise<{
    enhanced: string;
    latency: number;
    tokenUsage?: any;
  }> => {
    const response = await fetch(`${API_BASE}/prompts/enhance`, {
      method: "POST",
      headers: await getSecureHeaders(),
      body: JSON.stringify({ idea, customInstructions }),
      credentials: "include",
    });
    return handleResponse(response);
  },
};
