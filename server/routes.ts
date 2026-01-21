import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { setupAuth, isAuthenticated } from "./auth";
import { registerPaymentRoutes } from "./payment-routes";
import sharp from "sharp";
import { TOOL_CREDITS, CUSTOM_BACKGROUND_CREDITS, type ToolType } from "@shared/schema";
import { tools } from "@shared/models/auth";
import { db } from "./db";
import * as ai from "./ai-wrapper";
import * as runpod from "./runpod";

// RunPod-only configuration - no Replicate fallback
console.log("AI Backend: RunPod Serverless (100%)");
console.log("- ESRGAN endpoint:", runpod.isRunPodConfigured("real-esrgan") ? "configured" : "NOT CONFIGURED");
console.log("- GFPGAN endpoint:", runpod.isRunPodConfigured("gfpgan") ? "configured" : "NOT CONFIGURED");
console.log("- Rembg endpoint:", runpod.isRunPodConfigured("rembg") ? "configured" : "NOT CONFIGURED");
console.log("- FLUX endpoint:", runpod.isRunPodConfigured("flux") ? "configured" : "NOT CONFIGURED");
console.log("- DDColor endpoint:", runpod.isRunPodConfigured("ddcolor") ? "configured" : "NOT CONFIGURED");
console.log("- OldPhoto endpoint:", runpod.isRunPodConfigured("old-photo") ? "configured" : "NOT CONFIGURED");
console.log("- Inswapper endpoint:", runpod.isRunPodConfigured("inswapper") ? "configured" : "NOT CONFIGURED");
console.log("- A1111 endpoint:", runpod.isRunPodConfigured("a1111") ? "configured" : "NOT CONFIGURED");

// Tool to RunPod endpoint mapping
const TOOL_ENDPOINTS: Record<string, keyof typeof runpod.RUNPOD_ENDPOINTS> = {
  upscale: "real-esrgan",
  enhance: "real-esrgan",
  "face-restore": "gfpgan",
  "portrait-enhance": "gfpgan",
  "background-remove": "rembg",
  "blur-background": "rembg",
  "background-change": "rembg", // Uses rembg for background removal step
  colorize: "ddcolor",
  "old-photo-restore": "old-photo",
  "old-photo-restore-pro": "old-photo",
  "object-removal": "flux",
  "text-to-image": "flux",
};

// Helper to get full URL for objects
function getFullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  // Use custom domain if set, otherwise fallback to Replit domains
  const customDomain = process.env.CUSTOM_DOMAIN || 'neurapix.net';
  let domain = process.env.REPLIT_DEV_DOMAIN;
  if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DOMAINS) {
    // Production: use custom domain
    domain = customDomain;
  }
  const baseUrl = domain ? `https://${domain}` : 'http://localhost:5000';
  return `${baseUrl}${path}`;
}

// Helper to translate prompt to English for AI models
async function translateToEnglish(text: string): Promise<string> {
  if (!text || text.trim().length === 0) return '';
  
  // Check if already English (basic check)
  const hasNonLatin = /[^\x00-\x7F]/.test(text);
  if (!hasNonLatin) return text;
  
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Translate the following text to English. Return ONLY the translation, nothing else. Keep it concise and suitable for image generation prompts."
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 100
    });
    
    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Translation failed, using original:', error);
    return text;
  }
}

// Helper to fetch image as buffer
async function fetchImageBuffer(url: string): Promise<Buffer> {
  // Handle base64 data URLs from RunPod
  if (url.startsWith('data:')) {
    const base64Data = url.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper to upload base64/data URL image to object storage and return URL
async function uploadBase64Image(dataUrl: string, prefix: string = 'runpod'): Promise<string> {
  const buffer = await fetchImageBuffer(dataUrl);
  const { objectStorageClient, ObjectStorageService } = await import('./replit_integrations/object_storage');
  const storageService = new ObjectStorageService();
  const privateDir = storageService.getPrivateObjectDir();
  const timestamp = Date.now();
  const path = `${privateDir}/edits/${prefix}-${timestamp}.png`;
  const pathParts = path.split('/').filter(p => p);
  const bucket = objectStorageClient.bucket(pathParts[0]);
  const file = bucket.file(pathParts.slice(1).join('/'));
  await file.save(buffer, { contentType: 'image/png' });
  return getFullUrl(`/objects/edits/${prefix}-${timestamp}.png`);
}

// Helper to add watermark for free users
async function addWatermark(imageUrl: string): Promise<string> {
  console.log('Adding watermark to image for free user...');
  const imageBuffer = await fetchImageBuffer(imageUrl);
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;
  
  // Create watermark SVG
  const fontSize = Math.max(24, Math.floor(width / 20));
  const smallFontSize = Math.max(16, Math.floor(width / 35));
  
  const watermarkSvg = `
    <svg width="${width}" height="${height}">
      <style>
        .main { fill: rgba(255,255,255,0.5); font-size: ${fontSize}px; font-family: Arial, sans-serif; font-weight: bold; }
        .small { fill: rgba(255,255,255,0.6); font-size: ${smallFontSize}px; font-family: Arial, sans-serif; font-weight: bold; }
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="main" stroke="rgba(0,0,0,0.3)" stroke-width="2">NeuraPix</text>
      <text x="${width - 20}" y="${height - 20}" text-anchor="end" class="small">Made with NeuraPix</text>
    </svg>
  `;
  
  // Composite watermark onto image
  const watermarkedBuffer = await sharp(imageBuffer)
    .composite([{
      input: Buffer.from(watermarkSvg),
      gravity: 'center',
    }])
    .png()
    .toBuffer();
  
  // Upload watermarked image to object storage using same pattern as uploadBase64Image
  const { objectStorageClient, ObjectStorageService } = await import('./replit_integrations/object_storage');
  const storageService = new ObjectStorageService();
  const privateDir = storageService.getPrivateObjectDir();
  
  const timestamp = Date.now();
  const path = `${privateDir}/edits/watermarked-${timestamp}.png`;
  const pathParts = path.split('/').filter(p => p);
  const bucket = objectStorageClient.bucket(pathParts[0]);
  const file = bucket.file(pathParts.slice(1).join('/'));
  
  await file.save(watermarkedBuffer, {
    contentType: 'image/png',
    resumable: false,
  });
  
  // Return URL through our app's routing
  const watermarkedUrl = getFullUrl(`/objects/edits/watermarked-${timestamp}.png`);
  
  console.log('Watermarked image saved:', watermarkedUrl);
  return watermarkedUrl;
}

// Helper to composite subject onto background using sharp
async function compositeImages(subjectUrl: string, backgroundUrl: string): Promise<Buffer> {
  console.log(`Compositing: subject=${subjectUrl}, background=${backgroundUrl}`);
  
  // Fetch both images
  const [subjectBuffer, backgroundBuffer] = await Promise.all([
    fetchImageBuffer(subjectUrl),
    fetchImageBuffer(backgroundUrl)
  ]);
  
  // Get subject dimensions (use subject dimensions as base)
  const subjectMetadata = await sharp(subjectBuffer).metadata();
  const subjectWidth = subjectMetadata.width || 512;
  const subjectHeight = subjectMetadata.height || 512;
  
  console.log(`Subject dimensions: ${subjectWidth}x${subjectHeight}, has alpha: ${subjectMetadata.hasAlpha}`);
  
  // Resize background to match subject dimensions
  const resizedBackground = await sharp(backgroundBuffer)
    .resize(subjectWidth, subjectHeight, { fit: 'cover' })
    .ensureAlpha()
    .png()
    .toBuffer();
  
  console.log(`Background resized to match subject: ${subjectWidth}x${subjectHeight}`);
  
  // Ensure subject has alpha channel preserved
  const subjectWithAlpha = await sharp(subjectBuffer)
    .ensureAlpha()
    .png()
    .toBuffer();
  
  // Composite subject onto resized background
  const result = await sharp(resizedBackground)
    .composite([{
      input: subjectWithAlpha,
      left: 0,
      top: 0,
      blend: 'over'
    }])
    .png()
    .toBuffer();
  
  console.log(`Composite complete: ${subjectWidth}x${subjectHeight}`);
  return result;
}

// Helper to extract result URL from various output formats
function extractResultUrl(output: any): string {
  console.log('AI output type:', typeof output);
  console.log('AI output preview:', typeof output === 'string' ? output.substring(0, 100) : output);
  
  // Handle base64 data URLs from RunPod
  if (typeof output === 'string' && output.startsWith('data:')) {
    return output;
  }
  
  // Handle Replicate FileOutput object (has url() method or href property)
  if (output && typeof output === 'object') {
    // FileOutput objects have an href property that contains the URL
    if (output.href && typeof output.href === 'string') {
      return output.href;
    }
    // Or they might be URL-like objects
    if (output.toString && typeof output.toString === 'function') {
      const str = output.toString();
      if (str.startsWith('http')) {
        return str;
      }
    }
  }
  
  // Simple string URL
  if (typeof output === 'string' && output.startsWith('http')) {
    return output;
  }
  
  // Array of results
  if (Array.isArray(output) && output.length > 0) {
    return extractResultUrl(output[0]);
  }
  
  // Object with common output field names
  if (output && typeof output === 'object') {
    if (output.output) return extractResultUrl(output.output);
    if (output.image) {
      // Handle RunPod base64 image in object
      if (typeof output.image === 'string') {
        if (output.image.startsWith('data:') || output.image.startsWith('http')) {
          return output.image;
        }
        // Raw base64 without data URL prefix
        return `data:image/png;base64,${output.image}`;
      }
      return extractResultUrl(output.image);
    }
    if (output.result) return extractResultUrl(output.result);
    if (output.restored_image) return extractResultUrl(output.restored_image);
  }
  
  throw new Error(`Could not extract URL from output: ${typeof output} - ${JSON.stringify(output).substring(0, 200)}`);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed database with default tools if empty
  const { seedDatabase } = await import("./seed-tools");
  await seedDatabase();
  
  // Setup authentication (MUST be before other routes)
  await setupAuth(app);
  
  // Register Object Storage Routes (for uploads)
  registerObjectStorageRoutes(app);
  
  // Register Payment Routes (LiqPay integration)
  registerPaymentRoutes(app);

  // --- Images API ---

  app.post(api.images.create.path, async (req, res) => {
    try {
      const input = api.images.create.input.parse(req.body);
      const image = await storage.createImage(input);
      
      // Normalize EXIF orientation for mobile photos in background
      // This prevents rotation issues when editing
      (async () => {
        try {
          const fullUrl = getFullUrl(input.url);
          console.log('Normalizing EXIF for uploaded image:', fullUrl);
          
          const response = await fetch(fullUrl);
          if (!response.ok) return;
          
          const buffer = Buffer.from(await response.arrayBuffer());
          const metadata = await sharp(buffer).metadata();
          
          // Check if image has EXIF orientation that needs correction
          if (metadata.orientation && metadata.orientation !== 1) {
            console.log(`Image has EXIF orientation ${metadata.orientation}, normalizing...`);
            
            // Normalize orientation
            const normalizedBuffer = await sharp(buffer)
              .rotate() // Auto-rotate based on EXIF
              .toBuffer();
            
            // Re-upload to same path
            const { objectStorageClient } = await import('./replit_integrations/object_storage');
            const pathWithoutPrefix = input.url.replace('/objects/', '');
            const bucket = objectStorageClient.bucket(process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '');
            
            // Path in bucket is .private/uploads/xxx
            const bucketPath = `.private/${pathWithoutPrefix}`;
            console.log('Saving normalized image to bucket path:', bucketPath);
            const file = bucket.file(bucketPath);
            
            await file.save(normalizedBuffer, { 
              contentType: input.contentType || 'image/jpeg' 
            });
            
            // Verify the save worked
            const newMeta = await sharp(normalizedBuffer).metadata();
            console.log(`EXIF normalization complete for: ${input.url} - new size: ${newMeta.width}x${newMeta.height}`);
          }
        } catch (e) {
          console.log('EXIF normalization skipped:', e);
        }
      })();
      
      res.status(201).json(image);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
        return;
      }
      throw err;
    }
  });

  app.get(api.images.get.path, async (req, res) => {
    const image = await storage.getImage(Number(req.params.id));
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.json(image);
  });

  // --- Edits API ---

  app.post(api.edits.create.path, async (req, res) => {
    try {
      const input = api.edits.create.input.parse(req.body);
      const edit = await storage.createEdit(input);
      res.status(201).json(edit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
        return;
      }
      throw err;
    }
  });

  app.get(api.edits.get.path, async (req, res) => {
    const edit = await storage.getEdit(Number(req.params.id));
    if (!edit) {
      return res.status(404).json({ message: 'Edit not found' });
    }
    res.json(edit);
  });

  // --- Credits API ---
  
  // Get current user credits and plan (requires authentication)
  app.get('/api/credits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const userInfo = await storage.getUserInfo(userId);
      res.json({ 
        credits: userInfo.credits, 
        userId,
        plan: userInfo.plan || 'free',
        planExpiresAt: userInfo.planExpiresAt
      });
    } catch (error) {
      console.error('Error getting credits:', error);
      res.status(500).json({ message: 'Failed to get credits' });
    }
  });

  // Get credit cost for a tool
  app.get('/api/credits/cost/:toolType', async (req, res) => {
    const toolType = req.params.toolType as ToolType;
    const isCustomBg = req.query.customBg === 'true';
    
    let cost: number;
    if (toolType === 'background-change' && isCustomBg) {
      cost = CUSTOM_BACKGROUND_CREDITS;
    } else {
      cost = TOOL_CREDITS[toolType] ?? 0;
    }
    
    res.json({ toolType, cost, isCustomBg });
  });

  // Get all tool costs from database
  app.get('/api/credits/costs', async (req, res) => {
    try {
      // Load tool costs from database
      const allTools = await db.select({ id: tools.id, creditCost: tools.creditCost }).from(tools);
      const toolCosts: Record<string, number> = {};
      allTools.forEach(tool => {
        toolCosts[tool.id] = tool.creditCost;
      });
      
      res.json({
        tools: toolCosts,
        customBackground: CUSTOM_BACKGROUND_CREDITS
      });
    } catch (error) {
      // Fallback to hardcoded values if DB fails
      res.json({
        tools: TOOL_CREDITS,
        customBackground: CUSTOM_BACKGROUND_CREDITS
      });
    }
  });

  // Credit packages for purchase
  const CREDIT_PACKAGES: Record<string, { credits: number; price: number }> = {
    "100": { credits: 100, price: 5 },
    "200": { credits: 200, price: 8 },
    "500": { credits: 500, price: 18 },
    "1000": { credits: 1000, price: 25 },
    "2000": { credits: 2000, price: 40 },
    "5000": { credits: 5000, price: 80 },
    "10000": { credits: 10000, price: 120 },
  };

  // Purchase credits (demo mode - adds credits directly)
  app.post('/api/credits/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { packageId } = req.body;
      
      const pkg = CREDIT_PACKAGES[packageId];
      if (!pkg) {
        return res.status(400).json({ message: 'Invalid package' });
      }
      
      // TODO: Integrate with Stripe for real payments
      // For now, just add credits (demo mode)
      await storage.addCredits(userId, pkg.credits, 'purchase', `Покупка ${pkg.credits} кредитов за $${pkg.price}`);
      const userInfo = await storage.getUserInfo(userId);
      const newCredits = userInfo.credits;
      
      res.json({ 
        success: true, 
        credits: pkg.credits,
        newBalance: newCredits,
        message: `Добавлено ${pkg.credits} кредитов (демо-режим)`
      });
    } catch (error) {
      console.error('Error purchasing credits:', error);
      res.status(500).json({ message: 'Failed to purchase credits' });
    }
  });

  app.post(api.edits.process.path, isAuthenticated, async (req: any, res) => {
    const editId = Number(req.params.id);
    const edit = await storage.getEdit(editId);
    
    if (!edit) {
      return res.status(404).json({ message: 'Edit not found' });
    }

    if (!edit.originalImage) {
      return res.status(500).json({ message: 'Original image data missing' });
    }

    // Get authenticated user and check credits + plan
    const userId = (req.user as any).id;
    const userInfo = await storage.getUserInfo(userId);
    const userPlan = userInfo.plan;
    
    const toolType = edit.toolType as ToolType;
    const isCustomBg = edit.prompt?.startsWith('CUSTOM_BG:') ?? false;
    const isUpscale4x = edit.prompt?.startsWith('UPSCALE:4') ?? false;
    const isUpscale8x = edit.prompt?.startsWith('UPSCALE:8') ?? false;
    
    // Plan-based restrictions for 4x and 8x upscale
    if ((isUpscale4x || isUpscale8x) && userPlan === 'free') {
      return res.status(403).json({ 
        message: 'Upscale 4x и 8x доступны только для платных тарифов',
        upgrade: true
      });
    }
    
    let creditCost: number;
    if (toolType === 'background-change' && isCustomBg) {
      creditCost = CUSTOM_BACKGROUND_CREDITS;
    } else if (toolType === 'upscale' && isUpscale8x) {
      creditCost = 10; // 8x upscale: 10 credits
    } else if (toolType === 'upscale' && isUpscale4x) {
      creditCost = 5; // 4x upscale: 5 credits
    } else {
      creditCost = TOOL_CREDITS[toolType] ?? 0; // 2x upscale: 3 credits (from TOOL_CREDITS)
    }

    if (userInfo.credits < creditCost) {
      return res.status(402).json({ 
        message: 'Недостаточно кредитов', 
        required: creditCost,
        available: userInfo.credits
      });
    }

    // Deduct credits
    const toolName = toolType === 'background-change' && isCustomBg 
      ? 'Замена фона (своё изображение)' 
      : toolType;
    
    await storage.deductCredits(userId, creditCost, `Использование: ${toolName}`, editId);

    await storage.updateEditStatus(editId, 'processing');
    
    // Capture user plan for watermarking
    const applyWatermark = userPlan === 'free';
    
    // Process in background
    (async () => {
      try {
        const toolType = edit.toolType as ToolType;
        
        // Local tools don't need RunPod
        const localTools = ['hdr', 'watermark-add', 'convert', 'auto-light'];
        
        // Check if RunPod endpoint is configured for this tool
        const requiredEndpoint = TOOL_ENDPOINTS[toolType];
        if (requiredEndpoint && !runpod.isRunPodConfigured(requiredEndpoint) && !localTools.includes(toolType)) {
          throw new Error(`RunPod endpoint not configured for ${toolType}. Please add ${requiredEndpoint.toUpperCase()} endpoint ID.`);
        }

        const imageUrl = getFullUrl(edit.originalImage!.url);
        let output: any;

        console.log(`Processing ${toolType} with RunPod, image: ${imageUrl}`);

        switch(toolType) {
          case 'upscale':
            // Parse scale from prompt (UPSCALE:2, UPSCALE:4, or UPSCALE:8)
            let upscaleAmount = 2;
            if (edit.prompt && edit.prompt.startsWith('UPSCALE:')) {
              const parsedScale = parseInt(edit.prompt.replace('UPSCALE:', ''), 10);
              if (parsedScale === 2 || parsedScale === 4 || parsedScale === 8) {
                upscaleAmount = parsedScale;
              }
            }
            
            const jobOptions = { userId, editId };
            
            if (upscaleAmount === 8) {
              console.log('Using AI upscale 8x (4x + 2x passes)');
              const firstPass = await ai.upscaleImage(imageUrl, 4, false, { forceMaxDim: 512 }, jobOptions);
              console.log('First 4x pass complete, starting 2x pass...');
              output = await ai.upscaleImage(firstPass, 2, false, { forceMaxDim: 2048 }, jobOptions);
              console.log('8x upscale complete');
            } else if (upscaleAmount === 4) {
              console.log('Using AI upscale 4x');
              output = await ai.upscaleImage(imageUrl, 4, false, { forceMaxDim: 768 }, jobOptions);
            } else {
              console.log('Using AI upscale 2x');
              output = await ai.upscaleImage(imageUrl, 2, false, { forceMaxDim: 1024 }, jobOptions);
            }
            break;
            
          case 'enhance':
            console.log('Using AI enhance with face enhancement');
            output = await ai.upscaleImage(imageUrl, 2, true, {}, { userId, editId });
            break;
            
          case 'face-restore':
            console.log('Using AI face restoration');
            output = await ai.restoreFace(imageUrl, { userId, editId });
            break;
            
          case 'portrait-enhance':
            console.log('Using AI portrait enhancement');
            output = await ai.portraitEnhance(imageUrl, { userId, editId });
            break;
            
          case 'makeup':
            console.log('Using AI makeup application');
            output = await ai.applyMakeup(imageUrl, { userId, editId });
            break;
            
          case 'old-photo-restore':
            console.log('Using AI old photo restore');
            output = await ai.restoreOldPhoto(imageUrl, false, { userId, editId });
            break;
            
          case 'old-photo-restore-pro':
            console.log('Using AI old photo restore pro');
            output = await ai.restoreOldPhoto(imageUrl, true, { userId, editId });
            break;
            
          case 'object-removal': {
            console.log('Using AI object removal');
            const maskUrl = edit.maskUrl ? getFullUrl(edit.maskUrl) : undefined;
            output = await ai.removeObject(imageUrl, maskUrl, { userId, editId });
            break;
          }
            
          case 'background-change':
            console.log(`Background change with prompt: ${edit.prompt}`);
            
            // Step 1: Remove background using RunPod rembg (preserves original size unlike Bria)
            console.log('Using RunPod rembg for background removal (preserves original dimensions)');
            const base64Result = await runpod.removeBackgroundPreserveSize(imageUrl);
            const transparentImageUrl = await uploadBase64Image(base64Result, 'rembg');
            console.log(`Step 1 complete - Transparent image: ${transparentImageUrl}`);
            
            // Check if custom background was provided
            if (edit.prompt && edit.prompt.startsWith('CUSTOM_BG:')) {
              // Custom background - use sharp for compositing
              const customBgPath = edit.prompt.replace('CUSTOM_BG:', '');
              const customBgUrl = getFullUrl(customBgPath);
              console.log(`Using custom background: ${customBgUrl}`);
              
              // Composite subject onto custom background using sharp
              const compositeBuffer = await compositeImages(transparentImageUrl, customBgUrl);
              
              // Upload the composited result to object storage
              const { objectStorageClient, ObjectStorageService } = await import('./replit_integrations/object_storage');
              const storageService = new ObjectStorageService();
              const privateDir = storageService.getPrivateObjectDir();
              const compositeTimestamp = Date.now();
              const compositePath = `${privateDir}/edits/composite-${compositeTimestamp}.png`;
              
              // Parse the path to get bucket and object name
              const pathParts = compositePath.split('/').filter(p => p);
              const bucketName = pathParts[0];
              const objectName = pathParts.slice(1).join('/');
              
              const bucket = objectStorageClient.bucket(bucketName);
              const file = bucket.file(objectName);
              await file.save(compositeBuffer, { contentType: 'image/png' });
              
              // Get the URL of the uploaded composite
              const compositeResultUrl = `/objects/edits/composite-${compositeTimestamp}.png`;
              console.log(`Custom background composite complete: ${compositeResultUrl}`);
              
              // Set output to the composite URL
              output = getFullUrl(compositeResultUrl);
            } else {
              // AI-generated background - NEW APPROACH
              // Step 2: Generate full background via text-to-image
              // Step 3: Composite subject on top of generated background
              
              let userPrompt = edit.prompt && edit.prompt !== 'Apply background-change' 
                ? edit.prompt 
                : 'beautiful natural scenery';
              
              // Common Russian-English translations for backgrounds
              const translations: Record<string, string> = {
                'студия красоты': 'professional beauty salon interior, elegant modern design, soft lighting, mirrors, clean white and pink decor',
                'салон красоты': 'professional beauty salon interior, elegant modern design, soft lighting, mirrors, clean aesthetic',
                'тропический пляж': 'tropical beach with palm trees, ocean waves, sandy shore, sunny day, blue sky',
                'пляж': 'beautiful beach, ocean, sandy shore, sunny day, vacation vibes',
                'город': 'modern city skyline, urban landscape, buildings, daytime',
                'ночной город': 'night city skyline, city lights, urban night scene, illuminated buildings',
                'горы': 'majestic mountains, alpine landscape, scenic peaks, blue sky',
                'лес': 'lush forest, green trees, natural woodland, sunlight through leaves',
                'закат': 'beautiful sunset sky, orange and pink clouds, golden hour',
                'космос': 'outer space, stars, galaxies, nebula, cosmic background',
                'офис': 'modern office interior, professional workspace, clean design',
                'природа': 'beautiful nature landscape, scenic outdoor view, green meadow',
                'белый фон': 'clean pure white studio background, seamless white backdrop',
                'студия': 'professional photo studio background, neutral gray gradient backdrop',
                'кухня': 'modern kitchen interior, clean design, bright and airy',
                'парк': 'beautiful park, green grass, trees, sunny day, nature',
                'море': 'ocean seascape, blue water, waves, sunny sky',
              };
              
              // Check for translations
              const lowerPrompt = userPrompt.toLowerCase();
              for (const [ru, en] of Object.entries(translations)) {
                if (lowerPrompt.includes(ru)) {
                  userPrompt = en;
                  break;
                }
              }
              
              // Enhance prompt for background generation
              const enhancedPrompt = `${userPrompt}, high quality, professional photography, seamless background, no people, empty scene`;
              
              console.log(`Step 2 - Generating background with OpenAI, prompt: ${enhancedPrompt}`);
              
              // First, get original image dimensions to preserve them
              const originalImageResponse = await fetch(imageUrl);
              const originalImageBuffer = Buffer.from(await originalImageResponse.arrayBuffer());
              const originalMetadata = await sharp(originalImageBuffer).metadata();
              const originalWidth = originalMetadata.width || 1024;
              const originalHeight = originalMetadata.height || 1024;
              console.log(`Original image size: ${originalWidth}x${originalHeight}`);
              
              // Generate full background image via OpenAI gpt-image-1 (better quality than FLUX)
              const { generateImageBuffer } = await import('./replit_integrations/image/client');
              const bgBuffer = await generateImageBuffer(enhancedPrompt, "1024x1024");
              console.log('OpenAI background generation successful');
              
              console.log('Step 3 - Compositing subject onto generated background');
              
              // Download the transparent subject image (RunPod rembg preserves original size)
              const subjectResponse = await fetch(transparentImageUrl);
              const subjectBuffer = Buffer.from(await subjectResponse.arrayBuffer());
              
              // Resize the generated background to match original image size
              const resizedBgBuffer = await sharp(bgBuffer)
                .resize(originalWidth, originalHeight, { fit: 'cover' })
                .png()
                .toBuffer();
              
              // Composite subject onto resized background (subject is same size as original)
              const compositeBuffer = await sharp(resizedBgBuffer)
                .composite([{
                  input: subjectBuffer,
                  left: 0,
                  top: 0,
                }])
                .png()
                .toBuffer();
              
              console.log(`Composite result size: ${originalWidth}x${originalHeight}`);
              
              // Upload composite result using same pattern as uploadBase64Image
              const { objectStorageClient: bgStorageClient, ObjectStorageService: BgStorageService } = await import('./replit_integrations/object_storage');
              const bgStorageService = new BgStorageService();
              const bgPrivateDir = bgStorageService.getPrivateObjectDir();
              const compositeTimestamp = Date.now();
              const compositePath = `${bgPrivateDir}/edits/background-change-${compositeTimestamp}.png`;
              const bgPathParts = compositePath.split('/').filter(p => p);
              const bucket = bgStorageClient.bucket(bgPathParts[0]);
              const file = bucket.file(bgPathParts.slice(1).join('/'));
              await file.save(compositeBuffer, { contentType: 'image/png' });
              
              output = getFullUrl(`/objects/edits/background-change-${compositeTimestamp}.png`);
              console.log(`Background change complete: ${output}`);
            }
            break;

          // ======= NEW TOOLS =======
          
          case 'background-remove':
            console.log('Using AI background removal');
            output = await ai.removeBackground(imageUrl, { userId, editId });
            break;

          case 'colorize':
            console.log('Using AI colorization');
            output = await ai.colorize(imageUrl, { userId, editId });
            break;

          case 'blur-background': {
            // Blur background - remove bg, then composite with blurred original (use runpod directly)
            console.log('Using RunPod for blur-background');
            const blurSubjectUrl = await runpod.removeBackground(imageUrl);
            
            // Create blurred background using sharp
            const blurOriginalBuffer = await fetchImageBuffer(imageUrl);
            const blurredBuffer = await sharp(blurOriginalBuffer)
              .blur(20)
              .toBuffer();
            
            // Composite subject onto blurred background
            const subjectBuffer = await fetchImageBuffer(blurSubjectUrl);
            const subjectMeta = await sharp(subjectBuffer).metadata();
            
            const blurResult = await sharp(blurredBuffer)
              .resize(subjectMeta.width, subjectMeta.height, { fit: 'cover' })
              .composite([{ input: subjectBuffer, blend: 'over' }])
              .png()
              .toBuffer();
            
            // Upload result
            const { objectStorageClient: blurStorageClient, ObjectStorageService: BlurStorageService } = await import('./replit_integrations/object_storage');
            const blurStorageService = new BlurStorageService();
            const blurPrivateDir = blurStorageService.getPrivateObjectDir();
            const blurTimestamp = Date.now();
            const blurPath = `${blurPrivateDir}/edits/blur-${blurTimestamp}.png`;
            const blurPathParts = blurPath.split('/').filter(p => p);
            const blurBucket = blurStorageClient.bucket(blurPathParts[0]);
            const blurFile = blurBucket.file(blurPathParts.slice(1).join('/'));
            await blurFile.save(blurResult, { contentType: 'image/png' });
            output = getFullUrl(`/objects/edits/blur-${blurTimestamp}.png`);
            break;
          }

          case 'text-to-image': {
            // Generate image from text
            const genPrompt = edit.prompt || 'beautiful landscape';
            console.log('Using AI for text-to-image');
            output = await ai.textToImage(genPrompt, { userId, editId });
            break;
          }

          case 'hdr': {
            // HDR enhancement using Sharp - local processing for reliability
            const hdrOriginalBuffer = await fetchImageBuffer(imageUrl);
            
            // Apply HDR-like effect: increase contrast, saturation, and sharpness
            const hdrResult = await sharp(hdrOriginalBuffer)
              .modulate({
                saturation: 1.3, // Increase color saturation
                brightness: 1.05 // Slight brightness boost
              })
              .linear(1.2, -20) // Increase contrast
              .sharpen({ sigma: 1.5 }) // Enhance details
              .jpeg({ quality: 95 })
              .toBuffer();
            
            // Upload result
            const { objectStorageClient: hdrStorageClient, ObjectStorageService: HdrStorageService } = await import('./replit_integrations/object_storage');
            const hdrStorageService = new HdrStorageService();
            const hdrPrivateDir = hdrStorageService.getPrivateObjectDir();
            const hdrTimestamp = Date.now();
            const hdrPath = `${hdrPrivateDir}/edits/hdr-${hdrTimestamp}.jpg`;
            const hdrPathParts = hdrPath.split('/').filter(p => p);
            const hdrBucket = hdrStorageClient.bucket(hdrPathParts[0]);
            const hdrFile = hdrBucket.file(hdrPathParts.slice(1).join('/'));
            await hdrFile.save(hdrResult, { contentType: 'image/jpeg' });
            output = getFullUrl(`/objects/edits/hdr-${hdrTimestamp}.jpg`);
            break;
          }

          case 'compress': {
            // Image compression using Sharp - local processing
            const compressOriginalBuffer = await fetchImageBuffer(imageUrl);
            
            // Parse quality from prompt (default 80%)
            let quality = 80;
            const qualityMatch = edit.prompt?.match(/(\d+)/);
            if (qualityMatch) {
              quality = Math.min(100, Math.max(10, parseInt(qualityMatch[1])));
            }
            
            console.log(`Compressing image with quality: ${quality}%`);
            
            // Get original metadata
            const metadata = await sharp(compressOriginalBuffer).metadata();
            const originalSize = compressOriginalBuffer.length;
            
            // Compress based on format
            let compressResult: Buffer;
            let outputFormat = 'jpeg';
            
            if (metadata.format === 'png' && metadata.hasAlpha) {
              // Keep PNG for transparent images
              compressResult = await sharp(compressOriginalBuffer)
                .png({ quality, compressionLevel: 9 })
                .toBuffer();
              outputFormat = 'png';
            } else {
              // Convert to JPEG for best compression
              compressResult = await sharp(compressOriginalBuffer)
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();
            }
            
            const newSize = compressResult.length;
            const savings = Math.round((1 - newSize / originalSize) * 100);
            console.log(`Compressed: ${(originalSize/1024).toFixed(1)}KB -> ${(newSize/1024).toFixed(1)}KB (${savings}% saved)`);
            
            // Upload result
            const { objectStorageClient: compressStorageClient, ObjectStorageService: CompressStorageService } = await import('./replit_integrations/object_storage');
            const compressStorageService = new CompressStorageService();
            const compressPrivateDir = compressStorageService.getPrivateObjectDir();
            const compressTimestamp = Date.now();
            const ext = outputFormat === 'png' ? 'png' : 'jpg';
            const compressPath = `${compressPrivateDir}/edits/compress-${compressTimestamp}.${ext}`;
            const compressPathParts = compressPath.split('/').filter(p => p);
            const compressBucket = compressStorageClient.bucket(compressPathParts[0]);
            const compressFile = compressBucket.file(compressPathParts.slice(1).join('/'));
            await compressFile.save(compressResult, { contentType: outputFormat === 'png' ? 'image/png' : 'image/jpeg' });
            output = getFullUrl(`/objects/edits/compress-${compressTimestamp}.${ext}`);
            break;
          }

          case 'convert': {
            // Format conversion using Sharp - local processing
            const convertOriginalBuffer = await fetchImageBuffer(imageUrl);
            
            // Get target format from prompt (default: jpeg)
            const targetFormat = (edit.prompt?.toLowerCase() || 'jpeg') as 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff';
            
            // Map format names
            const formatMap: Record<string, string> = {
              'jpg': 'jpeg',
              'jpeg': 'jpeg',
              'png': 'png',
              'webp': 'webp',
              'avif': 'avif',
              'tiff': 'tiff',
              'tif': 'tiff',
              'bmp': 'png', // Sharp doesn't support BMP output, convert to PNG
              'heic': 'jpeg', // Convert HEIC to JPEG
              'pdf': 'png', // PDF export not directly supported, use PNG
            };
            
            const normalizedFormat = formatMap[targetFormat] || 'jpeg';
            const mimeTypes: Record<string, string> = {
              'jpeg': 'image/jpeg',
              'png': 'image/png',
              'webp': 'image/webp',
              'avif': 'image/avif',
              'tiff': 'image/tiff',
            };
            
            let convertResult: Buffer;
            switch (normalizedFormat) {
              case 'png':
                convertResult = await sharp(convertOriginalBuffer).png({ quality: 100 }).toBuffer();
                break;
              case 'webp':
                convertResult = await sharp(convertOriginalBuffer).webp({ quality: 95 }).toBuffer();
                break;
              case 'avif':
                convertResult = await sharp(convertOriginalBuffer).avif({ quality: 80 }).toBuffer();
                break;
              case 'tiff':
                convertResult = await sharp(convertOriginalBuffer).tiff({ quality: 100 }).toBuffer();
                break;
              default:
                convertResult = await sharp(convertOriginalBuffer).jpeg({ quality: 95 }).toBuffer();
            }
            
            // Upload result
            const { objectStorageClient: convertStorageClient, ObjectStorageService: ConvertStorageService } = await import('./replit_integrations/object_storage');
            const convertStorageService = new ConvertStorageService();
            const convertPrivateDir = convertStorageService.getPrivateObjectDir();
            const convertTimestamp = Date.now();
            const convertExtension = normalizedFormat === 'jpeg' ? 'jpg' : normalizedFormat;
            const convertPath = `${convertPrivateDir}/edits/convert-${convertTimestamp}.${convertExtension}`;
            const convertPathParts = convertPath.split('/').filter(p => p);
            const convertBucket = convertStorageClient.bucket(convertPathParts[0]);
            const convertFile = convertBucket.file(convertPathParts.slice(1).join('/'));
            await convertFile.save(convertResult, { contentType: mimeTypes[normalizedFormat] || 'image/jpeg' });
            output = getFullUrl(`/objects/edits/convert-${convertTimestamp}.${convertExtension}`);
            break;
          }

          case 'auto-light': {
            // Auto light/exposure correction using Sharp - local processing
            const autoLightBuffer = await fetchImageBuffer(imageUrl);
            
            // Apply automatic brightness/contrast normalization
            const autoLightResult = await sharp(autoLightBuffer)
              .normalize() // Auto-adjust levels for full dynamic range
              .modulate({
                brightness: 1.05, // Slight brightness boost
                saturation: 1.1 // Slight saturation boost for vibrant colors
              })
              .gamma(1.1) // Slight gamma correction for better midtones
              .jpeg({ quality: 95 })
              .toBuffer();
            
            // Upload result
            const { objectStorageClient: autoLightStorageClient, ObjectStorageService: AutoLightStorageService } = await import('./replit_integrations/object_storage');
            const autoLightStorageService = new AutoLightStorageService();
            const autoLightPrivateDir = autoLightStorageService.getPrivateObjectDir();
            const autoLightTimestamp = Date.now();
            const autoLightPath = `${autoLightPrivateDir}/edits/autolight-${autoLightTimestamp}.jpg`;
            const autoLightPathParts = autoLightPath.split('/').filter(p => p);
            const autoLightBucket = autoLightStorageClient.bucket(autoLightPathParts[0]);
            const autoLightFile = autoLightBucket.file(autoLightPathParts.slice(1).join('/'));
            await autoLightFile.save(autoLightResult, { contentType: 'image/jpeg' });
            output = getFullUrl(`/objects/edits/autolight-${autoLightTimestamp}.jpg`);
            break;
          }

          case 'watermark-add': {
            // Parse watermark settings from JSON prompt
            let wmSettings = { text: 'NeuraPix', positions: ['center'], opacity: 0.4, size: 1 };
            try {
              if (edit.prompt) {
                wmSettings = JSON.parse(edit.prompt);
              }
            } catch (e) {
              // If not JSON, use prompt as text
              wmSettings.text = edit.prompt || 'NeuraPix';
            }
            
            const wmOriginalBuffer = await fetchImageBuffer(imageUrl);
            const wmMetadata = await sharp(wmOriginalBuffer).metadata();
            const wmWidth = wmMetadata.width || 800;
            const wmHeight = wmMetadata.height || 600;
            
            // Calculate font sizes with size multiplier
            const sizeMultiplier = wmSettings.size || 1;
            const mainFontSize = Math.max(Math.min(wmWidth, wmHeight) / 12, 28) * sizeMultiplier;
            const smallFontSize = mainFontSize * 0.6;
            const padding = Math.max(wmWidth, wmHeight) * 0.03;
            
            // Position mapping
            const positionMap: Record<string, { x: string; y: number; anchor: string; fontSize: number }> = {
              'top-left': { x: `${padding}`, y: padding + smallFontSize, anchor: 'start', fontSize: smallFontSize },
              'top-center': { x: '50%', y: padding + smallFontSize, anchor: 'middle', fontSize: smallFontSize },
              'top-right': { x: `${wmWidth - padding}`, y: padding + smallFontSize, anchor: 'end', fontSize: smallFontSize },
              'center-left': { x: `${padding}`, y: wmHeight / 2, anchor: 'start', fontSize: mainFontSize },
              'center': { x: '50%', y: wmHeight / 2, anchor: 'middle', fontSize: mainFontSize },
              'center-right': { x: `${wmWidth - padding}`, y: wmHeight / 2, anchor: 'end', fontSize: mainFontSize },
              'bottom-left': { x: `${padding}`, y: wmHeight - padding, anchor: 'start', fontSize: smallFontSize },
              'bottom-center': { x: '50%', y: wmHeight - padding, anchor: 'middle', fontSize: smallFontSize },
              'bottom-right': { x: `${wmWidth - padding}`, y: wmHeight - padding, anchor: 'end', fontSize: smallFontSize },
            };
            
            // Generate text elements for each position
            const textElements = wmSettings.positions
              .filter((pos: string) => positionMap[pos])
              .map((pos: string) => {
                const p = positionMap[pos];
                return `<text x="${p.x}" y="${p.y}" text-anchor="${p.anchor}" dominant-baseline="middle" 
                         style="font-size: ${p.fontSize}px">${wmSettings.text}</text>`;
              })
              .join('\n');
            
            // Create SVG watermark
            const svgWatermark = `
              <svg width="${wmWidth}" height="${wmHeight}">
                <style>
                  text { 
                    fill: rgba(255,255,255,${wmSettings.opacity}); 
                    font-family: Arial, sans-serif;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                  }
                </style>
                ${textElements}
              </svg>
            `;
            
            const wmResult = await sharp(wmOriginalBuffer)
              .composite([{
                input: Buffer.from(svgWatermark),
                top: 0,
                left: 0
              }])
              .png()
              .toBuffer();
            
            // Upload result
            const { objectStorageClient: wmStorageClient, ObjectStorageService: WmStorageService } = await import('./replit_integrations/object_storage');
            const wmStorageService = new WmStorageService();
            const wmPrivateDir = wmStorageService.getPrivateObjectDir();
            const wmTimestamp = Date.now();
            const wmPath = `${wmPrivateDir}/edits/watermarked-${wmTimestamp}.png`;
            const wmPathParts = wmPath.split('/').filter(p => p);
            const wmBucket = wmStorageClient.bucket(wmPathParts[0]);
            const wmFile = wmBucket.file(wmPathParts.slice(1).join('/'));
            await wmFile.save(wmResult, { contentType: 'image/png' });
            output = getFullUrl(`/objects/edits/watermarked-${wmTimestamp}.png`);
            break;
          }

          case 'face-swap': {
            // Face swap
            // source = лицо которое берём (загруженное пользователем)
            // target = куда вставляем (основное изображение)
            const sourceFaceUrl = edit.prompt?.startsWith('TARGET:') 
              ? getFullUrl(edit.prompt.replace('TARGET:', ''))
              : imageUrl;
            console.log('Using AI for face swap');
            output = await ai.faceSwap(sourceFaceUrl, imageUrl, { userId, editId });
            break;
          }

          case 'blur-face': {
            // Blur face - use pre-selected faces from UI
            console.log('Using Sharp for blur-face with selected faces');
            
            // Parse settings from prompt
            let blurIntensity = 0.5;
            let selectedFaces: Array<{x: number, y: number, width: number, height: number}> = [];
            
            try {
              const settings = JSON.parse(edit.prompt || '{}');
              blurIntensity = settings.intensity || 0.5;
              selectedFaces = settings.faces || [];
            } catch (e) {
              console.log('Using default blur settings');
            }
            
            if (selectedFaces.length === 0) {
              throw new Error('Сначала обнаружьте и выберите лица для размытия');
            }
            
            // Convert intensity (0-1) to blur sigma (10-60)
            const blurSigma = Math.round(10 + blurIntensity * 50);
            console.log(`Blur intensity: ${blurIntensity}, sigma: ${blurSigma}, faces: ${selectedFaces.length}`);
            
            // Fetch original image
            const blurFaceOrigBuffer = await fetchImageBuffer(imageUrl);
            
            // Get image metadata
            const blurFaceMeta = await sharp(blurFaceOrigBuffer).metadata();
            const origWidth = blurFaceMeta.width || 800;
            const origHeight = blurFaceMeta.height || 600;
            
            // Create blurred version of full image
            const blurredBuffer = await sharp(blurFaceOrigBuffer)
              .blur(blurSigma)
              .toBuffer();
            
            // Build composite operations for each selected face
            const compositeOps: Array<{input: Buffer, left: number, top: number}> = [];
            
            for (const face of selectedFaces) {
              // Add padding around face (15%)
              const padding = 0.15;
              const padX = Math.round(face.width * padding);
              const padY = Math.round(face.height * padding);
              const x = Math.max(0, face.x - padX);
              const y = Math.max(0, face.y - padY);
              const w = Math.min(origWidth - x, face.width + padX * 2);
              const h = Math.min(origHeight - y, face.height + padY * 2);
              
              // Validate dimensions
              if (w < 10 || h < 10) continue;
              
              // Extract blurred face region
              const blurredFaceRegion = await sharp(blurredBuffer)
                .extract({ left: x, top: y, width: w, height: h })
                .ensureAlpha()
                .png()
                .toBuffer();
              
              // Create soft elliptical mask with feathered edges
              const featherRadius = Math.max(3, Math.min(w, h) / 12);
              const maskSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="${featherRadius}"/>
                  </filter>
                </defs>
                <ellipse cx="${w/2}" cy="${h/2}" rx="${w/2 * 0.82}" ry="${h/2 * 0.82}" fill="white" filter="url(#blur)"/>
              </svg>`;
              
              // Create mask as RGBA with white = opaque
              const softMask = await sharp(Buffer.from(maskSvg))
                .ensureAlpha()
                .png()
                .toBuffer();
              
              // Use Sharp composite with dest-in to apply mask as alpha
              const maskedFace = await sharp(blurredFaceRegion)
                .composite([{
                  input: softMask,
                  blend: 'dest-in'
                }])
                .png()
                .toBuffer();
              
              compositeOps.push({
                input: maskedFace,
                left: x,
                top: y
              });
            }
            
            // Composite all blurred faces onto original
            const blurFaceResult = await sharp(blurFaceOrigBuffer)
              .composite(compositeOps)
              .png()
              .toBuffer();
            
            // Upload result
            const { objectStorageClient: blurFaceClient, ObjectStorageService: BlurFaceService } = await import('./replit_integrations/object_storage');
            const blurFaceStorageService = new BlurFaceService();
            const blurFaceDir = blurFaceStorageService.getPrivateObjectDir();
            const blurFaceTimestamp = Date.now();
            
            const blurFacePath = `${blurFaceDir}/edits/blur-face-${blurFaceTimestamp}.png`;
            const blurFaceParts = blurFacePath.split('/').filter(p => p);
            const blurFaceBucket = blurFaceClient.bucket(blurFaceParts[0]);
            await blurFaceBucket.file(blurFaceParts.slice(1).join('/')).save(blurFaceResult, { contentType: 'image/png' });
            
            output = getFullUrl(`/objects/edits/blur-face-${blurFaceTimestamp}.png`);
            break;
          }

          default:
            throw new Error(`Unsupported tool type: ${toolType}`);
        }

        let resultUrl = extractResultUrl(output);
        console.log(`Result URL extracted: ${resultUrl.substring(0, 100)}...`);
        
        // If result is a base64 data URL (from RunPod), upload to storage
        if (resultUrl.startsWith('data:')) {
          console.log('Uploading RunPod base64 result to storage...');
          resultUrl = await uploadBase64Image(resultUrl, toolType);
          console.log(`Uploaded to: ${resultUrl}`);
        }
        
        await storage.updateEditStatus(editId, 'completed', resultUrl);
      } catch (error) {
        console.error("Processing failed:", error);
        const errorMessage = (error as Error).message;
        
        // Provide user-friendly error messages
        let friendlyError = errorMessage;
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          friendlyError = 'Превышен лимит запросов. Пожалуйста, подождите минуту и попробуйте снова.';
        } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          friendlyError = 'Ошибка авторизации API. Проверьте ваш API ключ.';
        } else if (errorMessage.includes('Could not extract URL')) {
          friendlyError = 'Модель не вернула результат. Попробуйте другой инструмент или изображение.';
        } else if (errorMessage.includes('RunPod')) {
          friendlyError = 'Ошибка RunPod API. Пожалуйста, попробуйте позже.';
        } else if (errorMessage.includes('endpoint ID not configured')) {
          friendlyError = 'Сервис временно недоступен. Используем резервный API.';
        }
        
        await storage.updateEditStatus(editId, 'failed', undefined, friendlyError);
      }
    })();

    res.json(await storage.getEdit(editId));
  });

  // Face detection endpoint for blur-face preview
  app.post('/api/detect-faces', isAuthenticated, async (req: any, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: 'Image URL is required' });
      }
      
      const fullImageUrl = imageUrl.startsWith('/') ? getFullUrl(imageUrl) : imageUrl;
      
      // Get image dimensions
      const imageBuffer = await fetchImageBuffer(fullImageUrl);
      const metadata = await sharp(imageBuffer).metadata();
      const origWidth = metadata.width || 800;
      const origHeight = metadata.height || 600;
      
      // Use Replicate grounding-dino for face detection
      const Replicate = (await import('replicate')).default;
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
      
      console.log('Detecting faces for preview...');
      const detectionResult = await replicate.run(
        "adirik/grounding-dino:efd10a8ddc57ea28773327e881ce95e20cc1d734c589f7dd01d2036921ed78aa",
        {
          input: {
            image: fullImageUrl,
            query: "human face. person face",
            box_threshold: 0.3,
            text_threshold: 0.25
          }
        }
      ) as any;
      
      console.log('Face detection result:', JSON.stringify(detectionResult).substring(0, 300));
      
      // Parse detection results
      let faces: Array<{id: number, x: number, y: number, width: number, height: number, confidence: number}> = [];
      
      if (detectionResult && detectionResult.detections && Array.isArray(detectionResult.detections)) {
        let faceId = 0;
        for (const det of detectionResult.detections) {
          if (det.bbox && Array.isArray(det.bbox) && det.bbox.length >= 4) {
            // grounding-dino returns normalized coordinates (0-1), detect by checking max value
            // If all values are between 0 and 1.5, treat as normalized (with small margin for floating point)
            const maxVal = Math.max(...det.bbox.map((v: number) => Math.abs(v)));
            const isNormalized = maxVal <= 1.5;
            
            let x, y, x2, y2;
            if (isNormalized) {
              // Clamp to 0-1 range before scaling
              x = Math.round(Math.max(0, Math.min(1, det.bbox[0])) * origWidth);
              y = Math.round(Math.max(0, Math.min(1, det.bbox[1])) * origHeight);
              x2 = Math.round(Math.max(0, Math.min(1, det.bbox[2])) * origWidth);
              y2 = Math.round(Math.max(0, Math.min(1, det.bbox[3])) * origHeight);
            } else {
              x = Math.round(Math.max(0, det.bbox[0]));
              y = Math.round(Math.max(0, det.bbox[1]));
              x2 = Math.round(Math.min(origWidth, det.bbox[2]));
              y2 = Math.round(Math.min(origHeight, det.bbox[3]));
            }
            
            const width = x2 - x;
            const height = y2 - y;
            
            // Skip invalid boxes
            if (width < 10 || height < 10) continue;
            
            const newFace = { 
              id: faceId++, 
              x, 
              y, 
              width,
              height,
              confidence: det.confidence || 0.5
            };
            // Filter duplicates
            const isDuplicate = faces.some(existing => 
              Math.abs(existing.x - newFace.x) < 50 && 
              Math.abs(existing.y - newFace.y) < 50
            );
            if (!isDuplicate && newFace.width > 30 && newFace.height > 30) {
              faces.push(newFace);
            }
          }
        }
      }
      
      res.json({ 
        faces, 
        imageWidth: origWidth, 
        imageHeight: origHeight 
      });
    } catch (error) {
      console.error('Face detection error:', error);
      res.status(500).json({ message: 'Failed to detect faces', error: (error as Error).message });
    }
  });

  // Helper function to translate non-English prompts to English using Gemini
  async function translatePromptToEnglish(prompt: string, apiKey: string): Promise<string> {
    // Check if prompt contains Cyrillic characters (Russian/Ukrainian)
    const hasCyrillic = /[\u0400-\u04FF]/.test(prompt);
    if (!hasCyrillic) {
      return prompt; // Already English or other Latin script
    }

    console.log('Detected non-English prompt, translating to English...');
    
    try {
      const translateResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ 
                text: `Translate the following image generation prompt to English. Keep the meaning and artistic intent. Only return the translated text, nothing else:\n\n${prompt}` 
              }]
            }]
          })
        }
      );

      if (translateResponse.ok) {
        const data = await translateResponse.json();
        const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translatedText) {
          console.log('Translated prompt:', translatedText);
          return translatedText;
        }
      }
    } catch (err) {
      console.error('Translation failed, using original prompt:', err);
    }
    
    return prompt;
  }

  // Text-to-image generation endpoint (Google Gemini Imagen 3)
  app.post('/api/generate-image', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, referenceImage } = req.body;
      const userId = (req.user as any).id;
      const cost = 5; // Fixed cost for generation
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      // Check credits first
      const currentCredits = await storage.getUserCredits(userId);
      if (currentCredits < cost) {
        return res.status(402).json({ message: 'Insufficient credits' });
      }

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      console.log('Using Google Gemini 2.0 Flash for text-to-image generation');
      
      // Translate prompt to English for better results
      const englishPrompt = await translatePromptToEnglish(prompt, geminiApiKey);
      
      // Build request parts - include reference image if provided
      const parts: any[] = [];
      
      if (referenceImage && typeof referenceImage === 'string' && referenceImage.startsWith('data:')) {
        // Extract base64 and mime type from data URL
        const matches = referenceImage.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const [, mimeType, base64Data] = matches;
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
          parts.push({ text: `Based on this reference image, generate a new image: ${englishPrompt}` });
          console.log('Reference image included in request');
        } else {
          parts.push({ text: `Generate an image: ${englishPrompt}` });
        }
      } else {
        parts.push({ text: `Generate an image: ${englishPrompt}` });
      }
      
      // Call Gemini 2.0 Flash API for image generation
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: parts
            }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"]
            }
          })
        }
      );

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text();
        console.error('Gemini API error:', errorData);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      console.log('Gemini response structure:', JSON.stringify(geminiData, null, 2).slice(0, 1000));
      
      // Extract base64 image from response
      let imageBase64: string | null = null;
      let mimeType = 'image/png';
      
      // Navigate the response structure
      if (geminiData.candidates && geminiData.candidates[0]?.content?.parts) {
        for (const part of geminiData.candidates[0].content.parts) {
          if (part.inlineData) {
            imageBase64 = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
            break;
          }
        }
      }
      
      if (!imageBase64) {
        console.error('Unexpected Gemini response:', JSON.stringify(geminiData, null, 2));
        throw new Error('Could not extract image from Gemini response');
      }
      
      // Upload to object storage
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      const imageUrl = await uploadBase64Image(dataUrl, 'text-to-image');
      console.log('Uploaded Gemini image to:', imageUrl);

      // Deduct credits only after successful generation
      await storage.deductCredits(userId, cost, 'Text-to-image generation (Gemini Imagen 3)');

      res.json({ imageUrl });
    } catch (error) {
      console.error('Image generation failed:', error);
      res.status(500).json({ message: 'Generation failed: ' + (error as Error).message });
    }
  });

  // Download endpoint for mobile - forces file download with proper headers
  app.get('/api/download', async (req, res) => {
    try {
      const { url, filename, inline, bgcolor, bgimage } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: 'URL is required' });
      }
      
      const downloadFilename = (typeof filename === 'string' && filename) 
        ? filename 
        : `neurapix-${Date.now()}.png`;
      
      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      let buffer = Buffer.from(await response.arrayBuffer());
      let contentType = response.headers.get('content-type') || 'image/png';
      
      const sharp = (await import('sharp')).default;
      
      // If bgimage is specified, use photo as background
      if (typeof bgimage === 'string' && bgimage.length > 0) {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        const width = metadata.width || 1000;
        const height = metadata.height || 1000;
        
        // Fetch background image
        const bgResponse = await fetch(bgimage);
        if (bgResponse.ok) {
          const bgBuffer = Buffer.from(await bgResponse.arrayBuffer());
          
          // Resize background to match foreground dimensions
          const resizedBg = await sharp(bgBuffer)
            .resize(width, height, { fit: 'cover' })
            .png()
            .toBuffer();
          
          // Composite foreground over background
          buffer = await sharp(resizedBg)
            .composite([{ input: buffer, blend: 'over' }])
            .png()
            .toBuffer();
          
          contentType = 'image/png';
        }
      }
      // If bgcolor is specified, add colored background using Sharp
      else if (typeof bgcolor === 'string' && bgcolor.startsWith('#')) {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        
        // Parse hex color to RGB
        const hex = bgcolor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Create colored background and composite image on top
        const background = await sharp({
          create: {
            width: metadata.width || 1000,
            height: metadata.height || 1000,
            channels: 3,
            background: { r, g, b }
          }
        }).png().toBuffer();
        
        buffer = await sharp(background)
          .composite([{ input: buffer, blend: 'over' }])
          .png()
          .toBuffer();
        
        contentType = 'image/png';
      }
      
      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', buffer.byteLength);
      res.setHeader('Cache-Control', 'no-cache');
      
      // If inline=true, don't force download (for canvas usage)
      if (inline !== 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      }
      
      res.send(buffer);
    } catch (error) {
      console.error('Download failed:', error);
      res.status(500).json({ message: 'Download failed' });
    }
  });

  // Pexels API for background search
  app.get('/api/pexels/search', async (req, res) => {
    try {
      const query = req.query.query as string || 'nature';
      const perPage = parseInt(req.query.per_page as string) || 15;
      
      const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
      
      if (!PEXELS_API_KEY) {
        // Return sample images if no API key configured
        const sampleImages = [
          { id: 1, src: 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg?auto=compress&cs=tinysrgb&w=400', thumb: 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg?auto=compress&cs=tinysrgb&w=200' },
          { id: 2, src: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=400', thumb: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=200' },
          { id: 3, src: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=400', thumb: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=200' },
          { id: 4, src: 'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg?auto=compress&cs=tinysrgb&w=400', thumb: 'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg?auto=compress&cs=tinysrgb&w=200' },
          { id: 5, src: 'https://images.pexels.com/photos/1906667/pexels-photo-1906667.jpeg?auto=compress&cs=tinysrgb&w=400', thumb: 'https://images.pexels.com/photos/1906667/pexels-photo-1906667.jpeg?auto=compress&cs=tinysrgb&w=200' },
          { id: 6, src: 'https://images.pexels.com/photos/1310847/pexels-photo-1310847.jpeg?auto=compress&cs=tinysrgb&w=400', thumb: 'https://images.pexels.com/photos/1310847/pexels-photo-1310847.jpeg?auto=compress&cs=tinysrgb&w=200' },
          { id: 7, src: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=400', thumb: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=200' },
          { id: 8, src: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg?auto=compress&cs=tinysrgb&w=400', thumb: 'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg?auto=compress&cs=tinysrgb&w=200' },
          { id: 9, src: 'https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=400', thumb: 'https://images.pexels.com/photos/33109/fall-autumn-red-season.jpg?auto=compress&cs=tinysrgb&w=200' },
        ];
        return res.json({ photos: sampleImages });
      }
      
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const photos = data.photos.map((photo: any) => ({
        id: photo.id,
        src: photo.src.large,
        thumb: photo.src.small,
      }));
      
      res.json({ photos });
    } catch (error) {
      console.error('Pexels search error:', error);
      res.status(500).json({ message: 'Failed to search photos' });
    }
  });

  return httpServer;
}
