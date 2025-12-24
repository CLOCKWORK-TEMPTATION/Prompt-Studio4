
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { queueManager } from "../services/QueueService";
import { ensureAuthenticated } from "../middleware/auth";
import { aiRateLimiter } from "../middleware/security";

const router = Router();

const agentComposeSchema = z.object({
    rawIdea: z.string(),
    goal: z.string().optional(),
    constraints: z.string().optional(),
    outputFormat: z.string().optional(),
    modelConfig: z.object({
        model: z.string(),
        temperature: z.number(),
        maxTokens: z.number().optional()
    }).optional()
});

// Start a new agent composition run
router.post("/compose", ensureAuthenticated, aiRateLimiter, async (req, res) => {
    try {
        // Validate input
        const input = agentComposeSchema.parse(req.body);

        // Create run record
        const run = await storage.createAgentComposeRun({
            stage: "queued",
            status: "running",
            progress: 0
        });

        // Add to queue
        const job = await queueManager.addAgentComposeJob(run.id, input);

        res.json({
            runId: run.id,
            jobId: job.id,
            status: "queued"
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Agent compose error:", error);
        res.status(500).json({ error: "Failed to start agent composition" });
    }
});

// Get status of a run
router.get("/compose/:runId", ensureAuthenticated, async (req, res) => {
    try {
        const runId = parseInt(req.params.runId);
        if (isNaN(runId)) {
            return res.status(400).json({ error: "Invalid run ID" });
        }

        const run = await storage.getAgentComposeRun(runId);
        if (!run) {
            return res.status(404).json({ error: "Run not found" });
        }

        // If completed, get results too
        let result = null;
        if (run.status === "completed") {
            result = await storage.getAgentComposeResult(runId);
        }

        res.json({ run, result });
    } catch (error) {
        console.error("Get run status error:", error);
        res.status(500).json({ error: "Failed to get run status" });
    }
});

export default router;
