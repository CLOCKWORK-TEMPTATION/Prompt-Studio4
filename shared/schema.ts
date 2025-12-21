import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Templates Table
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  sections: jsonb("sections").$type<{
    system: string;
    developer: string;
    user: string;
    context: string;
  }>().notNull(),
  defaultVariables: jsonb("default_variables").$type<Array<{
    id: string;
    name: string;
    value: string;
  }>>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

// Techniques Table
export const techniques = pgTable("techniques", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goodExample: text("good_example").notNull(),
  badExample: text("bad_example").notNull(),
  commonMistakes: jsonb("common_mistakes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  snippet: text("snippet"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTechniqueSchema = createInsertSchema(techniques).omit({
  id: true,
  createdAt: true,
});
export type InsertTechnique = z.infer<typeof insertTechniqueSchema>;
export type Technique = typeof techniques.$inferSelect;

// Prompts Table (stores user prompts/projects)
export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;

// Prompt Versions Table (tracks changes to prompts)
export const promptVersions = pgTable("prompt_versions", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id").references(() => prompts.id, { onDelete: "cascade" }),
  sections: jsonb("sections").$type<{
    system: string;
    developer: string;
    user: string;
    context: string;
  }>().notNull(),
  variables: jsonb("variables").$type<Array<{
    id: string;
    name: string;
    value: string;
  }>>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPromptVersionSchema = createInsertSchema(promptVersions).omit({
  id: true,
  createdAt: true,
});
export type InsertPromptVersion = z.infer<typeof insertPromptVersionSchema>;
export type PromptVersion = typeof promptVersions.$inferSelect;

// Runs Table (execution history)
export const runs = pgTable("runs", {
  id: serial("id").primaryKey(),
  promptVersionId: integer("prompt_version_id").references(() => promptVersions.id, { onDelete: "set null" }),
  sections: jsonb("sections").$type<{
    system: string;
    developer: string;
    user: string;
    context: string;
  }>().notNull(),
  variables: jsonb("variables").$type<Array<{
    id: string;
    name: string;
    value: string;
  }>>().notNull().default(sql`'[]'::jsonb`),
  model: text("model").notNull(),
  temperature: integer("temperature").notNull(), // stored as int (temp * 100)
  maxTokens: integer("max_tokens"),
  output: text("output").notNull(),
  latency: integer("latency"), // milliseconds
  tokenUsage: jsonb("token_usage").$type<{
    prompt: number;
    completion: number;
    total: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRunSchema = createInsertSchema(runs).omit({
  id: true,
  createdAt: true,
});
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Run = typeof runs.$inferSelect;

// Run Ratings Table (user feedback on runs)
export const runRatings = pgTable("run_ratings", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => runs.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating"), // 1-5 stars
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRunRatingSchema = createInsertSchema(runRatings).omit({
  id: true,
  createdAt: true,
});
export type InsertRunRating = z.infer<typeof insertRunRatingSchema>;
export type RunRating = typeof runRatings.$inferSelect;
