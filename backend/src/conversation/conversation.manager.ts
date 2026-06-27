import { v4 as uuidv4 } from 'uuid';
import {
  ConversationState,
  ConversationMessage,
  CheckoutSession,
  PaymentInitResult,
  Product,
  OrderConfirmation
} from '../types/index.js';

const conversations = new Map<string, ConversationState>();

export function createConversation(): ConversationState {
  const id = uuidv4();
  const now = new Date().toISOString();
  const state: ConversationState = {
    id,
    status: 'IDLE',
    currentMerchant: null,
    currentCheckoutSession: null,
    pendingPayment: null,
    currentProducts: [],
    selectedProduct: null,
    selectedQuantity: 1,
    history: [],
    lastOrder: null,
    createdAt: now,
    updatedAt: now
  };
  conversations.set(id, state);
  return state;
}

export function getConversation(id: string): ConversationState | undefined {
  return conversations.get(id);
}

export function getOrCreateConversation(id?: string): ConversationState {
  if (id) {
    const existing = conversations.get(id);
    if (existing) return existing;
  }
  return createConversation();
}

export function updateConversation(
  id: string,
  updates: Partial<Omit<ConversationState, 'id' | 'createdAt'>>
): ConversationState {
  const state = conversations.get(id);
  if (!state) throw new Error(`Conversation ${id} not found`);
  Object.assign(state, updates, { updatedAt: new Date().toISOString() });
  return state;
}

export function addMessage(id: string, role: 'user' | 'assistant', content: string): void {
  const state = conversations.get(id);
  if (!state) return;
  const msg: ConversationMessage = { role, content, timestamp: new Date().toISOString() };
  state.history.push(msg);
  state.updatedAt = new Date().toISOString();
}

export function setProducts(id: string, products: Product[]): void {
  updateConversation(id, {
    currentProducts: products,
    status: products.length > 0 ? 'VIEWING_PRODUCTS' : 'IDLE'
  });
}

export function setCheckoutSession(id: string, session: CheckoutSession | null): void {
  updateConversation(id, {
    currentCheckoutSession: session,
    currentMerchant: session?.merchant ?? null,
    selectedProduct: session?.product ?? null,
    selectedQuantity: session?.quantity ?? 1,
    pendingPayment: null,
    status: session ? 'CHECKOUT_ACTIVE' : 'IDLE'
  });
}

export function setPendingPayment(id: string, payment: PaymentInitResult | null): void {
  updateConversation(id, {
    pendingPayment: payment,
    status: payment ? 'PAYMENT_PENDING' : 'CHECKOUT_ACTIVE'
  });
}

export function setOrder(id: string, order: OrderConfirmation): void {
  updateConversation(id, {
    lastOrder: order,
    currentCheckoutSession: null,
    pendingPayment: null,
    status: 'ORDER_CONFIRMED'
  });
}

export function buildContextSummary(state: ConversationState): string {
  const parts: string[] = [];

  if (state.currentProducts.length > 0) {
    parts.push(`Currently showing ${state.currentProducts.length} products.`);
    const top3 = state.currentProducts.slice(0, 3);
    parts.push(`Products: ${top3.map((p, i) => `[${i + 1}] ${p.name} (${p.merchant}) ₹${p.price}`).join(', ')}`);
  }

  if (state.currentCheckoutSession) {
    const cs = state.currentCheckoutSession;
    parts.push(`Active cart: ${cs.product.name} x${cs.quantity} on ${cs.merchant}, total ₹${cs.total}`);
  }

  if (state.pendingPayment) {
    parts.push(`Payment pending for ₹${state.pendingPayment.amount}`);
  }

  if (state.currentMerchant) {
    parts.push(`Current merchant: ${state.currentMerchant}`);
  }

  if (state.lastOrder) {
    parts.push(`Last order: ${state.lastOrder.orderId} on ${state.lastOrder.merchant}`);
  }

  return parts.join(' | ');
}
