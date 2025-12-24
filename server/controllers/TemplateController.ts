import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertTemplateSchema } from "@shared/schema";
import { z } from "zod";
import { ftsSearchService } from "../services/FTSSearchService";

/**
 * Template Controller
 * Handles CRUD operations for templates with proper validation and error handling
 */

export class TemplateController {
    /**
     * Get all templates with optional search
     */
    static async getAllTemplates(req: Request, res: Response): Promise<void> {
        try {
            const { search, limit = "100", offset = "0" } = req.query;

            let templates;

            if (search && typeof search === "string" && search.trim()) {
                // Use full-text search
                templates = await ftsSearchService.searchTemplates(search, {
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string),
                    orderBy: "relevance"
                });
            } else {
                // Get all templates
                templates = await storage.getAllTemplates(parseInt(limit as string));
            }

            res.json({
                success: true,
                data: templates,
                count: templates.length
            });
        } catch (error) {
            console.error("Get templates error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch templates"
            });
        }
    }

    /**
     * Get template by ID
     */
    static async getTemplateById(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid template ID"
                });
                return;
            }

            const template = await storage.getTemplateById(id);

            if (!template) {
                res.status(404).json({
                    success: false,
                    error: "Template not found"
                });
                return;
            }

            res.json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error("Get template error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch template"
            });
        }
    }

    /**
     * Create new template
     */
    static async createTemplate(req: Request, res: Response): Promise<void> {
        try {
            const validated = insertTemplateSchema.parse(req.body);

            // Additional validation for required fields
            if (!validated.name || !validated.sections) {
                res.status(400).json({
                    success: false,
                    error: "Template name and sections are required"
                });
                return;
            }

            const template = await storage.createTemplate(validated);

            // Update search vector
            await ftsSearchService.updateTemplateSearchVector(template.id);

            res.status(201).json({
                success: true,
                data: template,
                message: "Template created successfully"
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

            console.error("Create template error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to create template"
            });
        }
    }

    /**
     * Update template
     */
    static async updateTemplate(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid template ID"
                });
                return;
            }

            const validated = insertTemplateSchema.partial().parse(req.body);

            // Check if template exists
            const existingTemplate = await storage.getTemplateById(id);
            if (!existingTemplate) {
                res.status(404).json({
                    success: false,
                    error: "Template not found"
                });
                return;
            }

            const template = await storage.updateTemplate(id, validated);

            if (!template) {
                res.status(404).json({
                    success: false,
                    error: "Template not found"
                });
                return;
            }

            // Update search vector
            await ftsSearchService.updateTemplateSearchVector(template.id);

            res.json({
                success: true,
                data: template,
                message: "Template updated successfully"
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

            console.error("Update template error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to update template"
            });
        }
    }

    /**
     * Delete template
     */
    static async deleteTemplate(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid template ID"
                });
                return;
            }

            // Check if template exists
            const existingTemplate = await storage.getTemplateById(id);
            if (!existingTemplate) {
                res.status(404).json({
                    success: false,
                    error: "Template not found"
                });
                return;
            }

            const success = await storage.deleteTemplate(id);

            if (!success) {
                res.status(404).json({
                    success: false,
                    error: "Template not found"
                });
                return;
            }

            res.status(204).send();
        } catch (error) {
            console.error("Delete template error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to delete template"
            });
        }
    }

    /**
     * Search templates with advanced options
     */
    static async searchTemplates(req: Request, res: Response): Promise<void> {
        try {
            const { q: query, limit = "100", offset = "0", orderBy = "relevance", orderDirection = "DESC" } = req.query;

            if (!query || typeof query !== "string") {
                res.status(400).json({
                    success: false,
                    error: "Search query is required"
                });
                return;
            }

            const templates = await ftsSearchService.searchTemplates(query, {
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                orderBy: orderBy as any,
                orderDirection: orderDirection as any
            });

            res.json({
                success: true,
                data: templates,
                count: templates.length,
                query
            });
        } catch (error) {
            console.error("Search templates error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to search templates"
            });
        }
    }

    /**
     * Get template suggestions
     */
    static async getTemplateSuggestions(req: Request, res: Response): Promise<void> {
        try {
            const { q: query, limit = "10" } = req.query;

            if (!query || typeof query !== "string") {
                res.status(400).json({
                    success: false,
                    error: "Search query is required"
                });
                return;
            }

            const suggestions = await ftsSearchService.getSuggestions(query, parseInt(limit as string));

            res.json({
                success: true,
                data: suggestions,
                count: suggestions.length,
                query
            });
        } catch (error) {
            console.error("Get template suggestions error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get template suggestions"
            });
        }
    }

    /**
     * Get template statistics
     */
    static async getTemplateStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await ftsSearchService.getSearchStats();

            res.json({
                success: true,
                data: {
                    total: stats.totalTemplates,
                    withSearchVector: stats.templatesWithSearchVector,
                    searchCoverage: stats.totalTemplates > 0
                        ? Math.round((stats.templatesWithSearchVector / stats.totalTemplates) * 100)
                        : 0
                }
            });
        } catch (error) {
            console.error("Get template stats error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to get template statistics"
            });
        }
    }
}