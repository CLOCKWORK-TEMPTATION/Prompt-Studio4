import { Queue, Worker, Job, QueueScheduler, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { storage } from "../storage";
import { runAgent1, runAgent2, runAgent3 } from "../agents";
import { llmProvider } from "../llm-provider";

/**
 * Queue Service for Background Task Management
 * Implements reliable task processing with retry logic and error handling
 */

// Redis connection for BullMQ
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

// Queue configuration
const queueConfig = {
    connection,
    defaultJobOptions: {
        removeOnComplete: 100, // Keep successful jobs for 100 runs
        removeOnFail: 50,      // Keep failed jobs for 50 runs
        attempts: 3,           // Retry failed jobs 3 times
        backoff: {
            type: 'exponential',
            delay: 2000          // Start with 2 second delay, then 4s, 8s, etc.
        },
        timeout: 300000        // 5 minute timeout per job
    }
};

// Create queues
export const agentComposeQueue = new Queue("agent-compose", queueConfig);
export const llmQueue = new Queue("llm", queueConfig);
export const cleanupQueue = new Queue("cleanup", queueConfig);

// Queue schedulers
export const agentComposeScheduler = new QueueScheduler("agent-compose", { connection });
export const llmScheduler = new QueueScheduler("llm", { connection });
export const cleanupScheduler = new QueueScheduler("cleanup", { connection });

// Queue events
export const agentComposeEvents = new QueueEvents("agent-compose", { connection });
export const llmEvents = new QueueEvents("llm", { connection });
export const cleanupEvents = new QueueEvents("cleanup", { connection });

/**
 * Agent Compose Worker
 * Processes tri-agent composition tasks
 */
export const agentComposeWorker = new Worker(
    "agent-compose",
    async (job: Job) => {
        const { runId, input } = job.data;

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

            return { success: true, runId };
        } catch (error) {
            console.error(`Agent compose job ${job.id} failed:`, error);

            // Update status to failed
            await storage.updateAgentComposeRun(runId, {
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
            });

            throw error;
        }
    },
    {
        connection,
        concurrency: 5, // Process up to 5 jobs concurrently
        maxStalledCount: 3, // Retry stalled jobs up to 3 times
        stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    }
);

/**
 * LLM Worker
 * Processes LLM requests with rate limiting and retry logic
 */
export const llmWorker = new Worker(
    "llm",
    async (job: Job) => {
        const { runId, sections, variables, model, temperature, maxTokens, promptVersionId } = job.data;

        try {
            // Substitute variables in all sections
            const processedSections = {
                system: substituteVariables(sections.system, variables),
                developer: substituteVariables(sections.developer, variables),
                user: substituteVariables(sections.user, variables),
                context: substituteVariables(sections.context, variables),
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

            // Call LLM with session API key if available
            const sessionKey = job.data.sessionKey;
            const result = await llmProvider.complete({
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
            }, sessionKey);

            // Save run to database
            const run = await storage.createRun({
                sections: sections as any,
                variables: variables as any,
                model,
                temperature: Math.round(temperature * 100), // store as int
                maxTokens,
                output: result.output,
                latency: result.latency,
                tokenUsage: result.tokenUsage as any,
                promptVersionId,
            });

            return {
                success: true,
                runId: run.id,
                output: result.output,
                latency: result.latency,
                tokenUsage: result.tokenUsage,
            };
        } catch (error) {
            console.error(`LLM job ${job.id} failed:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 3, // Limit concurrent LLM requests
        maxStalledCount: 2,
        stalledInterval: 60000,
    }
);

/**
 * Cleanup Worker
 * Handles periodic cleanup tasks
 */
export const cleanupWorker = new Worker(
    "cleanup",
    async (job: Job) => {
        const { task, data } = job.data;

        try {
            switch (task) {
                case "cleanup-agent-runs":
                    return await cleanupAgentRuns(data);
                case "cleanup-expired-sessions":
                    return await cleanupExpiredSessions(data);
                case "cleanup-temp-files":
                    return await cleanupTempFiles(data);
                default:
                    throw new Error(`Unknown cleanup task: ${task}`);
            }
        } catch (error) {
            console.error(`Cleanup job ${job.id} failed:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 1, // Only one cleanup job at a time
    }
);

/**
 * Helper function to substitute variables in text
 */
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

/**
 * Cleanup agent runs older than specified days
 */
async function cleanupAgentRuns(data: { days?: number } = {}): Promise<{ deleted: number }> {
    const days = data.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deleted = await storage.deleteAgentRunsOlderThan(cutoffDate);
    return { deleted };
}

/**
 * Cleanup expired sessions
 */
async function cleanupExpiredSessions(data: { maxAge?: number } = {}): Promise<{ cleaned: number }> {
    const maxAge = data.maxAge || 24 * 60 * 60 * 1000; // 24 hours
    const cutoffDate = new Date(Date.now() - maxAge);

    // This would need to be implemented in the storage layer
    // For now, return a placeholder
    return { cleaned: 0 };
}

/**
 * Cleanup temporary files
 */
async function cleanupTempFiles(data: { path?: string } = {}): Promise<{ cleaned: number }> {
    const fs = await import("fs");
    const path = await import("path");
    const os = await import("os");

    const tempDir = data.path || os.tmpdir();
    let cleaned = 0;

    try {
        const files = await fs.promises.readdir(tempDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const file of files) {
            if (file.startsWith('upload_') || file.endsWith('.tmp')) {
                const filePath = path.join(tempDir, file);
                const stats = await fs.promises.stat(filePath);

                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.promises.unlink(filePath);
                    cleaned++;
                }
            }
        }
    } catch (error) {
        console.error("Temp file cleanup error:", error);
    }

    return { cleaned };
}

/**
 * Queue management utilities
 */
export const queueManager = {
    /**
     * Add agent compose job to queue
     */
    async addAgentComposeJob(runId: number, input: any): Promise<Job> {
        return agentComposeQueue.add("agent-compose", { runId, input }, {
            jobId: `agent-compose-${runId}`
        });
    },

    /**
     * Add LLM job to queue
     */
    async addLLMJob(data: any): Promise<Job> {
        return llmQueue.add("llm", data, {
            jobId: `llm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        });
    },

    /**
     * Add cleanup job to queue
     */
    async addCleanupJob(task: string, data: any): Promise<Job> {
        return cleanupQueue.add("cleanup", { task, data }, {
            jobId: `cleanup-${task}-${Date.now()}`
        });
    },

    /**
     * Get queue statistics
     */
    async getQueueStats(): Promise<{
        agentCompose: { waiting: number; active: number; completed: number; failed: number };
        llm: { waiting: number; active: number; completed: number; failed: number };
        cleanup: { waiting: number; active: number; completed: number; failed: number };
    }> {
        return {
            agentCompose: {
                waiting: await agentComposeQueue.getWaiting(),
                active: await agentComposeQueue.getActive(),
                completed: await agentComposeQueue.getCompleted(),
                failed: await agentComposeQueue.getFailed(),
            },
            llm: {
                waiting: await llmQueue.getWaiting(),
                active: await llmQueue.getActive(),
                completed: await llmQueue.getCompleted(),
                failed: await llmQueue.getFailed(),
            },
            cleanup: {
                waiting: await cleanupQueue.getWaiting(),
                active: await cleanupQueue.getActive(),
                completed: await cleanupQueue.getCompleted(),
                failed: await cleanupQueue.getFailed(),
            }
        };
    },

    /**
     * Pause all queues
     */
    async pauseAll(): Promise<void> {
        await agentComposeQueue.pause();
        await llmQueue.pause();
        await cleanupQueue.pause();
    },

    /**
     * Resume all queues
     */
    async resumeAll(): Promise<void> {
        await agentComposeQueue.resume();
        await llmQueue.resume();
        await cleanupQueue.resume();
    },

    /**
     * Clean all queues
     */
    async cleanAll(): Promise<void> {
        await agentComposeQueue.clean(0, 1000, "completed");
        await agentComposeQueue.clean(0, 1000, "failed");
        await llmQueue.clean(0, 1000, "completed");
        await llmQueue.clean(0, 1000, "failed");
        await cleanupQueue.clean(0, 1000, "completed");
        await cleanupQueue.clean(0, 1000, "failed");
    }
};

// Setup event listeners
agentComposeEvents.on('completed', (job) => {
    console.log(`Agent compose job ${job.jobId} completed`);
});

agentComposeEvents.on('failed', (job, error) => {
    console.error(`Agent compose job ${job?.jobId} failed:`, error.message);
});

llmEvents.on('completed', (job) => {
    console.log(`LLM job ${job.jobId} completed`);
});

llmEvents.on('failed', (job, error) => {
    console.error(`LLM job ${job?.jobId} failed:`, error.message);
});

// Export everything
export const queueService = {
    agentComposeQueue,
    llmQueue,
    cleanupQueue,
    agentComposeWorker,
    llmWorker,
    cleanupWorker,
    queueManager,
    connection
};