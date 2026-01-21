import sharp from 'sharp';
import { AIProvider, ProcessInput, ProcessResult, ProviderConfig } from './types';

export class LocalProvider implements AIProvider {
  readonly type = 'local';

  async processImage(input: ProcessInput, config: ProviderConfig): Promise<ProcessResult> {
    const startTime = Date.now();
    
    try {
      const toolId = config.toolId;
      
      switch (toolId) {
        case 'hdr':
          return await this.processHDR(input, config, startTime);
        case 'watermark-add':
          return await this.processWatermark(input, config, startTime);
        case 'compress':
          return await this.processCompress(input, config, startTime);
        case 'convert':
          return await this.processConvert(input, config, startTime);
        default:
          return { 
            success: false, 
            error: `Local processing not supported for tool: ${toolId}`,
            processingTimeMs: Date.now() - startTime
          };
      }
    } catch (err: any) {
      return { 
        success: false, 
        error: err.message, 
        processingTimeMs: Date.now() - startTime 
      };
    }
  }

  private async processHDR(input: ProcessInput, config: ProviderConfig, startTime: number): Promise<ProcessResult> {
    const response = await fetch(input.imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const hdrStrength = input.params?.strength || 1.5;
    const saturationBoost = input.params?.saturation || 1.2;
    
    const processedBuffer = await sharp(buffer)
      .modulate({
        brightness: 1 + (hdrStrength - 1) * 0.1,
        saturation: saturationBoost,
      })
      .sharpen({ sigma: 1.5 })
      .normalize()
      .jpeg({ quality: config.config?.params?.quality || 90 })
      .toBuffer();

    const base64 = processedBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return {
      success: true,
      resultUrl: dataUrl,
      processingTimeMs: Date.now() - startTime,
      metadata: { provider: 'local', tool: 'hdr' }
    };
  }

  private async processWatermark(input: ProcessInput, config: ProviderConfig, startTime: number): Promise<ProcessResult> {
    const response = await fetch(input.imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const watermarkText = input.params?.text || 'NeuraPix';
    const position = input.params?.position || 'bottom-right';
    const opacity = input.params?.opacity || 0.5;
    
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;
    
    const fontSize = Math.max(width * 0.03, 16);
    
    const svgText = `
      <svg width="${width}" height="${height}">
        <text 
          x="${position.includes('right') ? width - 20 : 20}" 
          y="${position.includes('bottom') ? height - 20 : 40}"
          text-anchor="${position.includes('right') ? 'end' : 'start'}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          fill="white"
          opacity="${opacity}"
          style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5)"
        >${watermarkText}</text>
      </svg>
    `;

    const processedBuffer = await sharp(buffer)
      .composite([{
        input: Buffer.from(svgText),
        gravity: 'southeast',
      }])
      .jpeg({ quality: config.config?.params?.quality || 90 })
      .toBuffer();

    const base64 = processedBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return {
      success: true,
      resultUrl: dataUrl,
      processingTimeMs: Date.now() - startTime,
      metadata: { provider: 'local', tool: 'watermark' }
    };
  }

  private async processCompress(input: ProcessInput, config: ProviderConfig, startTime: number): Promise<ProcessResult> {
    const response = await fetch(input.imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const quality = input.params?.quality || 70;
    
    const processedBuffer = await sharp(buffer)
      .jpeg({ quality })
      .toBuffer();

    const base64 = processedBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return {
      success: true,
      resultUrl: dataUrl,
      processingTimeMs: Date.now() - startTime,
      metadata: { provider: 'local', tool: 'compress' }
    };
  }

  private async processConvert(input: ProcessInput, config: ProviderConfig, startTime: number): Promise<ProcessResult> {
    const response = await fetch(input.imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const format = input.params?.format || 'jpeg';
    
    let sharpInstance = sharp(buffer);
    let mimeType = 'image/jpeg';

    switch (format) {
      case 'png':
        sharpInstance = sharpInstance.png();
        mimeType = 'image/png';
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: 90 });
        mimeType = 'image/webp';
        break;
      default:
        sharpInstance = sharpInstance.jpeg({ quality: 90 });
    }

    const processedBuffer = await sharpInstance.toBuffer();
    const base64 = processedBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return {
      success: true,
      resultUrl: dataUrl,
      processingTimeMs: Date.now() - startTime,
      metadata: { provider: 'local', tool: 'convert', format }
    };
  }

  async checkHealth(_config: ProviderConfig): Promise<boolean> {
    return true;
  }

  getCapabilities(): string[] {
    return ['hdr', 'watermark-add', 'compress', 'convert'];
  }
}
