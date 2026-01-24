import { create } from 'zustand';
import { api } from '../services/api';

export type WorkflowMode = 'AUTO' | 'SEMI' | 'TEMPLATE';
export type WorkflowStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type StepStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WorkflowStep {
  id: string;
  sequence: number;
  agentName: string;
  task: string;
  status: StepStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  requiresConfirm: boolean;
  confirmed?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  mode: WorkflowMode;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchWorkflows: () => Promise<void>;
  fetchWorkflow: (id: string) => Promise<void>;
  createWorkflow: (config: Omit<Workflow, 'id' | 'status' | 'steps' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  executeWorkflow: (id: string) => Promise<void>;
  cancelWorkflow: (id: string) => Promise<void>;
  confirmStep: (workflowId: string, stepId: string, confirmed: boolean) => Promise<void>;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  clearError: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  loading: false,
  error: null,

  fetchWorkflows: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/workflows');
      set({ workflows: response.workflows, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch workflows', loading: false });
    }
  },

  fetchWorkflow: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/workflows/${id}`);
      set({ currentWorkflow: response.workflow, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch workflow', loading: false });
    }
  },

  createWorkflow: async (config) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/workflows', config);
      set({ currentWorkflow: response.workflow, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create workflow', loading: false });
      throw error;
    }
  },

  executeWorkflow: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/workflows/${id}/execute`, {});
      // Refresh workflow after execution
      await get().fetchWorkflow(id);
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to execute workflow', loading: false });
    }
  },

  cancelWorkflow: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/workflows/${id}/cancel`, {});
      await get().fetchWorkflow(id);
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to cancel workflow', loading: false });
    }
  },

  confirmStep: async (workflowId: string, stepId: string, confirmed: boolean) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/workflows/${workflowId}/steps/${stepId}/confirm`, { confirmed });
      await get().fetchWorkflow(workflowId);
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to confirm step', loading: false });
    }
  },

  setCurrentWorkflow: (workflow: Workflow | null) => {
    set({ currentWorkflow: workflow });
  },

  clearError: () => {
    set({ error: null });
  }
}));
