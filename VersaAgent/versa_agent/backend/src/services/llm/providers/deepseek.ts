import OpenAI from 'openai';
import { BaseLLMProvider } from '../base';
import type { ChatParams, ChatResponse, ChatChunk, LLMProvider, LLMProviderConfig } from '../types';

export class DeepSeekProvider extends BaseLLMProvider {
  private client: OpenAI | null = null;
  private static readonly BASE_URL = 'https://api.deepseek.com/v1';
  private static readonly MODELS = ['deepseek-chat', 'deepseek-coder'];
  private static readonly PRICING: Record<string, { input: number; output: number }> = {
    'deepseek-chat': { input: 0.00000014, output: 0.00000028 },
    'deepseek-coder': { input: 0.00000014, output: 0.00000028 }
  };

  constructor(config: LLMProviderConfig = {}) {
    super(config);
    if (config.apiKey) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL || DeepSeekProvider.BASE_URL
      });
    }
  }

  getProviderName(): LLMProvider {
    return 'deepseek';
  }

  getAvailableModels(): string[] {
    return DeepSeekProvider.MODELS;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('DeepSeek client not configured');
    }

    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: params.messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      model: response.model,
      finishReason: choice.finish_reason as ChatResponse['finishReason']
    };
  }

  *stream(params: ChatParams): Generator<ChatChunk> {
    if (!this.client) {
      throw new Error('DeepSeek client not configured');
    }

    const stream = this.client.chat.completions.create({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      stream: true
    });

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      yield {
        content: choice.message.content || '',
        delta: choice.message.content || '',
        finishReason: choice.finish_reason as ChatChunk['finishReason']
      };
    }
  }

  estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = DeepSeekProvider.PRICING[model];
    if (!pricing) return 0;
    return (promptTokens * pricing.input + completionTokens * pricing.output) / 1000000;
  }
}
