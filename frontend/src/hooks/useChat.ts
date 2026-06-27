import { useState, useCallback } from 'react';
import { ChatMessage, PaymentInitResult } from '../types';
import { sendMessage, verifyPayment } from '../services/api';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [pendingPayment, setPendingPayment] = useState<PaymentInitResult | null>(null);

  const addMsg = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const sendUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const buyMatch = text.match(/^__BUY_ID__(.+?)__MERCHANT__(.+)$/);
    const displayText = buyMatch ? `🛒 Buy Now (${buyMatch[2]})` : text;

    addMsg({ id: uid(), role: 'user', content: displayText, timestamp: new Date() });
    setIsLoading(true);

    try {
      const res = await sendMessage(text, conversationId);
      if (res.conversationId) setConversationId(res.conversationId);

      // If backend returned a payment object, surface it for the modal
      if (res.payment) setPendingPayment(res.payment);

      addMsg({
        id: uid(),
        role: 'assistant',
        content: res.assistantMessage,
        timestamp: new Date(),
        products: res.products,
        cart: res.cart ?? res.checkout ?? null,
        order: res.order ?? null,
        payment: res.payment ?? null,
        suggestions: res.suggestions
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      addMsg({
        id: uid(), role: 'assistant',
        content: `Sorry, something went wrong: ${msg}. Please try again.`,
        timestamp: new Date(),
        suggestions: ['Try again']
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, conversationId, addMsg]);

  const handlePaymentComplete = useCallback(async (method: string) => {
    if (!conversationId) return;
    setPendingPayment(null);
    setIsLoading(true);

    try {
      const res = await verifyPayment(conversationId, method);
      addMsg({
        id: uid(), role: 'assistant',
        content: res.assistantMessage,
        timestamp: new Date(),
        order: res.order ?? null,
        suggestions: res.suggestions
      });
    } catch (err) {
      addMsg({
        id: uid(), role: 'assistant',
        content: 'Payment verification failed. Please try again.',
        timestamp: new Date(),
        suggestions: ['Try payment again']
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, addMsg]);

  const dismissPayment = useCallback(() => {
    setPendingPayment(null);
  }, []);

  return { messages, isLoading, conversationId, pendingPayment, sendUserMessage, handlePaymentComplete, dismissPayment };
}
