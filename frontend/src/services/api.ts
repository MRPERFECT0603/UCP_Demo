import { ChatApiResponse } from '../types';

const API_BASE = '/chat';

export async function sendMessage(message: string, conversationId?: string): Promise<ChatApiResponse> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export async function verifyPayment(
  conversationId: string,
  method: string
): Promise<ChatApiResponse> {
  const res = await fetch(`${API_BASE}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, method })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Payment failed' }));
    throw new Error(err.error || 'Payment failed');
  }
  return res.json();
}
