import { db } from "./db";
import { tools, systemSettings, providerConfigs, creditPackages, pricingPlans } from "@shared/models/auth";
import { sql } from "drizzle-orm";

const DEFAULT_TOOLS = [
  { id: "enhance", nameRu: "Улучшение", nameUk: "Покращення", nameEn: "Enhance", category: "enhance", creditCost: 20, sortOrder: 1, iconName: "Sparkles" },
  { id: "upscale", nameRu: "Увеличение 4x", nameUk: "Збільшення 4x", nameEn: "Upscale 4x", category: "enhance", creditCost: 25, sortOrder: 2, iconName: "Maximize2" },
  { id: "upscale-8x", nameRu: "Увеличение 8x", nameUk: "Збільшення 8x", nameEn: "Upscale 8x", category: "enhance", creditCost: 50, sortOrder: 3, iconName: "Maximize" },
  { id: "hdr", nameRu: "HDR эффект", nameUk: "HDR ефект", nameEn: "HDR Effect", category: "enhance", creditCost: 0, sortOrder: 4, iconName: "Sun" },
  { id: "face-restore", nameRu: "Восстановление лица", nameUk: "Відновлення обличчя", nameEn: "Face Restore", category: "face", creditCost: 20, sortOrder: 5, iconName: "User" },
  { id: "portrait-enhance", nameRu: "Улучшение портрета", nameUk: "Покращення портрету", nameEn: "Portrait Enhance", category: "face", creditCost: 20, sortOrder: 6, iconName: "UserCircle" },
  { id: "face-swap", nameRu: "Замена лица", nameUk: "Заміна обличчя", nameEn: "Face Swap", category: "face", creditCost: 40, sortOrder: 7, iconName: "Users" },
  { id: "blur-face", nameRu: "Размытие лица", nameUk: "Розмиття обличчя", nameEn: "Blur Face", category: "face", creditCost: 0, sortOrder: 8, iconName: "EyeOff" },
  { id: "background-remove", nameRu: "Удаление фона", nameUk: "Видалення фону", nameEn: "Remove Background", category: "background", creditCost: 15, sortOrder: 9, iconName: "Eraser" },
  { id: "background-change", nameRu: "Замена фона", nameUk: "Заміна фону", nameEn: "Change Background", category: "background", creditCost: 55, sortOrder: 10, iconName: "Image" },
  { id: "blur-background", nameRu: "Размытие фона", nameUk: "Розмиття фону", nameEn: "Blur Background", category: "background", creditCost: 15, sortOrder: 11, iconName: "CircleDashed" },
  { id: "old-photo-restore", nameRu: "Реставрация фото", nameUk: "Реставрація фото", nameEn: "Photo Restore", category: "restore", creditCost: 40, sortOrder: 12, iconName: "Clock" },
  { id: "colorize", nameRu: "Раскрашивание", nameUk: "Розфарбування", nameEn: "Colorize", category: "restore", creditCost: 25, sortOrder: 13, iconName: "Palette" },
  { id: "old-photo-restore-pro", nameRu: "Реставрация Pro", nameUk: "Реставрація Pro", nameEn: "Restore Pro", category: "restore", creditCost: 50, sortOrder: 14, iconName: "History" },
  { id: "object-removal", nameRu: "Удаление объектов", nameUk: "Видалення об'єктів", nameEn: "Object Removal", category: "edit", creditCost: 40, sortOrder: 15, iconName: "Trash2" },
  { id: "watermark-add", nameRu: "Водяной знак", nameUk: "Водяний знак", nameEn: "Watermark", category: "effects", creditCost: 0, sortOrder: 16, iconName: "Type" },
  { id: "convert", nameRu: "Конвертация", nameUk: "Конвертація", nameEn: "Convert", category: "effects", creditCost: 0, sortOrder: 17, iconName: "FileType" },
  { id: "compress", nameRu: "Сжатие", nameUk: "Стиснення", nameEn: "Compress", category: "effects", creditCost: 0, sortOrder: 18, iconName: "FileArchive" },
  { id: "auto-light", nameRu: "Авто-свет", nameUk: "Авто-світло", nameEn: "Auto Light", category: "effects", creditCost: 0, sortOrder: 19, iconName: "Lightbulb" },
];

const DEFAULT_SETTINGS = [
  { key: "liqpay_enabled", value: "true", description: "Включити оплату через LiqPay" },
  { key: "stripe_enabled", value: "false", description: "Включити оплату через Stripe" },
  { key: "fondy_enabled", value: "false", description: "Включити оплату через Fondy" },
  { key: "wayforpay_enabled", value: "false", description: "Включити оплату через WayForPay" },
];

const DEFAULT_CREDIT_PACKAGES = [
  { id: "pack_50", credits: 50, priceUah: 104, priceUsd: 3, bonusCredits: 0, sortOrder: 1 },
  { id: "pack_100", credits: 100, priceUah: 179, priceUsd: 5, bonusCredits: 10, sortOrder: 2 },
  { id: "pack_250", credits: 250, priceUah: 399, priceUsd: 11, bonusCredits: 25, sortOrder: 3 },
  { id: "pack_500", credits: 500, priceUah: 699, priceUsd: 19, bonusCredits: 75, sortOrder: 4 },
  { id: "pack_1000", credits: 1000, priceUah: 1199, priceUsd: 33, bonusCredits: 200, sortOrder: 5 },
];

const DEFAULT_PRICING_PLANS = [
  { 
    id: "standard_monthly", name: "Стандарт", nameUk: "Стандарт", nameEn: "Standard",
    planType: "standard", period: "monthly", priceUah: 199, priceUsd: 6, credits: 100,
    features: ["100 кредитов в месяц", "Базовые инструменты", "Email поддержка"],
    featuresUk: ["100 кредитів на місяць", "Базові інструменти", "Email підтримка"],
    featuresEn: ["100 credits/month", "Basic tools", "Email support"],
    sortOrder: 1
  },
  { 
    id: "standard_yearly", name: "Стандарт (год)", nameUk: "Стандарт (рік)", nameEn: "Standard (year)",
    planType: "standard", period: "yearly", priceUah: 1990, priceUsd: 55, credits: 1200,
    features: ["1200 кредитов в год", "Базовые инструменты", "Email поддержка", "Экономия 17%"],
    featuresUk: ["1200 кредитів на рік", "Базові інструменти", "Email підтримка", "Економія 17%"],
    featuresEn: ["1200 credits/year", "Basic tools", "Email support", "Save 17%"],
    sortOrder: 2
  },
  { 
    id: "pro_monthly", name: "PRO", nameUk: "PRO", nameEn: "PRO",
    planType: "pro", period: "monthly", priceUah: 499, priceUsd: 14, credits: 500,
    features: ["500 кредитов в месяц", "Все инструменты", "Приоритетная обработка", "Приоритетная поддержка"],
    featuresUk: ["500 кредитів на місяць", "Всі інструменти", "Пріоритетна обробка", "Пріоритетна підтримка"],
    featuresEn: ["500 credits/month", "All tools", "Priority processing", "Priority support"],
    sortOrder: 3
  },
  { 
    id: "pro_yearly", name: "PRO (год)", nameUk: "PRO (рік)", nameEn: "PRO (year)",
    planType: "pro", period: "yearly", priceUah: 4990, priceUsd: 139, credits: 6000,
    features: ["6000 кредитов в год", "Все инструменты", "Приоритетная обработка", "Приоритетная поддержка", "Экономия 17%"],
    featuresUk: ["6000 кредитів на рік", "Всі інструменти", "Пріоритетна обробка", "Пріоритетна підтримка", "Економія 17%"],
    featuresEn: ["6000 credits/year", "All tools", "Priority processing", "Priority support", "Save 17%"],
    sortOrder: 4
  },
];

const DEFAULT_PROVIDERS = [
  { id: "prov_esrgan", name: "RunPod ESRGAN", providerType: "runpod", toolId: "upscale", apiKeyEnvVar: "RUNPOD_ESRGAN_ENDPOINT_ID", model: "real-esrgan", config: { retries: 2, timeout: 300, params: { scale: 4 } } },
  { id: "prov_esrgan_8x", name: "RunPod ESRGAN 8x", providerType: "runpod", toolId: "upscale-8x", apiKeyEnvVar: "RUNPOD_ESRGAN_ENDPOINT_ID", model: "real-esrgan", config: { retries: 2, timeout: 400, params: { scale: 8 } } },
  { id: "prov_esrgan_enhance", name: "RunPod ESRGAN Enhance", providerType: "runpod", toolId: "enhance", apiKeyEnvVar: "RUNPOD_ESRGAN_ENDPOINT_ID", model: "real-esrgan", config: { retries: 2, timeout: 300 } },
  { id: "prov_gfpgan", name: "RunPod GFPGAN", providerType: "runpod", toolId: "face-restore", apiKeyEnvVar: "RUNPOD_GFPGAN_ENDPOINT_ID", model: "gfpgan", config: { retries: 2, timeout: 300 } },
  { id: "prov_gfpgan_portrait", name: "RunPod GFPGAN Portrait", providerType: "runpod", toolId: "portrait-enhance", apiKeyEnvVar: "RUNPOD_GFPGAN_ENDPOINT_ID", model: "gfpgan", config: { retries: 2, timeout: 300 } },
  { id: "prov_gfpgan_makeup", name: "RunPod GFPGAN Makeup", providerType: "runpod", toolId: "makeup", apiKeyEnvVar: "RUNPOD_GFPGAN_ENDPOINT_ID", model: "gfpgan", config: { retries: 2, timeout: 300 } },
  { id: "prov_inswapper", name: "RunPod Inswapper", providerType: "runpod", toolId: "face-swap", apiKeyEnvVar: "RUNPOD_INSWAPPER_ENDPOINT_ID", model: "inswapper", config: { retries: 2, timeout: 300 } },
  { id: "prov_rembg", name: "RunPod Rembg", providerType: "runpod", toolId: "background-remove", apiKeyEnvVar: "RUNPOD_REMBG_ENDPOINT_ID", model: "rembg", config: { retries: 2, timeout: 180 } },
  { id: "prov_rembg_blur", name: "RunPod Rembg Blur", providerType: "runpod", toolId: "blur-background", apiKeyEnvVar: "RUNPOD_REMBG_ENDPOINT_ID", model: "rembg", config: { retries: 2, timeout: 180 } },
  { id: "prov_flux", name: "RunPod FLUX", providerType: "runpod", toolId: "background-change", apiKeyEnvVar: "RUNPOD_FLUX_ENDPOINT_ID", model: "flux-fill-pro", config: { retries: 2, timeout: 300 } },
  { id: "prov_flux_inpaint", name: "RunPod FLUX Inpainting", providerType: "runpod", toolId: "object-removal", apiKeyEnvVar: "RUNPOD_FLUX_ENDPOINT_ID", model: "flux-fill-pro", config: { retries: 2, timeout: 300 } },
  { id: "prov_flux_inpaint2", name: "RunPod FLUX Inpaint", providerType: "runpod", toolId: "inpainting", apiKeyEnvVar: "RUNPOD_FLUX_ENDPOINT_ID", model: "flux-fill-pro", config: { retries: 2, timeout: 300 } },
  { id: "prov_flux_outpaint", name: "RunPod FLUX Outpainting", providerType: "runpod", toolId: "outpainting", apiKeyEnvVar: "RUNPOD_FLUX_ENDPOINT_ID", model: "flux-fill-pro", config: { retries: 2, timeout: 300 } },
  { id: "prov_flux_art", name: "RunPod FLUX Art Style", providerType: "runpod", toolId: "art-style", apiKeyEnvVar: "RUNPOD_FLUX_ENDPOINT_ID", model: "flux-fill-pro", config: { retries: 2, timeout: 300 } },
  { id: "prov_flux_text2img", name: "RunPod FLUX Text2Image", providerType: "runpod", toolId: "text-to-image", apiKeyEnvVar: "RUNPOD_FLUX_ENDPOINT_ID", model: "flux-fill-pro", config: { retries: 2, timeout: 300 } },
  { id: "prov_ddcolor", name: "Replicate DDColor", providerType: "replicate", toolId: "colorize", apiKeyEnvVar: "REPLICATE_API_TOKEN", model: "ca494ba129e44e45f661d6ece83c4c98a9a7c774309beca01429b58fce8aa695", endpoint: "piddnad/ddcolor", config: { imageKey: "image", useBase64: true, params: { model_size: "large" } } },
  { id: "prov_oldphoto", name: "Replicate FLUX Kontext Restore", providerType: "replicate", toolId: "old-photo-restore", apiKeyEnvVar: "REPLICATE_API_TOKEN", model: "da7613a13aac59a1a3231023f0f30cf27991695ee0fe7ef52959ec1e02311c25", endpoint: "flux-kontext-apps/restore-image", config: { imageKey: "input_image", useBase64: true, params: { output_format: "png" } } },
  { id: "prov_oldphoto_pro", name: "Replicate FLUX Kontext Restore Pro", providerType: "replicate", toolId: "old-photo-restore-pro", apiKeyEnvVar: "REPLICATE_API_TOKEN", model: "da7613a13aac59a1a3231023f0f30cf27991695ee0fe7ef52959ec1e02311c25", endpoint: "flux-kontext-apps/restore-image", config: { imageKey: "input_image", useBase64: true, params: { output_format: "png" } } },
  { id: "prov_local_hdr", name: "Local Sharp HDR", providerType: "local", toolId: "hdr", model: "sharp", config: { quality: 90 } },
  { id: "prov_local_watermark", name: "Local Sharp Watermark", providerType: "local", toolId: "watermark-add", model: "sharp", config: { quality: 90 } },
];

export async function seedDatabase() {
  try {
    console.log("Checking and seeding missing tools...");
    
    let addedCount = 0;
    for (const tool of DEFAULT_TOOLS) {
      try {
        await db.insert(tools).values({
          id: tool.id,
          nameRu: tool.nameRu,
          nameUk: tool.nameUk,
          nameEn: tool.nameEn,
          category: tool.category as any,
          creditCost: tool.creditCost,
          sortOrder: tool.sortOrder,
          iconName: tool.iconName,
          isActive: 1,
          isPro: 0,
        }).onConflictDoNothing();
        addedCount++;
      } catch (e) {
        // Tool already exists, skip
      }
    }
    
    console.log(`Seed complete. Processed ${DEFAULT_TOOLS.length} tools.`);

    const existingSettings = await db.select({ key: systemSettings.key }).from(systemSettings).limit(1);
    
    if (existingSettings.length === 0) {
      console.log("Seeding database with default settings...");
      
      for (const setting of DEFAULT_SETTINGS) {
        await db.insert(systemSettings).values(setting).onConflictDoNothing();
      }
      
      console.log(`Seeded ${DEFAULT_SETTINGS.length} settings`);
    }

    // Seed providers
    console.log("Checking and seeding missing providers...");
    for (const provider of DEFAULT_PROVIDERS) {
      try {
        await db.insert(providerConfigs).values({
          id: provider.id,
          name: provider.name,
          providerType: provider.providerType,
          toolId: provider.toolId,
          endpoint: (provider as any).endpoint || null,
          apiKeyEnvVar: provider.apiKeyEnvVar || null,
          model: provider.model,
          config: provider.config,
          priority: 1,
          isActive: 1,
          isDefault: 1,
          healthStatus: "unknown",
        }).onConflictDoNothing();
      } catch (e) {
        // Provider already exists
      }
    }
    console.log(`Seed complete. Processed ${DEFAULT_PROVIDERS.length} providers.`);

    // Seed credit packages
    console.log("Checking and seeding missing credit packages...");
    for (const pkg of DEFAULT_CREDIT_PACKAGES) {
      try {
        await db.insert(creditPackages).values({
          id: pkg.id,
          credits: pkg.credits,
          priceUah: pkg.priceUah,
          priceUsd: pkg.priceUsd,
          bonusCredits: pkg.bonusCredits,
          sortOrder: pkg.sortOrder,
          isActive: 1,
        }).onConflictDoNothing();
      } catch (e) {
        // Package already exists
      }
    }
    console.log(`Seed complete. Processed ${DEFAULT_CREDIT_PACKAGES.length} credit packages.`);

    // Seed pricing plans
    console.log("Checking and seeding missing pricing plans...");
    for (const plan of DEFAULT_PRICING_PLANS) {
      try {
        await db.insert(pricingPlans).values({
          id: plan.id,
          name: plan.name,
          nameUk: plan.nameUk,
          nameEn: plan.nameEn,
          planType: plan.planType,
          period: plan.period,
          priceUah: plan.priceUah,
          priceUsd: plan.priceUsd,
          credits: plan.credits,
          features: plan.features,
          featuresUk: plan.featuresUk,
          featuresEn: plan.featuresEn,
          sortOrder: plan.sortOrder,
          isActive: 1,
        }).onConflictDoNothing();
      } catch (e) {
        // Plan already exists
      }
    }
    console.log(`Seed complete. Processed ${DEFAULT_PRICING_PLANS.length} pricing plans.`);
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
