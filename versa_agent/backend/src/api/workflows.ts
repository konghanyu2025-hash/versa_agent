import { Router, Request, Response } from 'express';
import { workflowEngine } from '../services/workflow/engine';
import type { WorkflowConfig } from '../services/workflow/types';

export const workflowRoutes = Router();

// Get all workflows
workflowRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const workflows = await workflowEngine.listWorkflows(userId);
    res.json({ workflows });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create a new workflow
workflowRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const config: WorkflowConfig = req.body;
    const workflow = await workflowEngine.createWorkflow(config);
    res.status(201).json({ workflow });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get a specific workflow
workflowRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = await workflowEngine.getWorkflow(req.params.id);
    res.json({ workflow });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : 'Workflow not found' });
  }
});

// Execute a workflow
workflowRoutes.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const result = await workflowEngine.executeWorkflow(req.params.id);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Cancel a running workflow
workflowRoutes.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    await workflowEngine.cancelWorkflow(req.params.id);
    res.json({ message: 'Workflow cancelled' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Confirm a workflow step (for semi-auto mode)
workflowRoutes.post('/:id/steps/:stepId/confirm', async (req: Request, res: Response) => {
  try {
    const { confirmed } = req.body;
    if (typeof confirmed !== 'boolean') {
      return res.status(400).json({ error: 'confirmed must be a boolean' });
    }
    await workflowEngine.confirmStep(req.params.id, req.params.stepId, confirmed);
    res.json({ message: confirmed ? 'Step confirmed' : 'Step rejected' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
