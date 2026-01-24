import { create } from 'zustand';
import { api } from '../services/api';

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'zhipu' | 'moonshot' | 'openrouter' | 'ollama';

export interface LLMProviderInfo {
  name: LLMProvider;
  configured: boolean;
  models: string[];
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

interface LLMState {
  providers: LLMProviderInfo[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchProviders: () => Promise<void>;
  chat: (provider: LLMProvider, model: string, messages: Message[], options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }) => Promise<{ content: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }>;
  clearError: () => void;
}

export const useLLMStore = create<LLMState>((set, get) => ({
  providers: [],
  loading: false,
  error: null,

  fetchProviders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/llm/providers');
      set({ providers: response.providers, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch providers', loading: false });
    }
  },

  chat: async (provider, model, messages, options = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/llm/chat', {
        provider,
        model,
        messages,
        ...options
      });
      set({ loading: false });
      return response.response;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to chat', loading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
