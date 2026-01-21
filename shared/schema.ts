import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models (users and sessions tables)
export * from "./models/auth";

// Re-import users for reference in creditTransactions
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

// Credit transactions history
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Positive = add, Negative = deduct
  type: text("type").notNull(), // 'purchase', 'usage', 'bonus'
  description: text("description"),
  editId: integer("edit_id").references(() => edits.id), // Reference to edit if usage
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stores the uploaded original images
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  originalFilename: text("original_filename").notNull(),
  contentType: text("content_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stores the edit operations and results
export const edits = pgTable("edits", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").notNull().references(() => images.id),
  toolType: text("tool_type").notNull(), // upscale, enhance, face-restore, object-removal, background-change, etc.
  maskUrl: text("mask_url"),
  prompt: text("prompt"),
  resultUrl: text("result_url"),
  status: text("status").notNull().default("pending"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === SCHEMAS ===

export const insertImageSchema = createInsertSchema(images).omit({ 
  id: true, 
  createdAt: true 
});

export const insertEditSchema = createInsertSchema(edits).omit({ 
  id: true, 
  createdAt: true,
  resultUrl: true,
  status: true,
  error: true
});

// === TYPES ===

export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;

export type Edit = typeof edits.$inferSelect;
export type InsertEdit = z.infer<typeof insertEditSchema>;

// API Request/Response Types
export type CreateImageRequest = InsertImage;
export type CreateEditRequest = InsertEdit;

export type EditResponse = Edit & {
  originalImage?: Image;
};

// Tool types
export const TOOL_TYPES = [
  'upscale',
  'enhance', 
  'face-restore',
  'portrait-enhance',
  'old-photo-restore',
  'old-photo-restore-pro',
  'object-removal',
  'background-change',
  // New tools
  'background-remove',
  'colorize',
  'blur-background',
  'text-to-image',
  'hdr',
  'watermark-add',
  'face-swap',
  'blur-face',
  'convert',
  'compress',
  'auto-light',
  'makeup'
] as const;

export type ToolType = typeof TOOL_TYPES[number];

// Credit costs for each tool (API cost × 20 profit margin)
export const TOOL_CREDITS: Record<ToolType, number> = {
  'enhance': 4,
  'upscale': 3,  // Base price for 2x, 4x=5, 8x=10 (handled in routes.ts)
  'face-restore': 4,
  'portrait-enhance': 4,
  'old-photo-restore': 8,
  'old-photo-restore-pro': 10,
  'object-removal': 8,
  'background-remove': 3,
  'background-change': 10,  // AI-generated background
  'colorize': 5,
  'blur-background': 3,
  'text-to-image': 2,
  'hdr': 0,  // Free - local Sharp HDR processing
  'watermark-add': 0,  // Free - local Sharp watermark
  'face-swap': 8,
  'blur-face': 2,  // Face detection + local Sharp blur
  'convert': 0,  // Free - local Sharp conversion
  'compress': 0,  // Free - local Sharp compression
  'auto-light': 0,  // Free - local Sharp processing
  'makeup': 3,  // GFPGAN face beautification
};

// Custom background costs less (no AI generation, just compositing)
export const CUSTOM_BACKGROUND_CREDITS = 4;

// === CREDIT TRANSACTION SCHEMAS ===

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({ 
  id: true, 
  createdAt: true
});

// === CREDIT TRANSACTION TYPES ===

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

// === PAGE CONTENTS (CMS) ===

export const pageContents = pgTable("page_contents", {
  id: varchar("id").primaryKey(),
  page: varchar("page").notNull(),
  section: varchar("section").notNull(),
  contentRu: varchar("content_ru"),
  contentUk: varchar("content_uk"),
  contentEn: varchar("content_en"),
  isActive: integer("is_active").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPageContentSchema = createInsertSchema(pageContents).omit({
  updatedAt: true
});

export type PageContent = typeof pageContents.$inferSelect;
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;

// === CREDIT PACKAGES ===

export const creditPackages = pgTable("credit_packages", {
  id: varchar("id").primaryKey(),
  credits: integer("credits").notNull(),
  priceUah: integer("price_uah").notNull(),
  priceUsd: integer("price_usd").notNull(),
  bonusCredits: integer("bonus_credits").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCreditPackageSchema = createInsertSchema(creditPackages).omit({
  createdAt: true
});

export type CreditPackage = typeof creditPackages.$inferSelect;
export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;

// === PRICING PLANS ===

export const pricingPlans = pgTable("pricing_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  nameUk: varchar("name_uk"),
  nameEn: varchar("name_en"),
  planType: varchar("plan_type").notNull(), // 'free', 'pro'
  period: varchar("period").notNull(), // 'monthly', 'yearly'
  priceUah: integer("price_uah").notNull(),
  priceUsd: integer("price_usd").notNull(),
  credits: integer("credits").notNull(),
  features: text("features").array(),
  featuresUk: text("features_uk").array(),
  featuresEn: text("features_en").array(),
  isActive: integer("is_active").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPricingPlanSchema = createInsertSchema(pricingPlans).omit({
  createdAt: true,
  updatedAt: true
});

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type InsertPricingPlan = z.infer<typeof insertPricingPlanSchema>;
