import { EventEmitter } from 'events';
import express from 'express';

export interface SSEEvent {
  event: string;
  data: unknown;
}

class SSEManager extends EventEmitter {
  private clients: Set<express.Response> = new Set();

  addClient(res: express.Response): void {
    this.clients.add(res);

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection event
    this.sendToClient(res, 'connected', { timestamp: Date.now() });

    // Remove client on connection close
    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(event: string, data: unknown): void {
    for (const client of this.clients) {
      this.sendToClient(client, event, data);
    }
  }

  private sendToClient(res: express.Response, event: string, data: unknown): void {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      // Client disconnected, remove from set
      this.clients.delete(res);
    }
  }
}

export const sseManager = new SSEManager();

export const sseMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Attach SSE manager to request for use in routes
  (req as any).sse = sseManager;
  next();
};
