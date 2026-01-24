import type { ChatParams, ChatResponse, ChatChunk, LLMProvider, LLMProviderConfig } from './types';

/**
 * Base interface for all LLM providers
 */
export abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig = {}) {
    this.config = {
      timeout: 60000,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Get the provider name
   */
  abstract getProviderName(): LLMProvider;

  /**
   * Chat completion (non-streaming)
   */
  abstract chat(params: ChatParams): Promise<ChatResponse>;

  /**
   * Chat completion (streaming)
   */
  abstract *stream(params: ChatParams): Generator<ChatChunk>;

  /**
   * Estimate cost in USD for a given token count
   */
  abstract estimateCost(model: string, promptTokens: number, completionTokens: number): number;

  /**
   * Get available models for this provider
   */
  abstract getAvailableModels(): string[];

  /**
   * Check if the provider is properly configured
   */
  abstract isConfigured(): boolean;

  /**
   * Validate model name is available for this provider
   */
  validateModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }
}
