import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // Hashed password for email/password auth
  googleId: varchar("google_id").unique(), // Google OAuth user ID
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  credits: integer("credits").notNull().default(10), // Start with 10 free credits
  plan: varchar("plan").notNull().default("free"), // free, standard, pro
  planExpiresAt: timestamp("plan_expires_at"), // null = never expires (free plan)
  isAdmin: integer("is_admin").default(0), // 1 = admin, 0 = regular user
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email verification codes table
export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  code: varchar("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table for tracking all transactions
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Amount in kopecks (UAH * 100)
  currency: varchar("currency").notNull().default("UAH"),
  credits: integer("credits").notNull(), // Credits purchased
  status: varchar("status").notNull().default("pending"), // pending, success, failed, refunded
  paymentMethod: varchar("payment_method").default("liqpay"),
  liqpayOrderId: varchar("liqpay_order_id").unique(),
  liqpayPaymentId: varchar("liqpay_payment_id"),
  description: varchar("description"),
  errorMessage: varchar("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing plans stored in database for admin management
export const pricingPlans = pgTable("pricing_plans", {
  id: varchar("id").primaryKey(), // 'standard_monthly', 'standard_yearly', 'pro_monthly', 'pro_yearly'
  name: varchar("name").notNull(),
  nameUk: varchar("name_uk"),
  nameEn: varchar("name_en"),
  planType: varchar("plan_type").notNull(), // 'standard' or 'pro'
  period: varchar("period").notNull(), // 'monthly' or 'yearly'
  priceUah: integer("price_uah").notNull(), // Price in UAH
  priceUsd: integer("price_usd"), // Price in USD (for international)
  credits: integer("credits").notNull(),
  features: varchar("features").array(), // List of features
  featuresUk: varchar("features_uk").array(),
  featuresEn: varchar("features_en").array(),
  isActive: integer("is_active").notNull().default(1),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Credit packages for one-time purchases
export const creditPackages = pgTable("credit_packages", {
  id: varchar("id").primaryKey(),
  credits: integer("credits").notNull(),
  priceUah: integer("price_uah").notNull(), // Price in UAH
  priceUsd: integer("price_usd"), // Price in USD
  bonusCredits: integer("bonus_credits").default(0),
  isActive: integer("is_active").notNull().default(1),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// System settings table for admin configuration
export const systemSettings = pgTable("system_settings", {
  key: varchar("key").primaryKey(),
  value: varchar("value").notNull(),
  description: varchar("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Page content for CMS - editable texts for each page
export const pageContents = pgTable("page_contents", {
  id: varchar("id").primaryKey(), // 'home_hero', 'home_features', 'editor_title', etc.
  page: varchar("page").notNull(), // 'home', 'editor', 'pricing', 'account', 'terms'
  section: varchar("section").notNull(), // 'hero', 'features', 'cta', etc.
  contentRu: varchar("content_ru"), // Russian content (JSON string for complex content)
  contentUk: varchar("content_uk"), // Ukrainian content
  contentEn: varchar("content_en"), // English content
  isActive: integer("is_active").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Tools configuration - manage tools, prices, enable/disable
export const tools = pgTable("tools", {
  id: varchar("id").primaryKey(), // 'enhance', 'upscale', 'face-restore', etc.
  nameRu: varchar("name_ru").notNull(),
  nameUk: varchar("name_uk"),
  nameEn: varchar("name_en"),
  descriptionRu: varchar("description_ru"),
  descriptionUk: varchar("description_uk"),
  descriptionEn: varchar("description_en"),
  category: varchar("category").notNull(), // 'enhance', 'face', 'background', 'restore', 'edit', 'effects'
  creditCost: integer("credit_cost").notNull().default(10),
  creditCostPro: integer("credit_cost_pro"), // Optional different price for pro users
  isActive: integer("is_active").notNull().default(1),
  isPro: integer("is_pro").default(0), // 1 = only for pro users
  sortOrder: integer("sort_order").default(0),
  iconName: varchar("icon_name"), // Lucide icon name
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SEO settings per page
export const seoSettings = pgTable("seo_settings", {
  id: varchar("id").primaryKey(), // 'home', 'editor', 'pricing', etc.
  page: varchar("page").notNull().unique(),
  titleRu: varchar("title_ru"),
  titleUk: varchar("title_uk"),
  titleEn: varchar("title_en"),
  descriptionRu: varchar("description_ru"),
  descriptionUk: varchar("description_uk"),
  descriptionEn: varchar("description_en"),
  keywordsRu: varchar("keywords_ru"),
  keywordsUk: varchar("keywords_uk"),
  keywordsEn: varchar("keywords_en"),
  ogImage: varchar("og_image"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === PROVIDER-AGNOSTIC ARCHITECTURE ===

// AI Provider configurations - stores all provider settings
export const providerConfigs = pgTable("provider_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // 'RunPod ESRGAN', 'Replicate GFPGAN', etc.
  providerType: varchar("provider_type").notNull(), // 'runpod', 'replicate', 'local'
  toolId: varchar("tool_id").notNull(), // Links to tools table (enhance, upscale, etc.)
  endpoint: varchar("endpoint"), // API endpoint URL
  apiKeyEnvVar: varchar("api_key_env_var"), // Name of env var holding API key
  model: varchar("model"), // Model name/version
  config: jsonb("config"), // JSON config: timeout, retries, params, etc.
  priority: integer("priority").notNull().default(1), // Lower = higher priority (fallback order)
  isActive: integer("is_active").notNull().default(1),
  isDefault: integer("is_default").notNull().default(0), // 1 = default provider for this tool
  healthStatus: varchar("health_status").default("unknown"), // healthy, unhealthy, unknown
  lastHealthCheck: timestamp("last_health_check"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Jobs queue - tracks all processing jobs
export const aiJobs = pgTable("ai_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  editId: integer("edit_id"), // Reference to edits table
  toolId: varchar("tool_id").notNull(),
  providerId: varchar("provider_id").references(() => providerConfigs.id),
  status: varchar("status").notNull().default("queued"), // queued, processing, done, failed, cancelled
  priority: integer("priority").notNull().default(5), // 1-10, lower = higher priority
  inputData: jsonb("input_data"), // Input file URL, params
  outputData: jsonb("output_data"), // Result URL, metadata
  errorMessage: varchar("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  processingTimeMs: integer("processing_time_ms"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs - tracks all admin actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // 'create', 'update', 'delete', 'login', 'settings_change'
  entityType: varchar("entity_type").notNull(), // 'user', 'tool', 'provider', 'payment', etc.
  entityId: varchar("entity_id"),
  oldValue: jsonb("old_value"), // Previous state
  newValue: jsonb("new_value"), // New state
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Environment overrides - configurable from admin panel
export const envOverrides = pgTable("env_overrides", {
  key: varchar("key").primaryKey(),
  value: varchar("value").notNull(),
  description: varchar("description"),
  category: varchar("category").notNull().default("general"), // 'api_keys', 'limits', 'features', 'storage'
  isSecret: integer("is_secret").notNull().default(0), // 1 = masked in UI
  isActive: integer("is_active").notNull().default(1),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type PricingPlan = typeof pricingPlans.$inferSelect;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type PageContent = typeof pageContents.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type SeoSetting = typeof seoSettings.$inferSelect;

// Provider-agnostic types
export type ProviderConfig = typeof providerConfigs.$inferSelect;
export type InsertProviderConfig = typeof providerConfigs.$inferInsert;
export type AiJob = typeof aiJobs.$inferSelect;
export type InsertAiJob = typeof aiJobs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type EnvOverride = typeof envOverrides.$inferSelect;
export type InsertEnvOverride = typeof envOverrides.$inferInsert;
