import { Router, Request, Response } from 'express';
import { Agent } from '../services/agents';
import type { AgentConfig } from '../services/agents';

export const agentRoutes = Router();

// Get all agents
agentRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const agents = await Agent.listAll();
    res.json({ agents: agents.map(a => a.getConfig()) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create a new agent
agentRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const config: AgentConfig = req.body;
    const agent = await Agent.create(config);
    res.status(201).json({ agent: agent.getConfig() });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get a specific agent
agentRoutes.get('/:name', async (req: Request, res: Response) => {
  try {
    const agent = await Agent.getByName(req.params.name);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ agent: agent.getConfig() });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update an agent
agentRoutes.put('/:name', async (req: Request, res: Response) => {
  try {
    const config: Partial<AgentConfig> = req.body;
    const agent = await Agent.update(req.params.name, config);
    res.json({ agent: agent.getConfig() });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete an agent
agentRoutes.delete('/:name', async (req: Request, res: Response) => {
  try {
    await Agent.delete(req.params.name);
    res.json({ message: 'Agent deleted' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Execute a task with an agent
agentRoutes.post('/:name/execute', async (req: Request, res: Response) => {
  try {
    const { task, input } = req.body;
    if (!task) {
      return res.status(400).json({ error: 'task is required' });
    }
    const agent = await Agent.getByName(req.params.name);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const result = await agent.execute(task, input);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
