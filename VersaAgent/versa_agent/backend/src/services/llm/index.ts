import type { ChatParams, ChatResponse, ChatChunk, LLMProvider, LLMProviderConfig } from './types';
import { BaseLLMProvider } from './base';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { DeepSeekProvider } from './providers/deepseek';
import { ZhipuProvider } from './providers/zhipu';
import { MoonshotProvider } from './providers/moonshot';
import { OllamaProvider } from './providers/ollama';

/**
 * LLM Service - Unified interface for multiple LLM providers
 */
export class LLMService {
  private providers: Map<LLMProvider, BaseLLMProvider> = new Map();
  private defaultProvider: LLMProvider = 'openai';

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize providers with API keys from environment
    const providerConfigs: Record<LLMProvider, LLMProviderConfig> = {
      openai: { apiKey: process.env.OPENAI_API_KEY },
      anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
      deepseek: { apiKey: process.env.DEEPSEEK_API_KEY },
      zhipu: { apiKey: process.env.ZHIPU_API_KEY },
      moonshot: { apiKey: process.env.MOONSHOT_API_KEY },
      openrouter: { apiKey: process.env.OPENROUTER_API_KEY },
      ollama: { baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' }
    };

    this.providers.set('openai', new OpenAIProvider(providerConfigs.openai));
    this.providers.set('anthropic', new AnthropicProvider(providerConfigs.anthropic));
    this.providers.set('deepseek', new DeepSeekProvider(providerConfigs.deepseek));
    this.providers.set('zhipu', new ZhipuProvider(providerConfigs.zhipu));
    this.providers.set('moonshot', new MoonshotProvider(providerConfigs.moonshot));
    this.providers.set('ollama', new OllamaProvider(providerConfigs.ollama));
  }

  /**
   * Get a specific provider
   */
  getProvider(provider: LLMProvider): BaseLLMProvider | undefined {
    return this.providers.get(provider);
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.entries())
      .filter(([, provider]) => provider.isConfigured())
      .map(([name]) => name);
  }

  /**
   * Chat with a specific provider
   */
  async chat(provider: LLMProvider, params: ChatParams): Promise<ChatResponse> {
    const llmProvider = this.providers.get(provider);
    if (!llmProvider) {
      throw new Error(`Provider ${provider} not found`);
    }
    if (!llmProvider.isConfigured()) {
      throw new Error(`Provider ${provider} is not configured`);
    }
    return await llmProvider.chat(params);
  }

  /**
   * Stream chat with a specific provider
   */
  *stream(provider: LLMProvider, params: ChatParams): Generator<ChatChunk> {
    const llmProvider = this.providers.get(provider);
    if (!llmProvider) {
      throw new Error(`Provider ${provider} not found`);
    }
    if (!llmProvider.isConfigured()) {
      throw new Error(`Provider ${provider} is not configured`);
    }
    yield* llmProvider.stream(params);
  }

  /**
   * Set default provider
   */
  setDefaultProvider(provider: LLMProvider): void {
    if (this.providers.has(provider)) {
      this.defaultProvider = provider;
    }
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): LLMProvider {
    return this.defaultProvider;
  }

  /**
   * Smart routing - select best provider based on task
   */
  selectProviderForTask(task: string, requirements?: { preferCost?: boolean; preferSpeed?: boolean }): LLMProvider {
    const available = this.getAvailableProviders();
    if (available.length === 0) {
      throw new Error('No LLM providers configured');
    }

    // Simple routing logic
    if (requirements?.preferCost) {
      // Prefer cheaper options
      if (available.includes('deepseek')) return 'deepseek';
      if (available.includes('ollama')) return 'ollama';
    }

    if (requirements?.preferSpeed) {
      // Prefer faster options
      if (available.includes('openai')) return 'openai';
    }

    // Default to first available or configured default
    return available.includes(this.defaultProvider) ? this.defaultProvider : available[0];
  }
}

// Export singleton instance
export const llmService = new LLMService();

// Re-export types
export * from './types';
export { BaseLLMProvider } from './base';
