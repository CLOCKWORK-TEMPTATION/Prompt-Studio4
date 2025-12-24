import { sql } from "drizzle-orm";
import { storage } from "../storage";

/**
 * Full-Text Search Service
 * Implements PostgreSQL Full Text Search for efficient text searching
 */

export interface SearchOptions {
    limit?: number;
    offset?: number;
    orderBy?: 'relevance' | 'createdAt' | 'updatedAt';
    orderDirection?: 'ASC' | 'DESC';
}

export interface SearchResult {
    id: number;
    name: string;
    description: string;
    sections: any;
    variables: any;
    createdAt: Date;
    updatedAt: Date;
    relevance?: number;
}

/**
 * Full-Text Search Service for Prompt-Studio4
 * Provides efficient search capabilities using PostgreSQL's tsvector
 */
export class FTSSearchService {
    /**
     * Search templates with full-text search
     */
    async searchTemplates(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const {
            limit = 100,
            offset = 0,
            orderBy = 'relevance',
            orderDirection = 'DESC'
        } = options;

        // Build search query using PostgreSQL's full-text search
        const searchQuery = `
      SELECT 
        id,
        name,
        description,
        sections,
        variables,
        created_at as "createdAt",
        updated_at as "updatedAt",
        ts_rank(search_vector, plainto_tsquery('arabic', $1)) as relevance
      FROM templates 
      WHERE search_vector @@ plainto_tsquery('arabic', $1)
      ORDER BY 
        ${orderBy === 'relevance' ? 'relevance' : orderBy} ${orderDirection},
        id DESC
      LIMIT $2 OFFSET $3
    `;

        try {
            const results = await storage.db.execute(sql.raw(searchQuery), [query, limit, offset]);

            return results.map((row: any) => ({
                id: row.id,
                name: row.name,
                description: row.description,
                sections: row.sections,
                variables: row.variables,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                relevance: row.relevance
            }));
        } catch (error) {
            console.error("Template search error:", error);
            throw new Error("Failed to search templates");
        }
    }

    /**
     * Search techniques with full-text search
     */
    async searchTechniques(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const {
            limit = 100,
            offset = 0,
            orderBy = 'relevance',
            orderDirection = 'DESC'
        } = options;

        const searchQuery = `
      SELECT 
        id,
        name,
        description,
        sections,
        variables,
        created_at as "createdAt",
        updated_at as "updatedAt",
        ts_rank(search_vector, plainto_tsquery('arabic', $1)) as relevance
      FROM techniques 
      WHERE search_vector @@ plainto_tsquery('arabic', $1)
      ORDER BY 
        ${orderBy === 'relevance' ? 'relevance' : orderBy} ${orderDirection},
        id DESC
      LIMIT $2 OFFSET $3
    `;

        try {
            const results = await storage.db.execute(sql.raw(searchQuery), [query, limit, offset]);

            return results.map((row: any) => ({
                id: row.id,
                name: row.name,
                description: row.description,
                sections: row.sections,
                variables: row.variables,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                relevance: row.relevance
            }));
        } catch (error) {
            console.error("Technique search error:", error);
            throw new Error("Failed to search techniques");
        }
    }

    /**
     * Search runs with full-text search
     */
    async searchRuns(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const {
            limit = 100,
            offset = 0,
            orderBy = 'relevance',
            orderDirection = 'DESC'
        } = options;

        const searchQuery = `
      SELECT 
        id,
        sections,
        variables,
        model,
        temperature,
        max_tokens as "maxTokens",
        output,
        latency,
        token_usage as "tokenUsage",
        prompt_version_id as "promptVersionId",
        created_at as "createdAt",
        updated_at as "updatedAt",
        ts_rank(search_vector, plainto_tsquery('arabic', $1)) as relevance
      FROM runs 
      WHERE search_vector @@ plainto_tsquery('arabic', $1)
      ORDER BY 
        ${orderBy === 'relevance' ? 'relevance' : orderBy} ${orderDirection},
        id DESC
      LIMIT $2 OFFSET $3
    `;

        try {
            const results = await storage.db.execute(sql.raw(searchQuery), [query, limit, offset]);

            return results.map((row: any) => ({
                id: row.id,
                sections: row.sections,
                variables: row.variables,
                model: row.model,
                temperature: row.temperature,
                maxTokens: row.maxTokens,
                output: row.output,
                latency: row.latency,
                tokenUsage: row.tokenUsage,
                promptVersionId: row.promptVersionId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                relevance: row.relevance
            }));
        } catch (error) {
            console.error("Run search error:", error);
            throw new Error("Failed to search runs");
        }
    }

    /**
     * Advanced search across multiple tables
     */
    async searchAll(query: string, options: SearchOptions = {}): Promise<{
        templates: SearchResult[];
        techniques: SearchResult[];
        runs: SearchResult[];
    }> {
        const [templates, techniques, runs] = await Promise.all([
            this.searchTemplates(query, options),
            this.searchTechniques(query, options),
            this.searchRuns(query, options)
        ]);

        return { templates, techniques, runs };
    }

    /**
     * Get search suggestions based on query
     */
    async getSuggestions(query: string, limit: number = 10): Promise<string[]> {
        const suggestionsQuery = `
      SELECT DISTINCT name as suggestion
      FROM (
        SELECT name FROM templates WHERE name ILIKE $1
        UNION
        SELECT name FROM techniques WHERE name ILIKE $1
      ) suggestions
      ORDER BY suggestion
      LIMIT $2
    `;

        try {
            const results = await storage.db.execute(sql.raw(suggestionsQuery), [`%${query}%`, limit]);
            return results.map((row: any) => row.suggestion);
        } catch (error) {
            console.error("Search suggestions error:", error);
            return [];
        }
    }

    /**
     * Update search vectors for a template
     */
    async updateTemplateSearchVector(templateId: number): Promise<void> {
        const updateQuery = `
      UPDATE templates 
      SET search_vector = to_tsvector('arabic', 
        COALESCE(name, '') || ' ' || 
        COALESCE(description, '') || ' ' ||
        COALESCE(sections->>'system', '') || ' ' ||
        COALESCE(sections->>'developer', '') || ' ' ||
        COALESCE(sections->>'user', '') || ' ' ||
        COALESCE(sections->>'context', '')
      )
      WHERE id = $1
    `;

        try {
            await storage.db.execute(sql.raw(updateQuery), [templateId]);
        } catch (error) {
            console.error("Update template search vector error:", error);
            throw new Error("Failed to update template search vector");
        }
    }

    /**
     * Update search vectors for a technique
     */
    async updateTechniqueSearchVector(techniqueId: number): Promise<void> {
        const updateQuery = `
      UPDATE techniques 
      SET search_vector = to_tsvector('arabic', 
        COALESCE(name, '') || ' ' || 
        COALESCE(description, '') || ' ' ||
        COALESCE(sections->>'system', '') || ' ' ||
        COALESCE(sections->>'developer', '') || ' ' ||
        COALESCE(sections->>'user', '') || ' ' ||
        COALESCE(sections->>'context', '')
      )
      WHERE id = $1
    `;

        try {
            await storage.db.execute(sql.raw(updateQuery), [techniqueId]);
        } catch (error) {
            console.error("Update technique search vector error:", error);
            throw new Error("Failed to update technique search vector");
        }
    }

    /**
     * Update search vectors for a run
     */
    async updateRunSearchVector(runId: number): Promise<void> {
        const updateQuery = `
      UPDATE runs 
      SET search_vector = to_tsvector('arabic', 
        COALESCE(output, '') || ' ' ||
        COALESCE(sections->>'system', '') || ' ' ||
        COALESCE(sections->>'developer', '') || ' ' ||
        COALESCE(sections->>'user', '') || ' ' ||
        COALESCE(sections->>'context', '')
      )
      WHERE id = $1
    `;

        try {
            await storage.db.execute(sql.raw(updateQuery), [runId]);
        } catch (error) {
            console.error("Update run search vector error:", error);
            throw new Error("Failed to update run search vector");
        }
    }

    /**
     * Rebuild search vectors for all records (maintenance task)
     */
    async rebuildAllSearchVectors(): Promise<{ templates: number; techniques: number; runs: number }> {
        try {
            // Update templates
            await storage.db.execute(sql.raw(`
        UPDATE templates 
        SET search_vector = to_tsvector('arabic', 
          COALESCE(name, '') || ' ' || 
          COALESCE(description, '') || ' ' ||
          COALESCE(sections->>'system', '') || ' ' ||
          COALESCE(sections->>'developer', '') || ' ' ||
          COALESCE(sections->>'user', '') || ' ' ||
          COALESCE(sections->>'context', '')
        )
      `));

            // Update techniques
            await storage.db.execute(sql.raw(`
        UPDATE techniques 
        SET search_vector = to_tsvector('arabic', 
          COALESCE(name, '') || ' ' || 
          COALESCE(description, '') || ' ' ||
          COALESCE(sections->>'system', '') || ' ' ||
          COALESCE(sections->>'developer', '') || ' ' ||
          COALESCE(sections->>'user', '') || ' ' ||
          COALESCE(sections->>'context', '')
        )
      `));

            // Update runs
            await storage.db.execute(sql.raw(`
        UPDATE runs 
        SET search_vector = to_tsvector('arabic', 
          COALESCE(output, '') || ' ' ||
          COALESCE(sections->>'system', '') || ' ' ||
          COALESCE(sections->>'developer', '') || ' ' ||
          COALESCE(sections->>'user', '') || ' ' ||
          COALESCE(sections->>'context', '')
        )
      `));

            // Get counts
            const templateCount = await storage.db.execute(sql.raw('SELECT COUNT(*) as count FROM templates'));
            const techniqueCount = await storage.db.execute(sql.raw('SELECT COUNT(*) as count FROM techniques'));
            const runCount = await storage.db.execute(sql.raw('SELECT COUNT(*) as count FROM runs'));

            return {
                templates: templateCount[0]?.count || 0,
                techniques: techniqueCount[0]?.count || 0,
                runs: runCount[0]?.count || 0
            };
        } catch (error) {
            console.error("Rebuild search vectors error:", error);
            throw new Error("Failed to rebuild search vectors");
        }
    }

    /**
     * Get search statistics
     */
    async getSearchStats(): Promise<{
        totalTemplates: number;
        totalTechniques: number;
        totalRuns: number;
        templatesWithSearchVector: number;
        techniquesWithSearchVector: number;
        runsWithSearchVector: number;
    }> {
        try {
            const [templateStats, techniqueStats, runStats] = await Promise.all([
                storage.db.execute(sql.raw(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as with_vector
          FROM templates
        `)),
                storage.db.execute(sql.raw(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as with_vector
          FROM techniques
        `)),
                storage.db.execute(sql.raw(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as with_vector
          FROM runs
        `))
            ]);

            return {
                totalTemplates: templateStats[0]?.total || 0,
                totalTechniques: techniqueStats[0]?.total || 0,
                totalRuns: runStats[0]?.total || 0,
                templatesWithSearchVector: templateStats[0]?.with_vector || 0,
                techniquesWithSearchVector: techniqueStats[0]?.with_vector || 0,
                runsWithSearchVector: runStats[0]?.with_vector || 0
            };
        } catch (error) {
            console.error("Get search stats error:", error);
            throw new Error("Failed to get search statistics");
        }
    }
}

// Export singleton instance
export const ftsSearchService = new FTSSearchService();