import { Request, Response } from 'express';
import { processMessage, processPaymentVerify } from '../orchestrator/commerce.orchestrator.js';
import { ChatRequest } from '../types/index.js';

export async function handleChat(req: Request, res: Response): Promise<void> {
  const { conversationId, message } = req.body as ChatRequest;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
    const { response, conversationId: id } = await processMessage(message.trim(), conversationId);
    res.json({ conversationId: id, ...response });
  } catch (err) {
    console.error('Chat handler error:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
}

export async function handlePaymentVerify(req: Request, res: Response): Promise<void> {
  const { conversationId, method } = req.body as { conversationId: string; method: string };

  if (!conversationId || !method) {
    res.status(400).json({ error: 'conversationId and method are required' });
    return;
  }

  try {
    const { response, conversationId: id } = await processPaymentVerify(method, conversationId);
    res.json({ conversationId: id, ...response });
  } catch (err) {
    console.error('Payment verify handler error:', err);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
}
