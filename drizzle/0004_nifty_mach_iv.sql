ALTER TABLE "login_flow_steps" ADD COLUMN "config" jsonb;--> statement-breakpoint
ALTER TABLE "login_flow_steps" ADD COLUMN "output_variable" text;--> statement-breakpoint
ALTER TABLE "test_case_steps" ADD COLUMN "config" jsonb;--> statement-breakpoint
ALTER TABLE "test_case_steps" ADD COLUMN "output_variable" text;--> statement-breakpoint
ALTER TABLE "test_run_steps" ADD COLUMN "config" jsonb;--> statement-breakpoint
ALTER TABLE "test_run_steps" ADD COLUMN "output_variable" text;--> statement-breakpoint
ALTER TABLE "test_run_steps" ADD COLUMN "resolved_value" text;--> statement-breakpoint
ALTER TABLE "test_runs" ADD COLUMN "variables" jsonb;--> statement-breakpoint
ALTER TABLE "test_runs" ADD COLUMN "resolved_variables" jsonb;