import { AIProvider, ProcessInput, ProcessResult, ProviderConfig } from './types';
import * as runpod from '../runpod';

export class RunPodProvider implements AIProvider {
  readonly type = 'runpod';

  // Get endpoint ID from config - supports both direct endpoint and environment variable
  private getEndpointId(config: ProviderConfig): string | null {
    // First try direct endpoint from config
    if (config.endpoint && config.endpoint.trim()) {
      return config.endpoint.trim();
    }
    
    // Then try environment variable
    if (config.apiKeyEnvVar) {
      const endpointId = process.env[config.apiKeyEnvVar];
      if (endpointId) {
        return endpointId;
      }
    }
    
    return null;
  }

  async processImage(input: ProcessInput, config: ProviderConfig): Promise<ProcessResult> {
    const startTime = Date.now();
    
    try {
      const toolId = config.toolId;
      let resultUrl: string;

      // Check if we have a custom endpoint configured
      const customEndpointId = this.getEndpointId(config);
      
      // If custom endpoint is set and it's different from the default, use generic call
      if (customEndpointId && config.endpoint && config.endpoint.trim()) {
        console.log(`Using custom RunPod endpoint for ${toolId}: ${customEndpointId}`);
        resultUrl = await runpod.callGenericEndpoint({
          endpointId: customEndpointId,
          imageUrl: input.imageUrl,
          maskUrl: input.maskUrl,
          prompt: input.prompt,
          params: { ...config.config?.params, ...input.params },
          timeout: (config.config?.timeout || 300) * 1000,
          // Use configurable keys from admin panel
          imageKey: config.config?.imageKey || 'image',
          maskKey: config.config?.maskKey || 'mask',
          promptKey: (config.config as any)?.promptKey || 'prompt'
        });
      } else {
        // Use the default hardcoded methods for backward compatibility
        resultUrl = await this.processWithDefaultMethod(toolId, input, config);
      }

      return {
        success: true,
        resultUrl,
        processingTimeMs: Date.now() - startTime,
        metadata: { provider: 'runpod', model: config.model, toolId, endpoint: customEndpointId }
      };
    } catch (err: any) {
      return { 
        success: false, 
        error: err.message, 
        processingTimeMs: Date.now() - startTime 
      };
    }
  }

  // Default processing methods for backward compatibility
  private async processWithDefaultMethod(toolId: string, input: ProcessInput, config: ProviderConfig): Promise<string> {
    switch (toolId) {
      case 'upscale': {
        const scale = input.params?.scale || 4;
        const enhance = input.params?.enhance || false;
        const options = input.params?.forceMaxDim ? { forceMaxDim: input.params.forceMaxDim } : {};
        return await runpod.upscaleImage(input.imageUrl, scale, enhance, options);
      }

      case 'upscale-8x': {
        const options = input.params?.forceMaxDim ? { forceMaxDim: input.params.forceMaxDim } : {};
        return await runpod.upscaleImage(input.imageUrl, 4, false, options);
      }

      case 'enhance': {
        return await runpod.upscaleImage(input.imageUrl, 2, true);
      }

      case 'face-restore': {
        return await runpod.restoreFace(input.imageUrl);
      }

      case 'portrait-enhance': {
        return await runpod.portraitEnhance(input.imageUrl);
      }

      case 'makeup': {
        // Default to GFPGAN if no custom endpoint
        return await runpod.restoreFace(input.imageUrl);
      }

      case 'face-swap': {
        const sourceFace = input.params?.sourceFace;
        if (!sourceFace) {
          throw new Error('Source face URL required for face-swap');
        }
        return await runpod.faceSwap(sourceFace, input.imageUrl);
      }

      case 'background-remove': {
        return await runpod.removeBackground(input.imageUrl);
      }

      case 'background-change': {
        if (input.prompt) {
          const subjectBase64 = await runpod.removeBackground(input.imageUrl);
          return subjectBase64;
        }
        throw new Error('Prompt required for background change');
      }

      case 'blur-background': {
        const subjectUrl = await runpod.removeBackground(input.imageUrl);
        return subjectUrl;
      }

      case 'old-photo-restore': {
        return await runpod.restoreOldPhoto(input.imageUrl, false);
      }

      case 'old-photo-restore-pro': {
        return await runpod.restoreOldPhoto(input.imageUrl, true);
      }

      case 'colorize': {
        return await runpod.colorize(input.imageUrl);
      }

      case 'object-removal': {
        if (!input.maskUrl) {
          throw new Error('Mask URL required for object removal');
        }
        return await runpod.removeObject(input.imageUrl, input.maskUrl);
      }

      case 'inpainting': {
        if (!input.maskUrl || !input.prompt) {
          throw new Error('Mask URL and prompt required for inpainting');
        }
        return await runpod.removeObject(input.imageUrl, input.maskUrl);
      }

      case 'outpainting': {
        throw new Error('Outpainting requires custom FLUX implementation');
      }

      case 'art-style': {
        const style = input.params?.style || input.prompt || 'oil painting';
        return await runpod.artStyle(input.imageUrl, style);
      }

      case 'text-to-image': {
        if (!input.prompt) {
          throw new Error('Prompt required for text-to-image');
        }
        return await runpod.textToImage(input.prompt);
      }

      default:
        throw new Error(`Unsupported tool: ${toolId}`);
    }
  }

  async checkHealth(config: ProviderConfig): Promise<boolean> {
    try {
      const endpointId = this.getEndpointId(config);
      if (!endpointId) return false;

      const apiKey = process.env.RUNPOD_API_KEY;
      if (!apiKey) return false;

      const response = await fetch(`https://api.runpod.ai/v2/${endpointId}/health`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  getCapabilities(): string[] {
    return [
      'upscale', 'upscale-8x', 'enhance', 'face-restore', 'portrait-enhance', 'makeup', 'face-swap',
      'background-remove', 'background-change', 'blur-background',
      'old-photo-restore', 'old-photo-restore-pro', 'colorize',
      'object-removal', 'inpainting', 'outpainting', 'art-style', 'text-to-image'
    ];
  }
}
