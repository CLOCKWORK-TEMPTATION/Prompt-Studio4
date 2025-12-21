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

// Helper to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Network error" }));
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    return handleResponse(response);
  },

  update: async (id: number, template: Partial<Omit<Template, "id" | "createdAt">>): Promise<Template> => {
    const response = await fetch(`${API_BASE}/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    return handleResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/templates/${id}`, {
      method: "DELETE",
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(technique),
    });
    return handleResponse(response);
  },

  update: async (id: number, technique: Partial<Omit<Technique, "id" | "createdAt">>): Promise<Technique> => {
    const response = await fetch(`${API_BASE}/techniques/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(technique),
    });
    return handleResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/techniques/${id}`, {
      method: "DELETE",
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rating),
    });
    return handleResponse(response);
  },

  updateRating: async (runId: number, ratingId: number, rating: Partial<Omit<RunRating, "id" | "runId" | "createdAt">>): Promise<RunRating> => {
    const response = await fetch(`${API_BASE}/runs/${runId}/rating/${ratingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rating),
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sections,
        variables,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        promptVersionId,
      }),
    });
    return handleResponse(response);
  },

  critique: async (sections: PromptSections): Promise<CritiqueResult> => {
    const response = await fetch(`${API_BASE}/ai/critique`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections }),
    });
    return handleResponse(response);
  },
};

// Agent Compose API
export const agentComposeApi = {
  start: async (request: import("./types").AgentComposeRequest): Promise<{ runId: number }> => {
    const response = await fetch(`${API_BASE}/agents/compose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return handleResponse(response);
  },

  getStatus: async (runId: number): Promise<import("./types").AgentComposeStatus> => {
    const response = await fetch(`${API_BASE}/agents/compose/${runId}`);
    return handleResponse(response);
  },
};
