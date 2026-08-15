CREATE TYPE "public"."test_run_status" AS ENUM('pending', 'queued', 'running', 'passed', 'failed', 'error');--> statement-breakpoint
CREATE TYPE "public"."test_run_step_status" AS ENUM('pending', 'running', 'passed', 'failed');--> statement-breakpoint
CREATE TABLE "features" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"website" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"email" text,
	"password" text,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_case_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"test_case_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"action" text NOT NULL,
	"selector" text,
	"selector_type" text,
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_id" text NOT NULL,
	"test_account_id" text,
	"name" text NOT NULL,
	"base_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_run_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"test_run_id" text NOT NULL,
	"test_case_step_id" text,
	"sort_order" integer NOT NULL,
	"action" text NOT NULL,
	"selector" text,
	"selector_type" text,
	"value" text,
	"status" "test_run_step_status" DEFAULT 'pending' NOT NULL,
	"duration_ms" integer,
	"error_message" text,
	"screenshot_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"test_case_id" text NOT NULL,
	"test_account_id" text,
	"status" "test_run_status" DEFAULT 'pending' NOT NULL,
	"queued_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration_ms" integer,
	"error_message" text,
	"console_logs" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "features" ADD CONSTRAINT "features_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_accounts" ADD CONSTRAINT "test_accounts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_case_steps" ADD CONSTRAINT "test_case_steps_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_test_account_id_test_accounts_id_fk" FOREIGN KEY ("test_account_id") REFERENCES "public"."test_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_run_steps" ADD CONSTRAINT "test_run_steps_test_run_id_test_runs_id_fk" FOREIGN KEY ("test_run_id") REFERENCES "public"."test_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_run_steps" ADD CONSTRAINT "test_run_steps_test_case_step_id_test_case_steps_id_fk" FOREIGN KEY ("test_case_step_id") REFERENCES "public"."test_case_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_test_case_id_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."test_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_test_account_id_test_accounts_id_fk" FOREIGN KEY ("test_account_id") REFERENCES "public"."test_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "features_project_id_idx" ON "features" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_accounts_project_id_idx" ON "test_accounts" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_case_steps_test_case_id_sort_order_idx" ON "test_case_steps" USING btree ("test_case_id","sort_order");--> statement-breakpoint
CREATE INDEX "test_cases_feature_id_idx" ON "test_cases" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "test_cases_test_account_id_idx" ON "test_cases" USING btree ("test_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "test_run_steps_test_run_id_sort_order_idx" ON "test_run_steps" USING btree ("test_run_id","sort_order");--> statement-breakpoint
CREATE INDEX "test_runs_test_account_id_idx" ON "test_runs" USING btree ("test_account_id");--> statement-breakpoint
CREATE INDEX "test_runs_status_idx" ON "test_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "test_runs_test_case_id_created_at_idx" ON "test_runs" USING btree ("test_case_id","created_at");