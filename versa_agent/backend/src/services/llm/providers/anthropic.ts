import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider } from '../base';
import type { ChatParams, ChatResponse, ChatChunk, LLMProvider, LLMProviderConfig } from '../types';

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic | null = null;
  private static readonly MODELS = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];
  private static readonly PRICING: Record<string, { input: number; output: number }> = {
    'claude-3-5-sonnet-20241022': { input: 0.000003, output: 0.000015 },
    'claude-3-5-haiku-20241022': { input: 0.0000008, output: 0.000004 },
    'claude-3-opus-20240229': { input: 0.000015, output: 0.000075 }
  };

  constructor(config: LLMProviderConfig = {}) {
    super(config);
    if (config.apiKey) {
      this.client = new Anthropic({ apiKey: config.apiKey });
    }
  }

  getProviderName(): LLMProvider {
    return 'anthropic';
  }

  getAvailableModels(): string[] {
    return AnthropicProvider.MODELS;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not configured');
    }

    // Extract system message
    const systemMessage = params.messages.find(m => m.role === 'system');
    const messages = params.messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model: params.model,
      system: systemMessage?.content,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      temperature: params.temperature,
      max_tokens: params.maxTokens || 4096,
      top_p: params.topP,
      tools: params.tools?.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters as Record<string, unknown>
      }))
    });

    const content = response.content.find(c => c.type === 'text');
    const toolUseBlocks = response.content.filter(c => c.type === 'tool_use');

    return {
      content: content?.text || '',
      toolCalls: toolUseBlocks.map(tb => ({
        id: tb.id,
        type: 'function',
        function: {
          name: tb.name,
          arguments: JSON.stringify(tb.input)
        }
      })),
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: response.model,
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'tool_calls'
    };
  }

  *stream(params: ChatParams): Generator<ChatChunk> {
    if (!this.client) {
      throw new Error('Anthropic client not configured');
    }

    const systemMessage = params.messages.find(m => m.role === 'system');
    const messages = params.messages.filter(m => m.role !== 'system');

    const stream = this.client.messages.create({
      model: params.model,
      system: systemMessage?.content,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      temperature: params.temperature,
      max_tokens: params.maxTokens || 4096,
      top_p: params.topP,
      tools: params.tools?.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters as Record<string, unknown>
      })),
      stream: true
    });

    for await (const event of stream) {
      switch (event.type) {
        case 'content_block_delta':
          if (event.delta.type === 'text_delta') {
            yield {
              content: event.delta.text,
              delta: event.delta.text,
              finishReason: null
            };
          }
          break;
        case 'message_stop':
          yield {
            content: '',
            delta: '',
            finishReason: 'stop'
          };
          break;
      }
    }
  }

  estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = AnthropicProvider.PRICING[model];
    if (!pricing) return 0;
    return (promptTokens * pricing.input + completionTokens * pricing.output) / 1000000;
  }
}
