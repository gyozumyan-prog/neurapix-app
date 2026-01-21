import { db } from '../db';
import { providerConfigs } from '../../shared/models/auth';
import { eq, and, desc } from 'drizzle-orm';
import { AIProvider, ProcessInput, ProcessResult, ProviderConfig } from './types';
import { RunPodProvider } from './runpod.provider';
import { ReplicateProvider } from './replicate.provider';
import { LocalProvider } from './local.provider';

const providers: Record<string, AIProvider> = {
  runpod: new RunPodProvider(),
  replicate: new ReplicateProvider(),
  local: new LocalProvider(),
};

export class ProviderFactory {
  static getProvider(type: string): AIProvider | null {
    return providers[type] || null;
  }

  static async getConfigForTool(toolId: string): Promise<ProviderConfig | null> {
    const configs = await db
      .select()
      .from(providerConfigs)
      .where(
        and(
          eq(providerConfigs.toolId, toolId),
          eq(providerConfigs.isActive, 1)
        )
      )
      .orderBy(desc(providerConfigs.isDefault), providerConfigs.priority)
      .limit(1);

    if (configs.length === 0) return null;

    const config = configs[0];
    return {
      id: config.id,
      name: config.name,
      providerType: config.providerType,
      toolId: config.toolId,
      endpoint: config.endpoint,
      apiKeyEnvVar: config.apiKeyEnvVar,
      model: config.model,
      config: config.config as any,
      priority: config.priority,
      isActive: config.isActive,
      isDefault: config.isDefault,
    };
  }

  static async getAllConfigsForTool(toolId: string): Promise<ProviderConfig[]> {
    const configs = await db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.toolId, toolId))
      .orderBy(providerConfigs.priority);

    return configs.map(config => ({
      id: config.id,
      name: config.name,
      providerType: config.providerType,
      toolId: config.toolId,
      endpoint: config.endpoint,
      apiKeyEnvVar: config.apiKeyEnvVar,
      model: config.model,
      config: config.config as any,
      priority: config.priority,
      isActive: config.isActive,
      isDefault: config.isDefault,
    }));
  }

  static async processWithFallback(
    toolId: string,
    input: ProcessInput
  ): Promise<ProcessResult> {
    const configs = await this.getAllConfigsForTool(toolId);
    const activeConfigs = configs.filter(c => c.isActive);

    if (activeConfigs.length === 0) {
      return { success: false, error: `No active provider configured for tool: ${toolId}` };
    }

    activeConfigs.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return b.isDefault - a.isDefault;
      return a.priority - b.priority;
    });

    let lastError = '';

    for (const config of activeConfigs) {
      const provider = this.getProvider(config.providerType);
      if (!provider) {
        lastError = `Unknown provider type: ${config.providerType}`;
        continue;
      }

      try {
        const result = await provider.processImage(input, config);
        if (result.success) {
          return result;
        }
        lastError = result.error || 'Unknown error';
      } catch (err: any) {
        lastError = err.message;
      }
    }

    return { success: false, error: `All providers failed. Last error: ${lastError}` };
  }

  static async checkProviderHealth(configId: string): Promise<{
    healthy: boolean;
    message: string;
  }> {
    const configs = await db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.id, configId))
      .limit(1);

    if (configs.length === 0) {
      return { healthy: false, message: 'Provider config not found' };
    }

    const config = configs[0];
    const provider = this.getProvider(config.providerType);

    if (!provider) {
      return { healthy: false, message: `Unknown provider type: ${config.providerType}` };
    }

    try {
      const isHealthy = await provider.checkHealth({
        id: config.id,
        name: config.name,
        providerType: config.providerType,
        toolId: config.toolId,
        endpoint: config.endpoint,
        apiKeyEnvVar: config.apiKeyEnvVar,
        model: config.model,
        config: config.config as any,
        priority: config.priority,
        isActive: config.isActive,
        isDefault: config.isDefault,
      });

      await db
        .update(providerConfigs)
        .set({
          healthStatus: isHealthy ? 'healthy' : 'unhealthy',
          lastHealthCheck: new Date(),
        })
        .where(eq(providerConfigs.id, configId));

      return {
        healthy: isHealthy,
        message: isHealthy ? 'Provider is healthy' : 'Provider health check failed',
      };
    } catch (err: any) {
      await db
        .update(providerConfigs)
        .set({
          healthStatus: 'unhealthy',
          lastHealthCheck: new Date(),
        })
        .where(eq(providerConfigs.id, configId));

      return { healthy: false, message: err.message };
    }
  }

  static getAvailableProviderTypes(): string[] {
    return Object.keys(providers);
  }

  static getProviderCapabilities(type: string): string[] {
    const provider = providers[type];
    return provider ? provider.getCapabilities() : [];
  }
}
