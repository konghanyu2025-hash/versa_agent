import { Router } from 'express';
import { workflowRoutes } from './workflows';
import { agentRoutes } from './agents';
import { llmRoutes } from './llm';

export const apiRouter = Router();

apiRouter.use('/workflows', workflowRoutes);
apiRouter.use('/agents', agentRoutes);
apiRouter.use('/llm', llmRoutes);
