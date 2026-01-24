import OpenAI from 'openai';
import { BaseLLMProvider } from '../base';
import type { ChatParams, ChatResponse, ChatChunk, LLMProvider, LLMProviderConfig } from '../types';

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI | null = null;
  private static readonly MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  private static readonly PRICING: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.000005, output: 0.000015 },
    'gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
    'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
    'gpt-3.5-turbo': { input: 0.0000005, output: 0.0000015 }
  };

  constructor(config: LLMProviderConfig = {}) {
    super(config);
    if (config.apiKey) {
      this.client = new OpenAI({ apiKey: config.apiKey });
    }
  }

  getProviderName(): LLMProvider {
    return 'openai';
  }

  getAvailableModels(): string[] {
    return OpenAIProvider.MODELS;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: params.messages.map(m => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
        tool_calls: m.toolCalls?.map(tc => ({
          id: tc.id,
          type: tc.type,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }))
      })),
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      tools: params.tools?.map(t => ({
        type: t.type,
        function: {
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters as Record<string, unknown>
        }
      }))
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      toolCalls: choice.message.tool_calls?.map(tc => ({
        id: tc.id,
        type: tc.type as 'function',
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments
        }
      })),
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
      throw new Error('OpenAI client not configured');
    }

    const stream = this.client.chat.completions.create({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      tools: params.tools?.map(t => ({
        type: t.type,
        function: t.function
      })),
      stream: true
    });

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      yield {
        content: choice.message.content || '',
        delta: choice.message.content || '',
        toolCalls: choice.message.tool_calls?.map(tc => ({
          id: tc.id,
          type: tc.type as 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        })),
        finishReason: choice.finish_reason as ChatChunk['finishReason']
      };
    }
  }

  estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = OpenAIProvider.PRICING[model];
    if (!pricing) return 0;
    return (promptTokens * pricing.input + completionTokens * pricing.output) / 1000000;
  }
}
