import { EventEmitter } from 'events';
import { prisma } from '../db';
import { llmService } from '../llm';
import { sseManager } from '../sse';
import type {
  WorkflowConfig,
  Workflow,
  WorkflowStep,
  WorkflowMode,
  WorkflowStatus,
  StepStatus,
  WorkflowExecutionResult
} from './types';
import { Agent } from '../agents';

/**
 * Workflow Engine - Handles execution of workflows in different modes
 */
export class WorkflowEngine extends EventEmitter {
  private activeWorkflows: Map<string, AbortController> = new Map();

  constructor() {
    super();
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(config: WorkflowConfig): Promise<Workflow> {
    const workflow = await prisma.workflow.create({
      data: {
        userId: config.userId,
        name: config.name,
        description: config.description,
        mode: config.mode as string,
        config: { steps: config.steps },
        status: 'PENDING'
      },
      include: { steps: true }
    });

    // Create steps
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];
      await prisma.workflowStep.create({
        data: {
          workflowId: workflow.id,
          sequence: i + 1,
          agentName: step.agentName,
          task: step.task,
          requiresConfirm: step.requiresConfirm || false,
          input: step.input
        }
      });
    }

    return await this.getWorkflow(workflow.id);
  }

  /**
   * Get a workflow by ID
   */
  async getWorkflow(id: string): Promise<Workflow> {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { steps: { orderBy: { sequence: 'asc' } } }
    });

    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || undefined,
      mode: workflow.mode as WorkflowMode,
      status: workflow.status as WorkflowStatus,
      steps: workflow.steps.map(s => ({
        id: s.id,
        sequence: s.sequence,
        agentName: s.agentName,
        task: s.task,
        status: s.status as StepStatus,
        input: s.input as Record<string, unknown> | undefined,
        output: s.output as Record<string, unknown> | undefined,
        startedAt: s.startedAt || undefined,
        completedAt: s.completedAt || undefined,
        errorMessage: s.errorMessage || undefined,
        requiresConfirm: s.requiresConfirm,
        confirmed: s.confirmed || undefined
      })),
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt
    };
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string): Promise<WorkflowExecutionResult> {
    const workflow = await this.getWorkflow(workflowId);
    const abortController = new AbortController();
    this.activeWorkflows.set(workflowId, abortController);

    // Update status to running
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { status: 'RUNNING' }
    });

    sseManager.broadcast('workflow:started', { workflowId, mode: workflow.mode });

    try {
      let result: WorkflowExecutionResult;

      switch (workflow.mode) {
        case 'AUTO':
          result = await this.executeAutoMode(workflow, abortController.signal);
          break;
        case 'SEMI':
          result = await this.executeSemiMode(workflow, abortController.signal);
          break;
        case 'TEMPLATE':
          result = await this.executeTemplateMode(workflow, abortController.signal);
          break;
        default:
          throw new Error(`Unknown workflow mode: ${workflow.mode}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { status: 'FAILED' }
      });

      sseManager.broadcast('workflow:failed', { workflowId, error: errorMessage });

      return {
        workflowId,
        status: 'FAILED',
        steps: [],
        error: errorMessage
      };
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute in AUTO mode - no human intervention
   */
  private async executeAutoMode(workflow: Workflow, signal: AbortSignal): Promise<WorkflowExecutionResult> {
    const results: Record<string, unknown> = {};

    for (const step of workflow.steps) {
      if (signal.aborted) {
        throw new Error('Workflow aborted');
      }

      const stepResult = await this.executeStep(step, signal);
      results[step.id] = stepResult;
    }

    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { status: 'COMPLETED' }
    });

    sseManager.broadcast('workflow:completed', { workflowId: workflow.id, results });

    return {
      workflowId: workflow.id,
      status: 'COMPLETED',
      steps: workflow.steps,
      result: results
    };
  }

  /**
   * Execute in SEMI mode - pause at confirmation points
   */
  private async executeSemiMode(workflow: Workflow, signal: AbortSignal): Promise<WorkflowExecutionResult> {
    const results: Record<string, unknown> = {};

    for (const step of workflow.steps) {
      if (signal.aborted) {
        throw new Error('Workflow aborted');
      }

      // Check if step requires confirmation
      if (step.requiresConfirm) {
        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { status: 'PAUSED' }
        });

        sseManager.broadcast('step:awaiting_confirmation', {
          workflowId: workflow.id,
          stepId: step.id,
          task: step.task
        });

        // Wait for confirmation
        await this.waitForConfirmation(step.id, signal);
      }

      const stepResult = await this.executeStep(step, signal);
      results[step.id] = stepResult;
    }

    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { status: 'COMPLETED' }
    });

    sseManager.broadcast('workflow:completed', { workflowId: workflow.id, results });

    return {
      workflowId: workflow.id,
      status: 'COMPLETED',
      steps: workflow.steps,
      result: results
    };
  }

  /**
   * Execute in TEMPLATE mode - predefined workflow
   */
  private async executeTemplateMode(workflow: Workflow, signal: AbortSignal): Promise<WorkflowExecutionResult> {
    // Template mode is similar to auto but with predefined steps
    return await this.executeAutoMode(workflow, signal);
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: WorkflowStep, signal: AbortSignal): Promise<unknown> {
    // Update step status to running
    await prisma.workflowStep.update({
      where: { id: step.id },
      data: { status: 'RUNNING', startedAt: new Date() }
    });

    sseManager.broadcast('step:started', { stepId: step.id, agentName: step.agentName });

    try {
      // Get the agent
      const agent = await Agent.getByName(step.agentName);
      if (!agent) {
        throw new Error(`Agent ${step.agentName} not found`);
      }

      // Execute the task
      const result = await agent.execute(step.task, step.input);

      // Update step status to completed
      await prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          output: result as Record<string, unknown>
        }
      });

      sseManager.broadcast('step:completed', { stepId: step.id, result });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage
        }
      });

      sseManager.broadcast('step:failed', { stepId: step.id, error: errorMessage });

      throw error;
    }
  }

  /**
   * Wait for user confirmation on a step
   */
  private async waitForConfirmation(stepId: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkConfirmation = async () => {
        const step = await prisma.workflowStep.findUnique({ where: { id: stepId } });
        if (!step) {
          reject(new Error('Step not found'));
          return;
        }

        if (step.confirmed === true) {
          resolve();
          return;
        }

        if (signal.aborted) {
          reject(new Error('Aborted'));
          return;
        }

        // Poll for confirmation
        setTimeout(checkConfirmation, 500);
      };

      checkConfirmation();
    });
  }

  /**
   * Confirm a step (for semi-auto mode)
   */
  async confirmStep(workflowId: string, stepId: string, confirmed: boolean): Promise<void> {
    const step = await prisma.workflowStep.findFirst({
      where: { id: stepId, workflowId }
    });

    if (!step) {
      throw new Error('Step not found');
    }

    await prisma.workflowStep.update({
      where: { id: stepId },
      data: { confirmed, status: confirmed ? 'PENDING' : 'CANCELLED' }
    });

    if (confirmed) {
      sseManager.broadcast('step:confirmed', { stepId });
    } else {
      sseManager.broadcast('step:rejected', { stepId });
    }
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    const controller = this.activeWorkflows.get(workflowId);
    if (controller) {
      controller.abort();
    }

    await prisma.workflow.update({
      where: { id: workflowId },
      data: { status: 'CANCELLED' }
    });

    // Cancel all pending steps
    await prisma.workflowStep.updateMany({
      where: { workflowId, status: 'PENDING' },
      data: { status: 'CANCELLED' }
    });

    sseManager.broadcast('workflow:cancelled', { workflowId });
  }

  /**
   * List all workflows
   */
  async listWorkflows(userId?: string): Promise<Workflow[]> {
    const workflows = await prisma.workflow.findMany({
      where: userId ? { userId } : undefined,
      include: { steps: { orderBy: { sequence: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });

    return workflows.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description || undefined,
      mode: w.mode as WorkflowMode,
      status: w.status as WorkflowStatus,
      steps: w.steps.map(s => ({
        id: s.id,
        sequence: s.sequence,
        agentName: s.agentName,
        task: s.task,
        status: s.status as StepStatus,
        input: s.input as Record<string, unknown> | undefined,
        output: s.output as Record<string, unknown> | undefined,
        startedAt: s.startedAt || undefined,
        completedAt: s.completedAt || undefined,
        errorMessage: s.errorMessage || undefined,
        requiresConfirm: s.requiresConfirm,
        confirmed: s.confirmed || undefined
      })),
      createdAt: w.createdAt,
      updatedAt: w.updatedAt
    }));
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();
