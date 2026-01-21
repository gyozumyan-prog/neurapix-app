export interface ProviderConfig {
  id: string;
  name: string;
  providerType: string;
  toolId: string;
  endpoint?: string | null;
  apiKeyEnvVar?: string | null;
  model?: string | null;
  config?: {
    timeout?: number;
    retries?: number;
    params?: Record<string, any>;
    imageKey?: string;
    maskKey?: string;
    useBase64?: boolean;
  } | null;
  priority: number;
  isActive: number;
  isDefault: number;
}

export interface ProcessInput {
  imageUrl: string;
  maskUrl?: string;
  prompt?: string;
  params?: Record<string, any>;
}

export interface ProcessResult {
  success: boolean;
  resultUrl?: string;
  error?: string;
  processingTimeMs?: number;
  metadata?: Record<string, any>;
}

export interface AIProvider {
  readonly type: string;
  
  processImage(input: ProcessInput, config: ProviderConfig): Promise<ProcessResult>;
  
  checkHealth(config: ProviderConfig): Promise<boolean>;
  
  getCapabilities(): string[];
}
