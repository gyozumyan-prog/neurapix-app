import { db } from './db';
import { aiJobs } from '../shared/models/auth';
import { ProviderFactory } from './providers/factory';
import { ProcessInput, ProcessResult } from './providers/types';
import { eq } from 'drizzle-orm';

export interface AIProcessOptions {
  userId?: string;
  editId?: number;
  imageUrl: string;
  maskUrl?: string;
  prompt?: string;
  params?: Record<string, any>;
}

export interface AIProcessResult {
  success: boolean;
  resultUrl?: string;
  error?: string;
  jobId?: string;
  processingTimeMs?: number;
}

export class AIService {
  static async process(toolId: string, options: AIProcessOptions): Promise<AIProcessResult> {
    const startTime = Date.now();
    let jobId: string | undefined;

    try {
      const [inserted] = await db.insert(aiJobs).values({
        userId: options.userId || null,
        editId: options.editId || null,
        toolId,
        status: 'pending',
        inputData: {
          imageUrl: options.imageUrl,
          maskUrl: options.maskUrl,
          prompt: options.prompt,
          params: options.params
        }
      }).returning({ id: aiJobs.id });

      jobId = inserted.id;

      await db.update(aiJobs)
        .set({ status: 'processing', startedAt: new Date() })
        .where(eq(aiJobs.id, jobId));

      const input: ProcessInput = {
        imageUrl: options.imageUrl,
        maskUrl: options.maskUrl,
        prompt: options.prompt,
        params: options.params
      };

      const result = await ProviderFactory.processWithFallback(toolId, input);
      const processingTime = Date.now() - startTime;

      if (result.success) {
        if (jobId) {
          await db.update(aiJobs)
            .set({
              status: 'done',
              outputData: { resultUrl: result.resultUrl, metadata: result.metadata },
              processingTimeMs: processingTime,
              completedAt: new Date(),
              providerId: result.metadata?.provider || null
            })
            .where(eq(aiJobs.id, jobId));
        }

        return {
          success: true,
          resultUrl: result.resultUrl,
          jobId,
          processingTimeMs: processingTime
        };
      } else {
        if (jobId) {
          await db.update(aiJobs)
            .set({
              status: 'failed',
              errorMessage: result.error,
              processingTimeMs: processingTime,
              completedAt: new Date()
            })
            .where(eq(aiJobs.id, jobId));
        }

        return {
          success: false,
          error: result.error,
          jobId,
          processingTimeMs: processingTime
        };
      }
    } catch (err: any) {
      const processingTime = Date.now() - startTime;
      
      if (jobId) {
        await db.update(aiJobs)
          .set({
            status: 'failed',
            errorMessage: err.message,
            processingTimeMs: processingTime,
            completedAt: new Date()
          })
          .where(eq(aiJobs.id, jobId));
      }

      return {
        success: false,
        error: err.message,
        jobId,
        processingTimeMs: processingTime
      };
    }
  }

  static async upscale(imageUrl: string, scale: number = 4, enhance: boolean = false, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('upscale', {
      ...options,
      imageUrl,
      params: { scale, enhance, ...options.params }
    });
  }

  static async enhance(imageUrl: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('enhance', {
      ...options,
      imageUrl
    });
  }

  static async faceRestore(imageUrl: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('face-restore', {
      ...options,
      imageUrl
    });
  }

  static async portraitEnhance(imageUrl: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('portrait-enhance', {
      ...options,
      imageUrl
    });
  }

  static async applyMakeup(imageUrl: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('makeup', {
      ...options,
      imageUrl
    });
  }

  static async faceSwap(sourceFaceUrl: string, targetImageUrl: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('face-swap', {
      ...options,
      imageUrl: targetImageUrl,
      params: { sourceFace: sourceFaceUrl, ...options.params }
    });
  }

  static async removeBackground(imageUrl: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('background-remove', {
      ...options,
      imageUrl
    });
  }

  static async changeBackground(imageUrl: string, prompt: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('background-change', {
      ...options,
      imageUrl,
      prompt
    });
  }

  static async blurBackground(imageUrl: string, blurAmount: number = 10, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('blur-background', {
      ...options,
      imageUrl,
      params: { blurAmount, ...options.params }
    });
  }

  static async restoreOldPhoto(imageUrl: string, pro: boolean = false, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    const toolId = pro ? 'old-photo-restore-pro' : 'old-photo-restore';
    return this.process(toolId, {
      ...options,
      imageUrl
    });
  }

  static async colorize(imageUrl: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('colorize', {
      ...options,
      imageUrl
    });
  }

  static async removeObject(imageUrl: string, maskUrl: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('object-removal', {
      ...options,
      imageUrl,
      maskUrl
    });
  }

  static async inpaint(imageUrl: string, maskUrl: string, prompt: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('inpainting', {
      ...options,
      imageUrl,
      maskUrl,
      prompt
    });
  }

  static async outpaint(imageUrl: string, direction: string, prompt: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('outpainting', {
      ...options,
      imageUrl,
      prompt,
      params: { direction, ...options.params }
    });
  }

  static async artStyle(imageUrl: string, style: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('art-style', {
      ...options,
      imageUrl,
      prompt: style,
      params: { style, ...options.params }
    });
  }

  static async textToImage(prompt: string, options: Partial<AIProcessOptions> = {}): Promise<AIProcessResult> {
    return this.process('text-to-image', {
      ...options,
      imageUrl: '',
      prompt
    });
  }

  static async getJobStatus(jobId: string): Promise<{ status: string; result?: any; error?: string } | null> {
    const jobs = await db.select().from(aiJobs).where(eq(aiJobs.id, jobId)).limit(1);
    
    if (jobs.length === 0) return null;
    
    const job = jobs[0];
    return {
      status: job.status,
      result: job.outputData || undefined,
      error: job.errorMessage || undefined
    };
  }
}

export async function upscaleImage(imageUrl: string, scale: number = 4, enhance: boolean = false, options: any = {}): Promise<string> {
  const result = await AIService.upscale(imageUrl, scale, enhance, options);
  if (!result.success) throw new Error(result.error || 'Upscale failed');
  return result.resultUrl!;
}

export async function enhanceImage(imageUrl: string): Promise<string> {
  const result = await AIService.enhance(imageUrl);
  if (!result.success) throw new Error(result.error || 'Enhance failed');
  return result.resultUrl!;
}

export async function restoreFace(imageUrl: string): Promise<string> {
  const result = await AIService.faceRestore(imageUrl);
  if (!result.success) throw new Error(result.error || 'Face restore failed');
  return result.resultUrl!;
}

export async function portraitEnhance(imageUrl: string): Promise<string> {
  const result = await AIService.portraitEnhance(imageUrl);
  if (!result.success) throw new Error(result.error || 'Portrait enhance failed');
  return result.resultUrl!;
}

export async function faceSwap(sourceFaceUrl: string, targetImageUrl: string): Promise<string> {
  const result = await AIService.faceSwap(sourceFaceUrl, targetImageUrl);
  if (!result.success) throw new Error(result.error || 'Face swap failed');
  return result.resultUrl!;
}

export async function removeBackground(imageUrl: string): Promise<string> {
  const result = await AIService.removeBackground(imageUrl);
  if (!result.success) throw new Error(result.error || 'Background remove failed');
  return result.resultUrl!;
}

export async function colorize(imageUrl: string): Promise<string> {
  const result = await AIService.colorize(imageUrl);
  if (!result.success) throw new Error(result.error || 'Colorize failed');
  return result.resultUrl!;
}

export async function restoreOldPhoto(imageUrl: string, pro: boolean = false): Promise<string> {
  const result = await AIService.restoreOldPhoto(imageUrl, pro);
  if (!result.success) throw new Error(result.error || 'Old photo restore failed');
  return result.resultUrl!;
}

export async function removeObject(imageUrl: string, maskUrl: string): Promise<string> {
  const result = await AIService.removeObject(imageUrl, maskUrl);
  if (!result.success) throw new Error(result.error || 'Object removal failed');
  return result.resultUrl!;
}

export async function textToImage(prompt: string): Promise<string> {
  const result = await AIService.textToImage(prompt);
  if (!result.success) throw new Error(result.error || 'Text to image failed');
  return result.resultUrl!;
}

export { AIService as default };
