import { AIProvider, ProcessInput, ProcessResult, ProviderConfig } from './types';

export class ReplicateProvider implements AIProvider {
  readonly type = 'replicate';

  async processImage(input: ProcessInput, config: ProviderConfig): Promise<ProcessResult> {
    const startTime = Date.now();
    
    try {
      const apiKey = process.env.REPLICATE_API_TOKEN;
      if (!apiKey) {
        return { success: false, error: 'REPLICATE_API_TOKEN not configured' };
      }

      const model = config.model || config.endpoint;
      if (!model) {
        return { success: false, error: 'Model not configured for Replicate provider' };
      }

      const timeout = config.config?.timeout || 300;
      const maxRetries = config.config?.retries || 2;

      // Convert image URL to base64 if needed (Replicate requires base64 data URLs)
      const processedInput = await this.prepareInput(input, config);
      const payload = this.buildPayload(processedInput, config);
      
      let lastError = '';
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version: model,
              input: payload,
            }),
          });

          if (!response.ok) {
            lastError = `HTTP ${response.status}: ${await response.text()}`;
            continue;
          }

          const data = await response.json() as { id: string; urls?: { get: string } };
          const predictionId = data.id;

          if (!predictionId) {
            return { success: false, error: 'No prediction ID returned' };
          }

          const result = await this.pollForResult(predictionId, apiKey, timeout * 1000);
          
          const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;

          return {
            success: true,
            resultUrl: outputUrl,
            processingTimeMs: Date.now() - startTime,
            metadata: { predictionId, provider: 'replicate', model }
          };
        } catch (err: any) {
          lastError = err.message;
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          }
        }
      }

      return { success: false, error: lastError, processingTimeMs: Date.now() - startTime };
    } catch (err: any) {
      return { success: false, error: err.message, processingTimeMs: Date.now() - startTime };
    }
  }

  private async prepareInput(input: ProcessInput, config: ProviderConfig): Promise<ProcessInput> {
    // Always convert to base64 for Replicate (most models require it)
    const useBase64 = config.config?.useBase64 !== false; // Default true
    
    if (!useBase64 || !input.imageUrl) {
      return input;
    }

    try {
      const base64Image = await this.imageUrlToBase64(input.imageUrl);
      const processedInput: ProcessInput = {
        ...input,
        imageUrl: `data:image/jpeg;base64,${base64Image}`,
      };

      if (input.maskUrl) {
        const base64Mask = await this.imageUrlToBase64(input.maskUrl);
        processedInput.maskUrl = `data:image/png;base64,${base64Mask}`;
      }

      return processedInput;
    } catch (err) {
      console.error('Failed to convert image to base64, using original URL:', err);
      return input;
    }
  }

  private async imageUrlToBase64(imageUrl: string): Promise<string> {
    // Handle internal object storage URLs
    let fetchUrl = imageUrl;
    if (imageUrl.startsWith('/objects/')) {
      fetchUrl = `https://neurapix.net${imageUrl}`;
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  }

  private buildPayload(input: ProcessInput, config: ProviderConfig): Record<string, any> {
    // Get custom image key from config (default: 'image')
    const imageKey = config.config?.imageKey || 'image';
    
    const basePayload: Record<string, any> = {
      [imageKey]: input.imageUrl,
    };

    if (input.maskUrl) {
      const maskKey = config.config?.maskKey || 'mask';
      basePayload[maskKey] = input.maskUrl;
    }

    if (input.prompt) {
      basePayload.prompt = input.prompt;
    }

    // Add static params from config first
    if (config.config?.params) {
      Object.assign(basePayload, config.config.params);
    }

    // Override with dynamic params from input
    if (input.params) {
      Object.assign(basePayload, input.params);
    }

    return basePayload;
  }

  private async pollForResult(
    predictionId: string,
    apiKey: string,
    timeoutMs: number
  ): Promise<any> {
    const statusUrl = `https://api.replicate.com/v1/predictions/${predictionId}`;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const response = await fetch(statusUrl, {
        headers: { 'Authorization': `Token ${apiKey}` }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json() as { status: string; output?: any; error?: string };

      if (data.status === 'succeeded') {
        return data;
      }

      if (data.status === 'failed' || data.status === 'canceled') {
        throw new Error(data.error || 'Prediction failed');
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    throw new Error('Timeout waiting for result');
  }

  async checkHealth(config: ProviderConfig): Promise<boolean> {
    try {
      const apiKey = process.env.REPLICATE_API_TOKEN;
      if (!apiKey) return false;

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'GET',
        headers: { 'Authorization': `Token ${apiKey}` }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  getCapabilities(): string[] {
    return ['upscale', 'enhance', 'face-restore', 'background-remove', 'colorize', 'inpaint', 'text-to-image'];
  }
}
