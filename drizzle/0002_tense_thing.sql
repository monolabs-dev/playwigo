CREATE TABLE "login_flow_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"login_flow_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"action" text NOT NULL,
	"selector" text,
	"selector_type" text,
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_flows" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "login_flow_steps" ADD CONSTRAINT "login_flow_steps_login_flow_id_login_flows_id_fk" FOREIGN KEY ("login_flow_id") REFERENCES "public"."login_flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_flows" ADD CONSTRAINT "login_flows_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "login_flow_steps_login_flow_id_sort_order_idx" ON "login_flow_steps" USING btree ("login_flow_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "login_flows_project_id_idx" ON "login_flows" USING btree ("project_id");