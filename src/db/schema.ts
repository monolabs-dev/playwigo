import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = () => ({
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const testRunStatus = pgEnum("test_run_status", [
  "pending",
  "queued",
  "running",
  "passed",
  "failed",
  "error",
  "cancelled",
]);

export const testRunStepStatus = pgEnum("test_run_step_status", [
  "pending",
  "running",
  "passed",
  "failed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_userId_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("accounts_userId_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const apikeys = pgTable(
  "apikeys",
  {
    id: text("id").primaryKey(),
    configId: text("config_id").default("default").notNull(),
    name: text("name"),
    start: text("start"),
    referenceId: text("reference_id").notNull(),
    prefix: text("prefix"),
    key: text("key").notNull(),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at"),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000),
    rateLimitMax: integer("rate_limit_max").default(10),
    requestCount: integer("request_count").default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("apikeys_configId_idx").on(table.configId),
    index("apikeys_referenceId_idx").on(table.referenceId),
    index("apikeys_key_idx").on(table.key),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    website: text("website").notNull(),
    ...timestamps(),
  },
  (table) => [index("projects_user_id_idx").on(table.userId)],
);

export const features = pgTable(
  "features",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    ...timestamps(),
  },
  (table) => [index("features_project_id_idx").on(table.projectId)],
);

export const testAccounts = pgTable(
  "test_accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    email: text("email"),
    password: text("password"),
    url: text("url"),
    ...timestamps(),
  },
  (table) => [index("test_accounts_project_id_idx").on(table.projectId)],
);

export const loginFlows = pgTable(
  "login_flows",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("login_flows_project_id_idx").on(table.projectId),
  ],
);

export const loginFlowSteps = pgTable(
  "login_flow_steps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    loginFlowId: text("login_flow_id")
      .notNull()
      .references(() => loginFlows.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    action: text("action").notNull(),
    selector: text("selector"),
    selectorType: text("selector_type"),
    value: text("value"),
    config: jsonb("config"),
    outputVariable: text("output_variable"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("login_flow_steps_login_flow_id_sort_order_idx").on(
      table.loginFlowId,
      table.sortOrder,
    ),
  ],
);

export const testCases = pgTable(
  "test_cases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    featureId: text("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    testAccountId: text("test_account_id").references(() => testAccounts.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    baseUrl: text("base_url"),
    ...timestamps(),
  },
  (table) => [
    index("test_cases_feature_id_idx").on(table.featureId),
    index("test_cases_test_account_id_idx").on(table.testAccountId),
  ],
);

export const testCaseSteps = pgTable(
  "test_case_steps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    testCaseId: text("test_case_id")
      .notNull()
      .references(() => testCases.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    action: text("action").notNull(),
    selector: text("selector"),
    selectorType: text("selector_type"),
    value: text("value"),
    config: jsonb("config"),
    outputVariable: text("output_variable"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("test_case_steps_test_case_id_sort_order_idx").on(
      table.testCaseId,
      table.sortOrder,
    ),
  ],
);

export const testRuns = pgTable(
  "test_runs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    testCaseId: text("test_case_id")
      .notNull()
      .references(() => testCases.id, { onDelete: "cascade" }),
    testAccountId: text("test_account_id").references(() => testAccounts.id, {
      onDelete: "set null",
    }),
    status: testRunStatus("status").default("pending").notNull(),
    queuedAt: timestamp("queued_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    durationMs: integer("duration_ms"),
    errorMessage: text("error_message"),
    consoleLogs: jsonb("console_logs"),
    variables: jsonb("variables").$type<Record<string, string>>(),
    resolvedVariables: jsonb("resolved_variables").$type<
      Record<string, string>
    >(),
    ...timestamps(),
  },
  (table) => [
    index("test_runs_test_account_id_idx").on(table.testAccountId),
    index("test_runs_status_idx").on(table.status),
    index("test_runs_test_case_id_created_at_idx").on(
      table.testCaseId,
      table.createdAt,
    ),
  ],
);

export const testRunSteps = pgTable(
  "test_run_steps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    testRunId: text("test_run_id")
      .notNull()
      .references(() => testRuns.id, { onDelete: "cascade" }),
    testCaseStepId: text("test_case_step_id").references(
      () => testCaseSteps.id,
      { onDelete: "set null" },
    ),
    sortOrder: integer("sort_order").notNull(),
    action: text("action").notNull(),
    selector: text("selector"),
    selectorType: text("selector_type"),
    value: text("value"),
    config: jsonb("config"),
    outputVariable: text("output_variable"),
    resolvedValue: text("resolved_value"),
    status: testRunStepStatus("status").default("pending").notNull(),
    durationMs: integer("duration_ms"),
    errorMessage: text("error_message"),
    screenshotUrl: text("screenshot_url"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("test_run_steps_test_run_id_sort_order_idx").on(
      table.testRunId,
      table.sortOrder,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  projects: many(projects),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  users: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  features: many(features),
  testAccounts: many(testAccounts),
  loginFlow: one(loginFlows),
}));

export const loginFlowsRelations = relations(loginFlows, ({ one, many }) => ({
  project: one(projects, {
    fields: [loginFlows.projectId],
    references: [projects.id],
  }),
  steps: many(loginFlowSteps),
}));

export const loginFlowStepsRelations = relations(
  loginFlowSteps,
  ({ one }) => ({
    loginFlow: one(loginFlows, {
      fields: [loginFlowSteps.loginFlowId],
      references: [loginFlows.id],
    }),
  }),
);

export const featuresRelations = relations(features, ({ one, many }) => ({
  project: one(projects, {
    fields: [features.projectId],
    references: [projects.id],
  }),
  testCases: many(testCases),
}));

export const testAccountsRelations = relations(
  testAccounts,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [testAccounts.projectId],
      references: [projects.id],
    }),
    testCases: many(testCases),
    testRuns: many(testRuns),
  }),
);

export const testCasesRelations = relations(testCases, ({ one, many }) => ({
  feature: one(features, {
    fields: [testCases.featureId],
    references: [features.id],
  }),
  testAccount: one(testAccounts, {
    fields: [testCases.testAccountId],
    references: [testAccounts.id],
  }),
  steps: many(testCaseSteps),
  runs: many(testRuns),
}));

export const testCaseStepsRelations = relations(
  testCaseSteps,
  ({ one, many }) => ({
    testCase: one(testCases, {
      fields: [testCaseSteps.testCaseId],
      references: [testCases.id],
    }),
    runSteps: many(testRunSteps),
  }),
);

export const testRunsRelations = relations(testRuns, ({ one, many }) => ({
  testCase: one(testCases, {
    fields: [testRuns.testCaseId],
    references: [testCases.id],
  }),
  testAccount: one(testAccounts, {
    fields: [testRuns.testAccountId],
    references: [testAccounts.id],
  }),
  steps: many(testRunSteps),
}));

export const testRunStepsRelations = relations(testRunSteps, ({ one }) => ({
  testRun: one(testRuns, {
    fields: [testRunSteps.testRunId],
    references: [testRuns.id],
  }),
  testCaseStep: one(testCaseSteps, {
    fields: [testRunSteps.testCaseStepId],
    references: [testCaseSteps.id],
  }),
}));
