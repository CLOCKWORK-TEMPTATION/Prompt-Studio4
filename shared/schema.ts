
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, primaryKey, unique, real, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// ============================================================
// EXISTING TABLES (Preserved)
// ============================================================

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
}, (table) => ({
  nameIdx: index("idx_templates_name").on(table.name),
  categoryIdx: index("idx_templates_category").on(table.category),
  createdIdx: index("idx_templates_created_at").on(table.createdAt),
}));

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
}, (table) => ({
  titleIdx: index("idx_techniques_title").on(table.title),
  createdIdx: index("idx_techniques_created_at").on(table.createdAt),
}));

export const insertTechniqueSchema = createInsertSchema(techniques).omit({
  id: true,
  createdAt: true,
});
export type InsertTechnique = z.infer<typeof insertTechniqueSchema>;
export type Technique = typeof techniques.$inferSelect;

// ============================================================
// MERGED & NEW TABLES (PromptStudio Integration)
// ============================================================

// Tenants
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").unique(),
  apiKey: text("api_key").unique().notNull(),
  config: jsonb("config").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("idx_tenants_name").on(table.name),
  activeIdx: index("idx_tenants_is_active").on(table.isActive),
  updatedIdx: index("idx_tenants_updated_at").on(table.updatedAt),
}));

// Users
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  color: text("color").default("#3B82F6"),
  tenantId: text("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_users_tenant_id").on(table.tenantId),
  nameIdx: index("idx_users_name").on(table.name),
  updatedIdx: index("idx_users_updated_at").on(table.updatedAt),
}));

// Prompts Table (Merged - Upgraded to UUID support while keeping compatibility concepts)
// Note: We use text("id") for UUID compatibility across the new system.
export const prompts = pgTable("prompts", {
  id: text("id").primaryKey(), // Changed from serial to text/uuid for compatibility
  name: text("name").notNull(),
  description: text("description"),
  tenantId: text("tenant_id").references(() => tenants.id),
  ownerId: text("owner_id").references(() => users.id),
  activeVersionId: text("active_version_id"), // Circular reference handled in code or via separate update
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_prompts_tenant_id").on(table.tenantId),
  ownerIdx: index("idx_prompts_owner_id").on(table.ownerId),
  nameIdx: index("idx_prompts_name").on(table.name),
  updatedIdx: index("idx_prompts_updated_at").on(table.updatedAt),
}));

// Prompt Versions (Merged)
export const promptVersions = pgTable("prompt_versions", {
  id: text("id").primaryKey(), // Changed from serial
  promptId: text("prompt_id").references(() => prompts.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  content: text("content"), // For simple prompts
  // Structured prompts
  sections: jsonb("sections").$type<{
    system: string;
    developer: string;
    user: string;
    context: string;
  }>(),
  variables: jsonb("variables").$type<Array<{
    id: string;
    name: string;
    value: string;
  }>>().default(sql`'[]'::jsonb`),
  // Analytics
  performanceMetrics: jsonb("performance_metrics").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  promptIdx: index("idx_prompt_versions_prompt_id").on(table.promptId),
  versionIdx: index("idx_prompt_versions_version").on(table.version),
  createdIdx: index("idx_prompt_versions_created_at").on(table.createdAt),
}));

// Collaboration Sessions
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").default(""),
  isActive: boolean("is_active").default(true),
  shareToken: text("share_token").unique().notNull(),
  tenantId: text("tenant_id").references(() => tenants.id),
  ownerId: text("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_collab_sessions_tenant_id").on(table.tenantId),
  ownerIdx: index("idx_collab_sessions_owner_id").on(table.ownerId),
  activeIdx: index("idx_collab_sessions_is_active").on(table.isActive),
  updatedIdx: index("idx_collab_sessions_updated_at").on(table.updatedAt),
  shareTokenIdx: uniqueIndex("ux_collab_sessions_share_token").on(table.shareToken),
}));

// Session Members
export const sessionMembers = pgTable("session_members", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").references(() => collaborationSessions.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("VIEWER"), // OWNER, EDITOR, VIEWER
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("idx_session_members_session_id").on(table.sessionId),
  userIdx: index("idx_session_members_user_id").on(table.userId),
}));

// Edit History
export const editHistory = pgTable("edit_history", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").references(() => collaborationSessions.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  operation: jsonb("operation").notNull(),
  contentBefore: text("content_before"),
  contentAfter: text("content_after"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("idx_edit_history_session_id").on(table.sessionId),
  createdIdx: index("idx_edit_history_created_at").on(table.createdAt),
}));

// Semantic Cache
export const semanticCache = pgTable("semantic_cache", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  promptHash: text("prompt_hash").notNull(),
  embedding: jsonb("embedding").notNull(), // Vector stored as JSON array for now
  response: text("response").notNull(),
  model: text("model").notNull(),
  hitCount: integer("hit_count").default(0),
  tokensSaved: integer("tokens_saved").default(0),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => ({
  hashIdx: index("idx_semantic_cache_prompt_hash").on(table.promptHash),
  expiresIdx: index("idx_semantic_cache_expires_at").on(table.expiresAt),
  lastAccessIdx: index("idx_semantic_cache_last_accessed_at").on(table.lastAccessedAt),
  modelIdx: index("idx_semantic_cache_model").on(table.model),
  userIdx: index("idx_semantic_cache_user_id").on(table.userId),
}));

export const cacheTags = pgTable("cache_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cacheId: text("cache_id").references(() => semanticCache.id, { onDelete: "cascade" }).notNull(),
}, (table) => ({
  nameIdx: index("idx_cache_tags_name").on(table.name),
  cacheIdx: index("idx_cache_tags_cache_id").on(table.cacheId),
}));

export const cacheStatistics = pgTable("cache_statistics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().unique(),
  totalHits: integer("total_hits").default(0).notNull(),
  totalMisses: integer("total_misses").default(0).notNull(),
  tokensSaved: integer("tokens_saved").default(0).notNull(),
  costSaved: doublePrecision("cost_saved").default(0).notNull(),
}, (table) => ({
  dateIdx: uniqueIndex("ux_cache_statistics_date").on(table.date),
}));

export const cacheConfig = pgTable("cache_config", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").default(true).notNull(),
  similarityThreshold: doublePrecision("similarity_threshold").default(0.85).notNull(),
  defaultTTLSeconds: integer("default_ttl_seconds").default(3600).notNull(),
  maxCacheSize: integer("max_cache_size").default(1000).notNull(),
  invalidationRules: jsonb("invalidation_rules").$type<any[]>().default(sql`'[]'::jsonb`),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Marketplace Prompts
export const marketplacePrompts = pgTable("marketplace_prompts", {
  id: text("id").primaryKey(),
  authorId: text("author_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`),
  isFeatured: boolean("is_featured").default(false),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  authorIdx: index("idx_marketplace_prompts_author_id").on(table.authorId),
  categoryIdx: index("idx_marketplace_prompts_category").on(table.category),
  statusIdx: index("idx_marketplace_prompts_status").on(table.status),
  createdIdx: index("idx_marketplace_prompts_created_at").on(table.createdAt),
}));

// Runs (Execution History) - Updated to link to new promptVersions
export const runs = pgTable("runs", {
  id: serial("id").primaryKey(), // Keeping serial for legacy compatibility or change to text if needed
  promptVersionId: text("prompt_version_id").references(() => promptVersions.id, { onDelete: "set null" }),
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
  temperature: integer("temperature").notNull(),
  maxTokens: integer("max_tokens"),
  output: text("output").notNull(),
  latency: integer("latency"),
  tokenUsage: jsonb("token_usage"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  versionIdx: index("idx_runs_prompt_version_id").on(table.promptVersionId),
  modelIdx: index("idx_runs_model").on(table.model),
  createdIdx: index("idx_runs_created_at").on(table.createdAt),
}));

// Zod Schemas
export const insertTenantSchema = createInsertSchema(tenants);
export const insertUserSchema = createInsertSchema(users);
export const insertPromptSchema = createInsertSchema(prompts);
export const insertPromptVersionSchema = createInsertSchema(promptVersions);
export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions);
export const insertSemanticCacheSchema = createInsertSchema(semanticCache);
export const insertMarketplacePromptSchema = createInsertSchema(marketplacePrompts);
export const insertRunSchema = createInsertSchema(runs);

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type InsertPromptVersion = z.infer<typeof insertPromptVersionSchema>;
export type InsertCollaborationSession = z.infer<typeof insertCollaborationSessionSchema>;
export type InsertSemanticCache = z.infer<typeof insertSemanticCacheSchema>;
export type InsertRun = z.infer<typeof insertRunSchema>;

// Types
export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type PromptVersion = typeof promptVersions.$inferSelect;
export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type SemanticCache = typeof semanticCache.$inferSelect;
export type MarketplacePrompt = typeof marketplacePrompts.$inferSelect;
export type Run = typeof runs.$inferSelect;

// Run Ratings (Feedback)
export const runRatings = pgTable("run_ratings", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => runs.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating"),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  runIdx: index("idx_run_ratings_run_id").on(table.runId),
  createdIdx: index("idx_run_ratings_created_at").on(table.createdAt),
}));

// Agent Compose Runs (Tri-Agent Composer)
export const agentComposeRuns = pgTable("agent_compose_runs", {
  id: serial("id").primaryKey(),
  status: text("status").default("pending").notNull(),
  stage: text("stage").default("agent1").notNull(),
  progress: integer("progress").default(0).notNull(),
  inputRaw: text("input_raw").notNull(),
  inputGoal: text("input_goal"),
  inputConstraints: text("input_constraints"),
  inputOutputFormat: text("input_output_format"),
  modelConfig: jsonb("model_config").$type<{
    model: string;
    temperature: number;
    maxTokens?: number;
  }>().notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
}, (table) => ({
  statusIdx: index("idx_agent_compose_runs_status").on(table.status),
  stageIdx: index("idx_agent_compose_runs_stage").on(table.stage),
  createdIdx: index("idx_agent_compose_runs_created_at").on(table.createdAt),
  finishedIdx: index("idx_agent_compose_runs_finished_at").on(table.finishedAt),
}));

// Agent Compose Results
export const agentComposeResults = pgTable("agent_compose_results", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => agentComposeRuns.id, { onDelete: "cascade" }).notNull().unique(),
  agent1Json: jsonb("agent1_json").$type<{
    system: string;
    developer: string;
    user: string;
    context: string;
    variables: Array<{ id: string; name: string; value: string }>;
    modelHints?: string;
  }>(),
  agent2Json: jsonb("agent2_json").$type<{
    criticisms: string[];
    alternativePrompt: {
      system: string;
      developer: string;
      user: string;
      context: string;
    };
    fixes: string[];
  }>(),
  agent3Json: jsonb("agent3_json").$type<{
    finalPrompt: {
      system: string;
      developer: string;
      user: string;
      context: string;
    };
    finalVariables: Array<{ id: string; name: string; value: string }>;
    decisionNotes: string[];
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRunRatingSchema = createInsertSchema(runRatings);
export const insertAgentComposeRunSchema = createInsertSchema(agentComposeRuns);
export const insertAgentComposeResultSchema = createInsertSchema(agentComposeResults);

export type InsertRunRating = z.infer<typeof insertRunRatingSchema>;
export type InsertAgentComposeRun = z.infer<typeof insertAgentComposeRunSchema>;
export type InsertAgentComposeResult = z.infer<typeof insertAgentComposeResultSchema>;

export type RunRating = typeof runRatings.$inferSelect;
export type AgentComposeRun = typeof agentComposeRuns.$inferSelect;
export type AgentComposeResult = typeof agentComposeResults.$inferSelect;

// Scenarios
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: jsonb("content").notNull(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").notNull().default(0),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    createdIdx: index("idx_scenarios_created_at").on(table.createdAt),
}));

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  progress: true,
  result: true
});

export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;
