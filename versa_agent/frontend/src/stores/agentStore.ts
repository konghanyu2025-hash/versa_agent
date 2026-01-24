import { create } from 'zustand';
import { api } from '../services/api';

export interface Agent {
  name: string;
  role: string;
  systemPrompt?: string;
  llmProvider: string;
  llmModel: string;
  mcpTools?: string[];
  capabilities?: Record<string, unknown>;
}

interface AgentState {
  agents: Agent[];
  currentAgent: Agent | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAgents: () => Promise<void>;
  fetchAgent: (name: string) => Promise<void>;
  createAgent: (config: Omit<Agent, 'name'> & { name?: string }) => Promise<void>;
  updateAgent: (name: string, config: Partial<Agent>) => Promise<void>;
  deleteAgent: (name: string) => Promise<void>;
  executeAgent: (name: string, task: string, input?: Record<string, unknown>) => Promise<unknown>;
  setCurrentAgent: (agent: Agent | null) => void;
  clearError: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  currentAgent: null,
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/agents');
      set({ agents: response.agents, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch agents', loading: false });
    }
  },

  fetchAgent: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/agents/${name}`);
      set({ currentAgent: response.agent, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch agent', loading: false });
    }
  },

  createAgent: async (config) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/agents', config);
      await get().fetchAgents();
      set({ currentAgent: response.agent, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create agent', loading: false });
      throw error;
    }
  },

  updateAgent: async (name: string, config: Partial<Agent>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/agents/${name}`, config);
      await get().fetchAgents();
      set({ currentAgent: response.agent, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update agent', loading: false });
      throw error;
    }
  },

  deleteAgent: async (name: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/agents/${name}`);
      await get().fetchAgents();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete agent', loading: false });
      throw error;
    }
  },

  executeAgent: async (name: string, task: string, input?: Record<string, unknown>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/agents/${name}/execute`, { task, input });
      set({ loading: false });
      return response.result;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to execute agent', loading: false });
      throw error;
    }
  },

  setCurrentAgent: (agent: Agent | null) => {
    set({ currentAgent: agent });
  },

  clearError: () => {
    set({ error: null });
  }
}));
