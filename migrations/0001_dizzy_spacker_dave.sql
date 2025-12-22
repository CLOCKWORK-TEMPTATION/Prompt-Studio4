CREATE TABLE "agent_compose_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"agent1_json" jsonb,
	"agent2_json" jsonb,
	"agent3_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_compose_results_run_id_unique" UNIQUE("run_id")
);
--> statement-breakpoint
CREATE TABLE "agent_compose_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stage" text DEFAULT 'agent1' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"input_raw" text NOT NULL,
	"input_goal" text,
	"input_constraints" text,
	"input_output_format" text,
	"model_config" jsonb NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cache_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"similarity_threshold" double precision DEFAULT 0.85 NOT NULL,
	"default_ttl_seconds" integer DEFAULT 3600 NOT NULL,
	"max_cache_size" integer DEFAULT 1000 NOT NULL,
	"invalidation_rules" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cache_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"total_hits" integer DEFAULT 0 NOT NULL,
	"total_misses" integer DEFAULT 0 NOT NULL,
	"tokens_saved" integer DEFAULT 0 NOT NULL,
	"cost_saved" double precision DEFAULT 0 NOT NULL,
	CONSTRAINT "cache_statistics_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "cache_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cache_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edit_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"operation" jsonb NOT NULL,
	"content_before" text,
	"content_after" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer NOT NULL,
	"rating" integer,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_compose_results" ADD CONSTRAINT "agent_compose_results_run_id_agent_compose_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_compose_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cache_tags" ADD CONSTRAINT "cache_tags_cache_id_semantic_cache_id_fk" FOREIGN KEY ("cache_id") REFERENCES "public"."semantic_cache"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_history" ADD CONSTRAINT "edit_history_session_id_collaboration_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."collaboration_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_history" ADD CONSTRAINT "edit_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_ratings" ADD CONSTRAINT "run_ratings_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;