import { db } from './db';
import { aiJobs, providerConfigs } from '../shared/models/auth';
import { ProviderFactory } from './providers/factory';
import { eq, and } from 'drizzle-orm';
import * as runpod from './runpod';

export interface ProcessOptions {
  userId?: string;
  editId?: number;
}

async function hasActiveProvider(toolId: string): Promise<boolean> {
  const configs = await db
    .select()
    .from(providerConfigs)
    .where(and(eq(providerConfigs.toolId, toolId), eq(providerConfigs.isActive, 1)))
    .limit(1);
  return configs.length > 0;
}

async function logJob(toolId: string, status: string, options: ProcessOptions, output?: any, error?: string, processingTimeMs?: number): Promise<void> {
  try {
    await db.insert(aiJobs).values({
      userId: options.userId || null,
      editId: options.editId || null,
      toolId,
      status,
      inputData: options,
      outputData: output ? { resultUrl: output } : null,
      errorMessage: error || null,
      processingTimeMs: processingTimeMs || null,
      completedAt: new Date()
    });
  } catch (err) {
    console.error('Failed to log AI job:', err);
  }
}

export async function upscaleImage(
  imageUrl: string, 
  scale: 2 | 4 = 4, 
  enhance: boolean = false, 
  processingOptions: any = {},
  jobOptions: ProcessOptions = {}
): Promise<string> {
  const startTime = Date.now();
  const toolId = 'upscale';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, {
        imageUrl,
        params: { scale, enhance, ...processingOptions }
      });
      
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.upscaleImage(imageUrl, scale, enhance, processingOptions);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function restoreFace(imageUrl: string, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = 'face-restore';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, { imageUrl });
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.restoreFace(imageUrl);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function portraitEnhance(imageUrl: string, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = 'portrait-enhance';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, { imageUrl });
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.portraitEnhance(imageUrl);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function applyMakeup(imageUrl: string, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = 'makeup';
  
  try {
    // Always use provider from database config - no hardcoded fallback
    const result = await ProviderFactory.processWithFallback(toolId, { imageUrl });
    if (result.success && result.resultUrl) {
      await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
      return result.resultUrl;
    }
    
    // If provider failed, throw error with details
    throw new Error(result.error || 'Makeup processing failed');
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function removeBackground(imageUrl: string, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = 'background-remove';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, { imageUrl });
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.removeBackground(imageUrl);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function restoreOldPhoto(imageUrl: string, withScratch: boolean = false, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = withScratch ? 'old-photo-restore-pro' : 'old-photo-restore';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, { imageUrl });
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.restoreOldPhoto(imageUrl, withScratch);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function colorize(imageUrl: string, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = 'colorize';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, { imageUrl });
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.colorize(imageUrl);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function removeObject(imageUrl: string, maskUrl: string | undefined, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = 'object-removal';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, { imageUrl, maskUrl });
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.removeObject(imageUrl, maskUrl);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function textToImage(prompt: string, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = 'text-to-image';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, { imageUrl: '', prompt });
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.textToImage(prompt);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function faceSwap(sourceImageUrl: string, targetImageUrl: string, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = 'face-swap';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, { 
        imageUrl: targetImageUrl, 
        params: { sourceFace: sourceImageUrl } 
      });
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.faceSwap(sourceImageUrl, targetImageUrl);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export async function artStyle(imageUrl: string, stylePrompt: string, jobOptions: ProcessOptions = {}): Promise<string> {
  const startTime = Date.now();
  const toolId = 'art-style';
  
  try {
    if (await hasActiveProvider(toolId)) {
      const result = await ProviderFactory.processWithFallback(toolId, { 
        imageUrl, 
        prompt: stylePrompt 
      });
      if (result.success && result.resultUrl) {
        await logJob(toolId, 'done', jobOptions, result.resultUrl, undefined, Date.now() - startTime);
        return result.resultUrl;
      }
    }

    const result = await runpod.artStyle(imageUrl, stylePrompt);
    await logJob(toolId, 'done', jobOptions, result, undefined, Date.now() - startTime);
    return result;
  } catch (err: any) {
    await logJob(toolId, 'failed', jobOptions, undefined, err.message, Date.now() - startTime);
    throw err;
  }
}

export { isRunPodConfigured } from './runpod';
