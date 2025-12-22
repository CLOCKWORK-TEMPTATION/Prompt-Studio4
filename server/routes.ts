import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { llmProvider } from "./llm-provider";
import { runAgent1, runAgent2, runAgent3 } from "./agents";
import { z } from "zod";
import { insertTemplateSchema, insertTechniqueSchema, insertRunRatingSchema } from "@shared/schema";
import { registerSDKRoutes } from "./routes/sdk";
import { semanticCacheService } from "./services/SemanticCacheService";
import { cacheCleanupScheduler } from "./services/CacheCleanupScheduler";
import { SDKGenerator } from "./lib/sdk-generator/advanced-index";
import { runtimeTester } from "./lib/sdk-generator/__tests__/runtime-tester";
import crypto from "crypto";
import { aiRateLimiter, authRateLimiter, uploadRateLimiter } from "./middleware/security";

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
  promptVersionId: z.string().optional().nullable(),
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
  // Health check endpoint for containers and monitoring
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, status: "healthy", timestamp: new Date().toISOString() });
  });

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
  app.get("/api/techniques", async (_req, res) => {
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

  // AI Endpoints (with rate limiting)
  app.post("/api/ai/run", aiRateLimiter, async (req, res) => {
    try {
      const validated = runSchema.parse(req.body);

      // Get session API key (if any)
      const sessionKey = req.session?.groqApiKey;

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
      }, sessionKey);

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
      console.error("Run error:", error instanceof Error ? error.message : "Unknown");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error && error.message === "NO_API_KEY") {
        return res.status(503).json({
          error: "مرحلة التشغيل اختيارية. للتجربة، يرجى إدخال مفتاح API الخاص بك في المرحلة 5",
          code: "NO_API_KEY"
        });
      }
      if (error instanceof Error && error.message.includes("API error")) {
        return res.status(502).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to run prompt" });
    }
  });

  app.post("/api/ai/critique", aiRateLimiter, async (req, res) => {
    try {
      const validated = critiqueSchema.parse(req.body);

      // Get session API key (if any)
      const sessionKey = req.session?.groqApiKey;

      const result = await llmProvider.critique(validated.sections, sessionKey);

      res.json(result);
    } catch (error) {
      console.error("Critique error:", error instanceof Error ? error.message : "Unknown");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error && error.message === "NO_API_KEY") {
        return res.status(503).json({
          error: "للتجربة، يرجى إدخال مفتاح API الخاص بك في المرحلة 5",
          code: "NO_API_KEY"
        });
      }
      if (error instanceof Error && error.message.includes("API error")) {
        return res.status(502).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to critique prompt" });
    }
  });

  // Agent Compose Endpoints
  const composeSchema = z.object({
    rawIdea: z.string().min(1),
    goal: z.string().optional(),
    constraints: z.string().optional(),
    outputFormat: z.string().optional(),
    modelConfig: z.object({
      model: z.string(),
      temperature: z.number(),
      maxTokens: z.number().optional(),
    }).optional(),
  });

  app.post("/api/agents/compose", aiRateLimiter, async (req, res) => {
    try {
      const validated = composeSchema.parse(req.body);

      // Create a run record
      const run = await storage.createAgentComposeRun({
        status: "pending",
        stage: "agent1",
        progress: 0,
        inputRaw: validated.rawIdea,
        inputGoal: validated.goal,
        inputConstraints: validated.constraints,
        inputOutputFormat: validated.outputFormat,
        modelConfig: validated.modelConfig || {
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
        } as any,
      });

      // Start async processing (non-blocking)
      processAgentCompose(run.id, validated).catch((error) => {
        console.error("Agent compose failed:", error);
        storage.updateAgentComposeRun(run.id, {
          status: "failed",
          error: error.message,
        });
      });

      res.json({ runId: run.id });
    } catch (error) {
      console.error("Compose error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to start compose" });
    }
  });

  app.get("/api/agents/compose/:runId", async (req, res) => {
    try {
      const runId = parseInt(req.params.runId);
      const run = await storage.getAgentComposeRunById(runId);

      if (!run) {
        return res.status(404).json({ error: "Run not found" });
      }

      let result = null;
      if (run.status === "completed") {
        result = await storage.getAgentComposeResultByRunId(runId);
      }

      res.json({
        status: run.status,
        stage: run.stage,
        progress: run.progress,
        error: run.error,
        result: result ? {
          agent1: result.agent1Json,
          agent2: result.agent2Json,
          agent3: result.agent3Json,
        } : null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get compose status" });
    }
  });

  // Session API Key Management (with auth rate limiting)
  app.post("/api/session/api-key", authRateLimiter, (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
        return res.status(400).json({ error: "API key is required" });
      }

      // Store in session (server-side only, not visible to client)
      if (req.session) {
        req.session.groqApiKey = apiKey.trim();
        req.session.save((err: any) => {
          if (err) {
            console.error("Failed to save session:", err?.message || "Unknown error"); // Don't log the key
            return res.status(500).json({ error: "Failed to activate API key" });
          }
          res.json({ success: true, message: "API key activated for this session" });
        });
      } else {
        res.status(500).json({ error: "Session not available" });
      }
    } catch (error) {
      console.error("API key activation error:", error instanceof Error ? error.message : "Unknown");
      res.status(500).json({ error: "Failed to activate API key" });
    }
  });

  app.delete("/api/session/api-key", (req, res) => {
    try {
      if (req.session && req.session.groqApiKey) {
        delete req.session.groqApiKey;
        req.session.save((err: any) => {
          if (err) {
            console.error("Failed to save session:", err?.message || "Unknown error");
            return res.status(500).json({ error: "Failed to clear API key" });
          }
          res.json({ success: true, message: "API key cleared from session" });
        });
      } else {
        res.json({ success: true, message: "No API key in session" });
      }
    } catch (error) {
      console.error("API key clear error:", error instanceof Error ? error.message : "Unknown");
      res.status(500).json({ error: "Failed to clear API key" });
    }
  });

  app.get("/api/session/api-key/status", (req, res) => {
    try {
      const hasSessionKey = !!(req.session && req.session.groqApiKey);
      const hasEnvironmentKey = !!process.env.GROQ_API_KEY;
      res.json({
        hasSessionKey,
        hasEnvironmentKey,
        canRun: hasSessionKey || hasEnvironmentKey,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check API key status" });
    }
  });


  // ============================================================
  // Semantic Cache API
  // ============================================================
  
  // البحث في التخزين المؤقت
  app.post("/api/cache/lookup", async (_req, res) => {
    try {
      const result = await semanticCacheService.lookup(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Cache lookup failed" });
    }
  });

  // حفظ في التخزين المؤقت
  app.post("/api/cache/store", async (_req, res) => {
    try {
      const entry = await semanticCacheService.store(req.body);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Cache store failed" });
    }
  });

  // الحصول على التكوينات
  app.get("/api/cache/config", async (_req, res) => {
    try {
      const config = await semanticCacheService.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get cache config" });
    }
  });

  // تحديث التكوينات
  app.put("/api/cache/config", async (_req, res) => {
    try {
      const config = await semanticCacheService.updateConfig(req.body);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cache config" });
    }
  });

  // الحصول على التحليلات
  app.get("/api/cache/analytics", async (_req, res) => {
    try {
      const analytics = await semanticCacheService.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Cache analytics error:", error);
      res.status(500).json({ error: "Failed to get cache analytics" });
    }
  });

  // إبطال التخزين المؤقت
  app.post("/api/cache/invalidate", async (_req, res) => {
    try {
      const result = await semanticCacheService.invalidate(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Cache invalidation failed" });
    }
  });

  // تنظيف العناصر المنتهية الصلاحية (يدوياً)
  app.post("/api/cache/cleanup", async (_req, res) => {
    try {
      const result = await cacheCleanupScheduler.triggerManualCleanup();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Cache cleanup failed" });
    }
  });

  // الحصول على حالة مُجدول التنظيف
  app.get("/api/cache/cleanup/status", (_req, res) => {
    try {
      const status = cacheCleanupScheduler.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get cleanup status" });
    }
  });

  // تحديث إعدادات مُجدول التنظيف
  app.put("/api/cache/cleanup/config", (req, res) => {
    try {
      const { intervalMinutes, enabled } = req.body;
      cacheCleanupScheduler.updateConfig({ intervalMinutes, enabled });
      res.json({ success: true, config: cacheCleanupScheduler.getStatus() });
    } catch (error) {
      res.status(500).json({ error: "Failed to update cleanup config" });
    }
  });

  // ============================================================
  // SDK Generation Routes
  // ============================================================
  registerSDKRoutes(app);

  // توليد SDK
  app.post("/api/sdk/generate", async (req, res) => {
    try {
      const { promptId, language, options } = req.body;

      if (!promptId || !language) {
        return res.status(400).json({
          error: "Prompt ID and language are required"
        });
      }

      // الحصول على بيانات الموجه من قاعدة البيانات
      const prompt = await storage.getTemplateById(parseInt(promptId));
      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }

      // تحويل بيانات الموجه إلى التنسيق المتوقع
      const promptConfig: any = {
        id: prompt.id.toString(),
        name: prompt.name,
        description: prompt.description || "",
        prompt: prompt.sections.system + "\n\n" + prompt.sections.user,
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stopSequences: [],
        variables: prompt.defaultVariables.map(v => ({
          name: v.name,
          type: "string" as const,
          description: v.name,
          required: true,
        })),
        createdAt: prompt.createdAt,
        updatedAt: prompt.createdAt,
      };

      // توليد SDK
      const sdk = SDKGenerator.generate({
        promptConfig,
        language,
        options,
      });

      res.json(sdk);
    } catch (error) {
      console.error("SDK generation error:", error);
      res.status(500).json({
        error: "Failed to generate SDK",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // اختبار SDK
  app.post("/api/sdk/test", async (req, res) => {
    try {
      const { sdk, promptId } = req.body;

      if (!sdk) {
        return res.status(400).json({ error: "SDK is required" });
      }

      // الحصول على بيانات الموجه للاختبار
      const prompt = await storage.getTemplateById(parseInt(promptId));
      let promptConfig: any = null;

      if (prompt) {
        promptConfig = {
          id: prompt.id.toString(),
          name: prompt.name,
          description: prompt.description || "",
          prompt: prompt.sections.system + "\n\n" + prompt.sections.user,
          model: "gpt-4",
          temperature: 0.7,
          maxTokens: 1000,
          topP: 0.9,
          frequencyPenalty: 0,
          presencePenalty: 0,
          stopSequences: [],
          variables: prompt.defaultVariables.map(v => ({
            name: v.name,
            type: "string" as const,
            description: v.name,
            required: true,
          })),
          createdAt: prompt.createdAt,
          updatedAt: prompt.createdAt,
        };
      }

      // اختبار SDK
      const result = await runtimeTester.testSDK(sdk, promptConfig, {
        timeout: 10000,
        includeCompilation: true,
        includeExecution: true,
      });

      res.json(result);
    } catch (error) {
      console.error("SDK test error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
        executionTime: 0,
      });
    }
  });

  // ============================================================
  // Collaboration API (CRDT & Real-time)
  // ============================================================
  
  // إنشاء جلسة تعاون جديدة
  app.post("/api/collaboration/sessions", async (req, res) => {
    try {
      const { name, description, initialContent } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: "اسم الجلسة مطلوب" });
      }

      const sessionId = crypto.randomUUID();
      
      // إنشاء مستند CRDT للجلسة
      const { crdtManager } = await import("./services/CRDTManager");
      crdtManager.getDocument(sessionId);
      
      if (initialContent) {
        crdtManager.updateDocumentContent(sessionId, initialContent);
      }

      res.status(201).json({
        id: sessionId,
        name: name.trim(),
        description: description || '',
        createdAt: new Date().toISOString(),
        activeConnections: 0
      });
    } catch (error) {
      console.error("خطأ في إنشاء جلسة التعاون:", error);
      res.status(500).json({ error: "فشل في إنشاء جلسة التعاون" });
    }
  });

  // الحصول على معلومات الجلسة
  app.get("/api/collaboration/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { crdtManager } = await import("./services/CRDTManager");
      
      const stats = crdtManager.getSessionStats(sessionId);
      const content = crdtManager.getDocumentContent(sessionId);

      res.json({
        id: sessionId,
        content,
        stats
      });
    } catch (error) {
      console.error("خطأ في الحصول على الجلسة:", error);
      res.status(500).json({ error: "فشل في الحصول على معلومات الجلسة" });
    }
  });

  // الحصول على قائمة الجلسات النشطة
  app.get("/api/collaboration/sessions", async (_req, res) => {
    try {
      const { crdtManager } = await import("./services/CRDTManager");
      const activeSessions = crdtManager.getActiveSessions();
      
      const sessions = activeSessions.map(sessionId => ({
        id: sessionId,
        stats: crdtManager.getSessionStats(sessionId)
      }));

      res.json(sessions);
    } catch (error) {
      console.error("خطأ في الحصول على الجلسات:", error);
      res.status(500).json({ error: "فشل في الحصول على قائمة الجلسات" });
    }
  });

  // ============================================================
  // SDK Generator API
  // ============================================================
  
  // توليد SDK للموجه
  app.post("/api/sdk/generate", async (req, res) => {
    try {
      const { promptId, config } = req.body;
      
      if (!promptId) {
        return res.status(400).json({ error: "معرف الموجه مطلوب" });
      }

      const { sdkGeneratorService } = await import("./services/SDKGeneratorService");
      
      // التحقق من صحة الإعدادات
      sdkGeneratorService.validateConfig(config);
      
      // توليد SDK
      const result = await sdkGeneratorService.generateSDK(promptId, config);
      
      res.json(result);
    } catch (error) {
      console.error("خطأ في توليد SDK:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "فشل في توليد SDK" 
      });
    }
  });

  // الحصول على اللغات المدعومة
  app.get("/api/sdk/languages", async (_req, res) => {
    try {
      const { sdkGeneratorService } = await import("./services/SDKGeneratorService");
      const languages = sdkGeneratorService.getSupportedLanguages();
      
      res.json({ languages });
    } catch (error) {
      res.status(500).json({ error: "فشل في الحصول على اللغات المدعومة" });
    }
  });

  // ============================================================
  // Cloud Deployment API
  // ============================================================
  
  // استيراد مسارات النشر المتقدمة
  const deploymentRoutes = await import("./routes/deployment");
  app.use("/api/deploy", deploymentRoutes.default);

  // نشر موجه على السحابة (للتوافق مع النسخة القديمة)
  app.post("/api/deploy", async (req, res) => {
    try {
      const { promptId, config } = req.body;
      
      if (!promptId) {
        return res.status(400).json({ error: "معرف الموجه مطلوب" });
      }

      const { cloudDeploymentService } = await import("./services/CloudDeploymentService");
      
      // بدء النشر (عملية غير متزامنة)
      const result = await cloudDeploymentService.deployPrompt(promptId, config);
      
      res.json(result);
    } catch (error) {
      console.error("خطأ في النشر:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "فشل في النشر" 
      });
    }
  });

  // الحصول على حالة النشر (للتوافق مع النسخة القديمة)
  app.get("/api/deploy/:deploymentId", async (req, res) => {
    try {
      const { deploymentId } = req.params;
      const { cloudDeploymentService } = await import("./services/CloudDeploymentService");
      
      const status = cloudDeploymentService.getDeploymentStatus(deploymentId);
      
      if (!status) {
        return res.status(404).json({ error: "النشر غير موجود" });
      }

      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "فشل في الحصول على حالة النشر" });
    }
  });

  // الحصول على قائمة جميع النشرات (للتوافق مع النسخة القديمة)
  app.get("/api/deploy", async (_req, res) => {
    try {
      const { cloudDeploymentService } = await import("./services/CloudDeploymentService");
      const deployments = cloudDeploymentService.getAllDeployments();
      
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "فشل في الحصول على قائمة النشرات" });
    }
  });

  // حذف النشر (للتوافق مع النسخة القديمة)
  app.delete("/api/deploy/:deploymentId", async (req, res) => {
    try {
      const { deploymentId } = req.params;
      const { cloudDeploymentService } = await import("./services/CloudDeploymentService");
      
      const success = await cloudDeploymentService.deleteDeployment(deploymentId);
      
      if (!success) {
        return res.status(404).json({ error: "النشر غير موجود" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "فشل في حذف النشر" });
    }
  });

  // الحصول على المنصات المدعومة
  app.get("/api/deploy/platforms", async (_req, res) => {
    try {
      const { cloudDeploymentService } = await import("./services/CloudDeploymentService");
      const platforms = cloudDeploymentService.getSupportedPlatforms();
      
      res.json({ platforms });
    } catch (error) {
      res.status(500).json({ error: "فشل في الحصول على المنصات المدعومة" });
    }
  });

  // ============================================================
  // Large File Upload (Streaming) - with upload rate limiting
  // ============================================================
  // معالجة رفع ملفات كبيرة بدون تحميلها بالكامل في الذاكرة
  app.post("/api/files/upload", uploadRateLimiter, async (req, res) => {
    try {
      // نسمح فقط بـ application/octet-stream للرفع الثنائي
      const ct = (req.headers["content-type"] || "").toString().toLowerCase();
      if (!ct.includes("application/octet-stream")) {
        return res.status(400).json({ error: "نوع المحتوى يجب أن يكون application/octet-stream" });
      }

      const { createWriteStream } = await import("fs");
      const { tmpdir } = await import("os");
      const { join } = await import("path");
      const filename = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}.bin`;
      const tempPath = join(tmpdir(), filename);

      const writeStream = createWriteStream(tempPath);
      let bytesWritten = 0;

      req.on("data", (chunk: Buffer) => {
        bytesWritten += chunk.length;
      });

      req.pipe(writeStream);

      writeStream.on("finish", () => {
        res.status(201).json({
          success: true,
          path: tempPath,
          sizeBytes: bytesWritten,
          message: "تم رفع الملف بنجاح بطريقة streaming دون استهلاك ذاكرة كبيرة",
        });
      });

      writeStream.on("error", (err) => {
        console.error("File upload error:", err);
        res.status(500).json({ error: "فشل في رفع الملف" });
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "فشل في رفع الملف" });
    }
  });

  return httpServer;
}


// Helper function: Process agent compose asynchronously
async function processAgentCompose(
  runId: number,
  input: {
    rawIdea: string;
    goal?: string;
    constraints?: string;
    outputFormat?: string;
    modelConfig?: { model: string; temperature: number; maxTokens?: number };
  }
) {
  try {
    // Update status to running
    await storage.updateAgentComposeRun(runId, {
      status: "running",
      stage: "agent1",
      progress: 10,
    });

    // Agent 1: Convert
    const agent1Output = await runAgent1(
      input.rawIdea,
      input.goal,
      input.constraints,
      input.outputFormat,
      input.modelConfig
    );

    await storage.updateAgentComposeRun(runId, {
      stage: "agent2",
      progress: 40,
    });

    // Agent 2: Critique
    const agent2Output = await runAgent2(
      agent1Output,
      input.rawIdea,
      input.modelConfig
    );

    await storage.updateAgentComposeRun(runId, {
      stage: "agent3",
      progress: 70,
    });

    // Agent 3: Judge
    const agent3Output = await runAgent3(
      agent1Output,
      agent2Output,
      input.rawIdea,
      input.modelConfig
    );

    await storage.updateAgentComposeRun(runId, {
      stage: "done",
      progress: 100,
      status: "completed",
    });

    // Save results
    await storage.createAgentComposeResult({
      runId,
      agent1Json: agent1Output as any,
      agent2Json: agent2Output as any,
      agent3Json: agent3Output as any,
    });
  } catch (error) {
    console.error("Agent compose processing failed:", error);
    await storage.updateAgentComposeRun(runId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
