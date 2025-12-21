import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { llmProvider } from "./llm-provider";
import { z } from "zod";
import { insertTemplateSchema, insertTechniqueSchema, insertRunRatingSchema } from "@shared/schema";

// Helper to substitute variables in text
function substituteVariables(
  text: string,
  variables: Array<{ id: string; name: string; value: string }>
): string {
  let result = text;
  for (const variable of variables) {
    const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, "g");
    result = result.replace(regex, variable.value);
  }
  return result;
}

// Validation schemas for AI endpoints
const runSchema = z.object({
  sections: z.object({
    system: z.string(),
    developer: z.string(),
    user: z.string(),
    context: z.string(),
  }),
  variables: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      value: z.string(),
    })
  ),
  model: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().optional(),
  promptVersionId: z.number().optional().nullable(),
});

const critiqueSchema = z.object({
  sections: z.object({
    system: z.string(),
    developer: z.string(),
    user: z.string(),
    context: z.string(),
  }),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Templates CRUD
  app.get("/api/templates", async (req, res) => {
    try {
      const { search } = req.query;
      const templates = search
        ? await storage.searchTemplates(search as string)
        : await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getTemplateById(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validated = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(validated);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertTemplateSchema.partial().parse(req.body);
      const template = await storage.updateTemplate(id, validated);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTemplate(id);
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Techniques CRUD
  app.get("/api/techniques", async (req, res) => {
    try {
      const techniques = await storage.getAllTechniques();
      res.json(techniques);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch techniques" });
    }
  });

  app.get("/api/techniques/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const technique = await storage.getTechniqueById(id);
      if (!technique) {
        return res.status(404).json({ error: "Technique not found" });
      }
      res.json(technique);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch technique" });
    }
  });

  app.post("/api/techniques", async (req, res) => {
    try {
      const validated = insertTechniqueSchema.parse(req.body);
      const technique = await storage.createTechnique(validated);
      res.status(201).json(technique);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create technique" });
    }
  });

  app.put("/api/techniques/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertTechniqueSchema.partial().parse(req.body);
      const technique = await storage.updateTechnique(id, validated);
      if (!technique) {
        return res.status(404).json({ error: "Technique not found" });
      }
      res.json(technique);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update technique" });
    }
  });

  app.delete("/api/techniques/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTechnique(id);
      if (!success) {
        return res.status(404).json({ error: "Technique not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete technique" });
    }
  });

  // Runs
  app.get("/api/runs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const runs = await storage.getAllRuns(limit);
      res.json(runs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch runs" });
    }
  });

  app.get("/api/runs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const run = await storage.getRunById(id);
      if (!run) {
        return res.status(404).json({ error: "Run not found" });
      }
      res.json(run);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch run" });
    }
  });

  // Run Ratings
  app.get("/api/runs/:runId/rating", async (req, res) => {
    try {
      const runId = parseInt(req.params.runId);
      const rating = await storage.getRatingByRunId(runId);
      res.json(rating || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rating" });
    }
  });

  app.post("/api/runs/:runId/rating", async (req, res) => {
    try {
      const runId = parseInt(req.params.runId);
      const validated = insertRunRatingSchema.parse({ ...req.body, runId });
      const rating = await storage.createRunRating(validated);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create rating" });
    }
  });

  app.put("/api/runs/:runId/rating/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertRunRatingSchema.partial().parse(req.body);
      const rating = await storage.updateRunRating(id, validated);
      if (!rating) {
        return res.status(404).json({ error: "Rating not found" });
      }
      res.json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update rating" });
    }
  });

  // AI Endpoints
  app.post("/api/ai/run", async (req, res) => {
    try {
      const validated = runSchema.parse(req.body);

      // Substitute variables in all sections
      const processedSections = {
        system: substituteVariables(validated.sections.system, validated.variables),
        developer: substituteVariables(validated.sections.developer, validated.variables),
        user: substituteVariables(validated.sections.user, validated.variables),
        context: substituteVariables(validated.sections.context, validated.variables),
      };

      // Build messages array for LLM
      const messages = [];
      if (processedSections.system.trim()) {
        messages.push({ role: "system" as const, content: processedSections.system });
      }
      if (processedSections.developer.trim()) {
        messages.push({ role: "developer" as const, content: processedSections.developer });
      }
      if (processedSections.context.trim()) {
        messages.push({
          role: "system" as const,
          content: `Context: ${processedSections.context}`,
        });
      }
      if (processedSections.user.trim()) {
        messages.push({ role: "user" as const, content: processedSections.user });
      }

      // Call LLM
      const result = await llmProvider.complete({
        model: validated.model,
        messages,
        temperature: validated.temperature,
        max_tokens: validated.maxTokens,
      });

      // Save run to database
      const run = await storage.createRun({
        sections: validated.sections as any,
        variables: validated.variables as any,
        model: validated.model,
        temperature: Math.round(validated.temperature * 100), // store as int
        maxTokens: validated.maxTokens,
        output: result.output,
        latency: result.latency,
        tokenUsage: result.tokenUsage as any,
        promptVersionId: validated.promptVersionId,
      });

      res.json({
        runId: run.id,
        output: result.output,
        latency: result.latency,
        tokenUsage: result.tokenUsage,
      });
    } catch (error) {
      console.error("Run error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error && error.message.includes("API error")) {
        return res.status(502).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to run prompt" });
    }
  });

  app.post("/api/ai/critique", async (req, res) => {
    try {
      const validated = critiqueSchema.parse(req.body);

      const result = await llmProvider.critique(validated.sections);

      res.json(result);
    } catch (error) {
      console.error("Critique error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error && error.message.includes("API error")) {
        return res.status(502).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to critique prompt" });
    }
  });

  return httpServer;
}
