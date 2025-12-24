import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertRunRatingSchema } from "@shared/schema";
import { z } from "zod";
import { ftsSearchService } from "../services/FTSSearchService";
import { queueService } from "../services/QueueService";

/**
 * Run Controller
 * Handles CRUD operations for runs with proper validation and error handling
 */

export class RunController {
    /**
     * Get all runs with optional search
     */
    static async getAllRuns(req: Request, res: Response): Promise<void> {
        try {
            const { limit = "100", offset = "0" } = req.query;

            const runs = await storage.getAllRuns(parseInt(limit as string));

            res.json({
                success: true,
                data: runs,
                count: runs.length
            });
        } catch (error) {
            console.error("Get runs error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch runs"
            });
        }
    }

    /**
     * Get run by ID
     */
    static async getRunById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid run ID"
                });
                return;
            }

            const run = await storage.getRunById(id);

            if (!run) {
                res.status(404).json({
                    success: false,
                    error: "Run not found"
                });
                return;
            }

            res.json({
                success: true,
                data: run
            });
        } catch (error) {
            console.error("Get run error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch run"
            });
        }
    }

    /**
     * Search runs with full-text search
     */
    static async searchRuns(req: Request, res: Response): Promise<void> {
        try {
            const { q: query, limit = "100", offset = "0", orderBy = "relevance", orderDirection = "DESC" } = req.query;

            if (!query || typeof query !== "string") {
                res.status(400).json({
                    success: false,
                    error: "Search query is required"
                });
                return;
            }

            const runs = await ftsSearchService.searchRuns(query, {
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                orderBy: orderBy as any,
                orderDirection: orderDirection as any
            });

            res.json({
                success: true,
                data: runs,
                count: runs.length,
                query
            });
        } catch (error) {
            console.error("Search runs error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to search runs"
            });
        }
    }

    /**
     * Get run rating
     */
    static async getRunRating(req: Request, res: Response): Promise<void> {
        try {
            const runId = parseInt(req.params.runId);

            if (isNaN(runId)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid run ID"
                });
                return;
            }

            const rating = await storage.getRatingByRunId(runId);

            res.json({
                success: true,
                data: rating || null
            });
        } catch (error) {
            console.error("Get run rating error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch run rating"
            });
        }
    }

    /**
     * Create run rating
     */
    static async createRunRating(req: Request, res: Response): Promise<void> {
        try {
            const runId = parseInt(req.params.runId);

            if (isNaN(runId)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid run ID"
                });
                return;
            }

            const validated = insertRunRatingSchema.parse({ ...req.body, runId });

            const rating = await storage.createRunRating(validated);

            res.status(201).json({
                success: true,
                data: rating,
                message: "Run rating created successfully"
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: error.errors
                });
                return;
            }

            console.error("Create run rating error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create run rating"
            });
        }
    }

    /**
     * Update run rating
     */
    static async updateRunRating(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);
            const runId = parseInt(req.params.runId);

            if (isNaN(id) || isNaN(runId)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid rating or run ID"
                });
                return;
            }

            const validated = insertRunRatingSchema.partial().parse(req.body);

            const rating = await storage.updateRunRating(id, validated);

            if (!rating) {
                res.status(404).json({
                    success: false,
                    error: "Rating not found"
                });
                return;
            }

            res.json({
                success: true,
                data: rating,
                message: "Run rating updated successfully"
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: error.errors
                });
                return;
            }

            console.error("Update run rating error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update run rating"
            });
        }
    }

    /**
     * Get run statistics
     */
    static async getRunStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await ftsSearchService.getSearchStats();

            res.json({
                success: true,
                data: {
                    total: stats.totalRuns,
                    withSearchVector: stats.runsWithSearchVector,
                    searchCoverage: stats.totalRuns > 0
                        ? Math.round((stats.runsWithSearchVector / stats.totalRuns) * 100)
                        : 0
                }
            });
        } catch (error) {
            console.error("Get run stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get run statistics"
            });
        }
    }

    /**
     * Get queue statistics
     */
    static async getQueueStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await queueService.getQueueStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error("Get queue stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get queue statistics"
            });
        }
    }

    /**
     * Pause all queues
     */
    static async pauseQueues(req: Request, res: Response): Promise<void> {
        try {
            await queueService.pauseAll();

            res.json({
                success: true,
                message: "All queues paused successfully"
            });
        } catch (error) {
            console.error("Pause queues error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to pause queues"
            });
        }
    }

    /**
     * Resume all queues
     */
    static async resumeQueues(req: Request, res: Response): Promise<void> {
        try {
            await queueService.resumeAll();

            res.json({
                success: true,
                message: "All queues resumed successfully"
            });
        } catch (error) {
            console.error("Resume queues error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to resume queues"
            });
        }
    }

    /**
     * Clean all queues
     */
    static async cleanQueues(req: Request, res: Response): Promise<void> {
        try {
            await queueService.cleanAll();

            res.json({
                success: true,
                message: "All queues cleaned successfully"
            });
        } catch (error) {
            console.error("Clean queues error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to clean queues"
            });
        }
    }
}