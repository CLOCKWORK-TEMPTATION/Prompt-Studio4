import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import type {
  Template,
  InsertTemplate,
  Technique,
  InsertTechnique,
  Run,
  InsertRun,
  RunRating,
  InsertRunRating,
  Prompt,
  InsertPrompt,
  PromptVersion,
  InsertPromptVersion,
  AgentComposeRun,
  InsertAgentComposeRun,
  AgentComposeResult,
  InsertAgentComposeResult
} from "@shared/schema";
import { eq, desc, like, or, sql } from "drizzle-orm";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, { schema });

export interface IStorage {
  // Templates
  getAllTemplates(): Promise<Template[]>;
  getTemplateById(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  searchTemplates(query: string): Promise<Template[]>;

  // Techniques
  getAllTechniques(): Promise<Technique[]>;
  getTechniqueById(id: number): Promise<Technique | undefined>;
  createTechnique(technique: InsertTechnique): Promise<Technique>;
  updateTechnique(id: number, technique: Partial<InsertTechnique>): Promise<Technique | undefined>;
  deleteTechnique(id: number): Promise<boolean>;

  // Runs
  getAllRuns(limit?: number): Promise<Run[]>;
  getRunById(id: number): Promise<Run | undefined>;
  createRun(run: InsertRun): Promise<Run>;

  // Run Ratings
  getRatingByRunId(runId: number): Promise<RunRating | undefined>;
  createRunRating(rating: InsertRunRating): Promise<RunRating>;
  updateRunRating(id: number, rating: Partial<InsertRunRating>): Promise<RunRating | undefined>;

  // Prompts & Versions (for future use)
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  createPromptVersion(version: InsertPromptVersion): Promise<PromptVersion>;

  // Agent Compose
  createAgentComposeRun(run: InsertAgentComposeRun): Promise<AgentComposeRun>;
  getAgentComposeRunById(id: number): Promise<AgentComposeRun | undefined>;
  updateAgentComposeRun(id: number, updates: Partial<InsertAgentComposeRun>): Promise<AgentComposeRun | undefined>;
  createAgentComposeResult(result: InsertAgentComposeResult): Promise<AgentComposeResult>;
  getAgentComposeResultByRunId(runId: number): Promise<AgentComposeResult | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Templates
  async getAllTemplates(): Promise<Template[]> {
    return db.select().from(schema.templates).orderBy(desc(schema.templates.createdAt));
  }

  async getTemplateById(id: number): Promise<Template | undefined> {
    const result = await db.select().from(schema.templates).where(eq(schema.templates.id, id));
    return result[0];
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const result = await db.insert(schema.templates).values(template as any).returning();
    return result[0];
  }

  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined> {
    const result = await db
      .update(schema.templates)
      .set(template as any)
      .where(eq(schema.templates.id, id))
      .returning();
    return result[0];
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(schema.templates).where(eq(schema.templates.id, id)).returning();
    return result.length > 0;
  }

  async searchTemplates(query: string): Promise<Template[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    return db
      .select()
      .from(schema.templates)
      .where(
        or(
          sql`LOWER(${schema.templates.name}) LIKE ${lowerQuery}`,
          sql`LOWER(${schema.templates.description}) LIKE ${lowerQuery}`,
          sql`LOWER(${schema.templates.category}) LIKE ${lowerQuery}`
        )
      )
      .orderBy(desc(schema.templates.createdAt));
  }

  // Techniques
  async getAllTechniques(): Promise<Technique[]> {
    return db.select().from(schema.techniques).orderBy(desc(schema.techniques.createdAt));
  }

  async getTechniqueById(id: number): Promise<Technique | undefined> {
    const result = await db.select().from(schema.techniques).where(eq(schema.techniques.id, id));
    return result[0];
  }

  async createTechnique(technique: InsertTechnique): Promise<Technique> {
    const result = await db.insert(schema.techniques).values(technique as any).returning();
    return result[0];
  }

  async updateTechnique(id: number, technique: Partial<InsertTechnique>): Promise<Technique | undefined> {
    const result = await db
      .update(schema.techniques)
      .set(technique as any)
      .where(eq(schema.techniques.id, id))
      .returning();
    return result[0];
  }

  async deleteTechnique(id: number): Promise<boolean> {
    const result = await db.delete(schema.techniques).where(eq(schema.techniques.id, id)).returning();
    return result.length > 0;
  }

  // Runs
  async getAllRuns(limit: number = 100): Promise<Run[]> {
    return db.select().from(schema.runs).orderBy(desc(schema.runs.createdAt)).limit(limit);
  }

  async getRunById(id: number): Promise<Run | undefined> {
    const result = await db.select().from(schema.runs).where(eq(schema.runs.id, id));
    return result[0];
  }

  async createRun(run: InsertRun): Promise<Run> {
    const result = await db.insert(schema.runs).values(run as any).returning();
    return result[0];
  }

  // Run Ratings
  async getRatingByRunId(runId: number): Promise<RunRating | undefined> {
    const result = await db.select().from(schema.runRatings).where(eq(schema.runRatings.runId, runId));
    return result[0];
  }

  async createRunRating(rating: InsertRunRating): Promise<RunRating> {
    const result = await db.insert(schema.runRatings).values(rating as any).returning();
    return result[0];
  }

  async updateRunRating(id: number, rating: Partial<InsertRunRating>): Promise<RunRating | undefined> {
    const result = await db
      .update(schema.runRatings)
      .set(rating as any)
      .where(eq(schema.runRatings.id, id))
      .returning();
    return result[0];
  }

  // Prompts & Versions
  async createPrompt(prompt: InsertPrompt): Promise<Prompt> {
    const result = await db.insert(schema.prompts).values(prompt).returning();
    return result[0];
  }

  async createPromptVersion(version: InsertPromptVersion): Promise<PromptVersion> {
    const result = await db.insert(schema.promptVersions).values(version as any).returning();
    return result[0];
  }

  // Agent Compose
  async createAgentComposeRun(run: InsertAgentComposeRun): Promise<AgentComposeRun> {
    const result = await db.insert(schema.agentComposeRuns).values(run as any).returning();
    return result[0];
  }

  async getAgentComposeRunById(id: number): Promise<AgentComposeRun | undefined> {
    const result = await db.select().from(schema.agentComposeRuns).where(eq(schema.agentComposeRuns.id, id));
    return result[0];
  }

  async updateAgentComposeRun(id: number, updates: Partial<InsertAgentComposeRun>): Promise<AgentComposeRun | undefined> {
    const result = await db
      .update(schema.agentComposeRuns)
      .set(updates as any)
      .where(eq(schema.agentComposeRuns.id, id))
      .returning();
    return result[0];
  }

  async createAgentComposeResult(result: InsertAgentComposeResult): Promise<AgentComposeResult> {
    const dbResult = await db.insert(schema.agentComposeResults).values(result as any).returning();
    return dbResult[0];
  }

  async getAgentComposeResultByRunId(runId: number): Promise<AgentComposeResult | undefined> {
    const result = await db
      .select()
      .from(schema.agentComposeResults)
      .where(eq(schema.agentComposeResults.runId, runId));
    return result[0];
  }
}

export const storage = new DatabaseStorage();
