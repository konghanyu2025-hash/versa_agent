import { Router, Request, Response } from 'express';
import { llmService, type LLMProvider } from '../services/llm';

export const llmRoutes = Router();

// Get available LLM providers
llmRoutes.get('/providers', async (req: Request, res: Response) => {
  try {
    const providers = llmService.getAvailableProviders();
    const providerDetails = providers.map(p => {
      const provider = llmService.getProvider(p);
      return {
        name: p,
        configured: provider?.isConfigured() ?? false,
        models: provider?.getAvailableModels() ?? []
      };
    });
    res.json({ providers: providerDetails });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Chat with an LLM
llmRoutes.post('/chat', async (req: Request, res: Response) => {
  try {
    const { provider, model, messages, temperature, maxTokens, topP, tools } = req.body;

    if (!provider || !model || !messages) {
      return res.status(400).json({ error: 'provider, model, and messages are required' });
    }

    const response = await llmService.chat(provider as LLMProvider, {
      model,
      messages,
      temperature,
      maxTokens,
      topP,
      tools
    });

    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Stream chat with an LLM
llmRoutes.post('/chat/stream', async (req: Request, res: Response) => {
  try {
    const { provider, model, messages, temperature, maxTokens, topP, tools } = req.body;

    if (!provider || !model || !messages) {
      return res.status(400).json({ error: 'provider, model, and messages are required' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = llmService.stream(provider as LLMProvider, {
      model,
      messages,
      temperature,
      maxTokens,
      topP,
      tools
    });

    for (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get usage statistics
llmRoutes.get('/usage', async (req: Request, res: Response) => {
  try {
    // This would query the database for usage statistics
    // For now, return a placeholder
    res.json({ usage: [] });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
