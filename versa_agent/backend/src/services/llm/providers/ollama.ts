import { BaseLLMProvider } from '../base';
import type { ChatParams, ChatResponse, ChatChunk, LLMProvider, LLMProviderConfig } from '../types';

interface OllamaMessage {
  role: string;
  content: string;
}

interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  prompt_eval_count?: number;
  eval_count?: number;
  model: string;
  done: boolean;
}

interface OllamaStreamChunk {
  message: {
    role: string;
    content: string;
  };
  prompt_eval_count?: number;
  eval_count?: number;
  model: string;
  done: boolean;
}

export class OllamaProvider extends BaseLLMProvider {
  private baseURL: string;
  private static readonly MODELS = ['llama3.2', 'llama3.1', 'qwen2.5', 'mistral', 'codellama'];

  constructor(config: LLMProviderConfig = {}) {
    super(config);
    this.baseURL = config.baseURL || 'http://localhost:11434';
  }

  getProviderName(): LLMProvider {
    return 'ollama';
  }

  getAvailableModels(): string[] {
    return OllamaProvider.MODELS;
  }

  isConfigured(): boolean {
    // Ollama doesn't require API key, just needs to be accessible
    return true;
  }

  private async fetchOllama(endpoint: string, body: Record<string, unknown>): Promise<OllamaResponse> {
    const response = await fetch(`${this.baseURL}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const messages = params.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await this.fetchOllama('chat', {
      model: params.model,
      messages,
      stream: false,
      options: {
        temperature: params.temperature,
        num_predict: params.maxTokens,
        top_p: params.topP
      }
    });

    return {
      content: response.message.content,
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
      },
      model: response.model,
      finishReason: response.done ? 'stop' : 'length'
    };
  }

  *stream(params: ChatParams): Generator<ChatChunk> {
    const messages = params.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        messages,
        stream: true,
        options: {
          temperature: params.temperature,
          num_predict: params.maxTokens,
          top_p: params.topP
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk: OllamaStreamChunk = JSON.parse(line);
          yield {
            content: chunk.message.content,
            delta: chunk.message.content,
            finishReason: chunk.done ? 'stop' : null
          };
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  estimateCost(): number {
    // Ollama is free (local)
    return 0;
  }
}
