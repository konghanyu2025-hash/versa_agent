export enum WorkflowMode {
  AUTO = 'AUTO',
  SEMI = 'SEMI',
  TEMPLATE = 'TEMPLATE'
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum StepStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface WorkflowStepConfig {
  agentName: string;
  task: string;
  requiresConfirm?: boolean;
  input?: Record<string, unknown>;
}

export interface WorkflowConfig {
  name: string;
  description?: string;
  mode: WorkflowMode;
  steps: WorkflowStepConfig[];
  userId?: string;
}

export interface WorkflowStep {
  id: string;
  sequence: number;
  agentName: string;
  task: string;
  status: StepStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  result?: Record<string, unknown>;
  error?: string;
}
