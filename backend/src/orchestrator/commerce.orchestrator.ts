import {
  ParsedIntent,
  SearchIntent,
  CreateCheckoutIntent,
  ChangeQuantityIntent,
  ApplyCouponIntent,
  ChatResponse,
  Product
} from '../types/index.js';
import { extractIntent } from '../llm/openai.js';
import { getMerchants, getMerchantByName } from '../services/merchant.service.js';
import { searchAllMerchants } from '../services/catalog.service.js';
import { createCheckout, updateCheckout, initPayment, verifyPayment } from '../services/checkout.service.js';
import {
  getOrCreateConversation,
  addMessage,
  setProducts,
  setCheckoutSession,
  setPendingPayment,
  setOrder,
  buildContextSummary,
  updateConversation
} from '../conversation/conversation.manager.js';

// ─── Main message entry point ─────────────────────────────────────────────────

export async function processMessage(
  message: string,
  conversationId?: string
): Promise<{ response: ChatResponse; conversationId: string }> {
  const state = getOrCreateConversation(conversationId);
  addMessage(state.id, 'user', message);

  // Buy Now button — skip LLM
  const buyMatch = message.match(/^__BUY_ID__(.+?)__MERCHANT__(.+)$/);
  if (buyMatch) {
    const directIntent: ParsedIntent = { intent: 'CREATE_CHECKOUT', productId: buyMatch[1] };
    console.log(`[${state.id}] Direct buy: ${buyMatch[1]} on ${buyMatch[2]}`);
    const response = await executeIntent(directIntent, state.id);
    addMessage(state.id, 'assistant', response.assistantMessage);
    return { response, conversationId: state.id };
  }

  const context = buildContextSummary(state);
  const intent = await extractIntent(message, context);
  console.log(`[${state.id}] Intent:`, JSON.stringify(intent));

  const response = await executeIntent(intent, state.id);
  addMessage(state.id, 'assistant', response.assistantMessage);
  return { response, conversationId: state.id };
}

// ─── Payment verify — called from frontend after modal completes ──────────────

export async function processPaymentVerify(
  method: string,
  conversationId: string
): Promise<{ response: ChatResponse; conversationId: string }> {
  const state = getOrCreateConversation(conversationId);

  if (!state.pendingPayment || !state.currentCheckoutSession) {
    return {
      response: {
        assistantMessage: 'No pending payment found. Please start checkout again.',
        suggestions: ['Search for products']
      },
      conversationId
    };
  }

  const merchant = getMerchantByName(state.currentCheckoutSession.merchant);
  if (!merchant) {
    return {
      response: { assistantMessage: 'Merchant not available.', suggestions: [] },
      conversationId
    };
  }

  try {
    const order = await verifyPayment(
      merchant,
      state.currentCheckoutSession.sessionId,
      state.pendingPayment.paymentToken,
      method
    );
    setOrder(conversationId, order);

    const methodLabel = method === 'upi' ? 'UPI/Google Pay' : method === 'cod' ? 'Cash on Delivery' : 'Card';
    const response: ChatResponse = {
      assistantMessage: `🎉 **Payment successful via ${methodLabel}!**\n\n**Order ID:** ${order.orderId}\n**Merchant:** ${order.merchant}\n**Total Paid:** ₹${order.total}\n**Estimated Delivery:** ${order.estimatedDelivery}`,
      order,
      suggestions: ['Search for more products', 'Track my order']
    };
    addMessage(conversationId, 'assistant', response.assistantMessage);
    return { response, conversationId };
  } catch (err) {
    console.error('Payment verify error:', err);
    const response: ChatResponse = {
      assistantMessage: 'Payment verification failed. Please try again.',
      cart: state.currentCheckoutSession,
      suggestions: ['Try payment again', 'Cancel order']
    };
    return { response, conversationId };
  }
}

// ─── Intent dispatcher ────────────────────────────────────────────────────────

async function executeIntent(intent: ParsedIntent, conversationId: string): Promise<ChatResponse> {
  switch (intent.intent) {
    case 'SEARCH_PRODUCTS':      return handleSearch(intent as SearchIntent, conversationId);
    case 'CREATE_CHECKOUT':      return handleCreateCheckout(intent as CreateCheckoutIntent, conversationId);
    case 'CHANGE_QUANTITY':      return handleChangeQuantity(intent as ChangeQuantityIntent, conversationId);
    case 'APPLY_COUPON':         return handleApplyCoupon(intent as ApplyCouponIntent, conversationId);
    case 'COMPLETE_CHECKOUT':    return handleInitPayment(conversationId);
    case 'CANCEL_CHECKOUT':      return handleCancelCheckout(conversationId);
    case 'COMPARE_PRODUCTS':     return handleCompareProducts(conversationId);
    case 'TRACK_ORDER':          return handleTrackOrder(conversationId);
    default:
      return {
        assistantMessage: "I'm not sure what you'd like to do. Try searching for products, buying something, or managing your cart.",
        suggestions: ['Search for products', 'Show my cart', 'Help me find shoes']
      };
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function handleSearch(intent: SearchIntent, conversationId: string): Promise<ChatResponse> {
  try {
    const merchants = await getMerchants();
    if (merchants.length === 0) {
      return {
        assistantMessage: "I can't connect to the merchants right now. Make sure the mock servers are running.",
        suggestions: ['Try again']
      };
    }

    const products = await searchAllMerchants(merchants, intent.filters);

    if (products.length === 0) {
      return {
        assistantMessage: `No products found${intent.filters.query ? ` for "${intent.filters.query}"` : ''}. Try different keywords.`,
        products: [],
        suggestions: ['Search Nike shoes', 'Find Adidas under ₹5000', 'Show running shoes']
      };
    }

    setProducts(conversationId, products);

    const filterDesc = buildFilterDesc(intent.filters);
    const merchants2 = [...new Set(products.map(p => p.merchant))].join(' and ');
    const priceRange = `₹${Math.min(...products.map(p => p.price)).toLocaleString()} – ₹${Math.max(...products.map(p => p.price)).toLocaleString()}`;

    return {
      assistantMessage: `Found **${products.length} products** across ${merchants2}${filterDesc}. Prices: ${priceRange}. Sorted cheapest first — which one would you like?`,
      products,
      suggestions: ['Buy the cheapest one', 'Buy the Myntra one', 'Buy the Flipkart one', 'Compare prices']
    };
  } catch (err) {
    console.error('Search error:', err);
    return { assistantMessage: 'Search failed. Please try again.', suggestions: ['Try again'] };
  }
}

// ─── Create Checkout ──────────────────────────────────────────────────────────

async function handleCreateCheckout(intent: CreateCheckoutIntent, conversationId: string): Promise<ChatResponse> {
  const state = getOrCreateConversation(conversationId);
  let targetProduct: Product | undefined;

  if (intent.productId) {
    targetProduct = state.currentProducts.find(p => p.id === intent.productId);
  } else if (intent.productIndex !== undefined) {
    targetProduct = state.currentProducts[intent.productIndex];
  } else if (intent.merchantPreference) {
    targetProduct = state.currentProducts.find(
      p => p.merchant.toLowerCase() === intent.merchantPreference!.toLowerCase()
    );
  } else {
    targetProduct = state.currentProducts[0];
  }

  if (!targetProduct) {
    return {
      assistantMessage: "I couldn't identify which product to buy. Please say 'buy the first one' or 'buy the Myntra one'.",
      products: state.currentProducts.length > 0 ? state.currentProducts : undefined,
      suggestions: ['Buy the first one', 'Buy the cheapest', 'Buy the Myntra one']
    };
  }

  const merchant = getMerchantByName(targetProduct.merchant);
  if (!merchant) {
    return { assistantMessage: `Can't connect to ${targetProduct.merchant}.`, suggestions: ['Try again'] };
  }

  try {
    const session = await createCheckout(merchant, targetProduct.id, 1);
    setCheckoutSession(conversationId, session);
    const savings = targetProduct.originalPrice - targetProduct.price;

    return {
      assistantMessage: `Added **${targetProduct.name}** to cart on ${targetProduct.merchant}.\n\n- Price: ₹${targetProduct.price.toLocaleString()} *(saved ₹${savings.toLocaleString()})*\n- Taxes (18%): ₹${session.taxes.toLocaleString()}\n- Delivery: ${session.deliveryFee === 0 ? 'Free' : `₹${session.deliveryFee}`}\n- **Total: ₹${session.total.toLocaleString()}**`,
      cart: session,
      suggestions: ['Proceed to payment', 'Increase quantity to 2', 'Apply coupon SAVE10', 'Cancel order']
    };
  } catch (err) {
    console.error('Checkout error:', err);
    return { assistantMessage: `Failed to add ${targetProduct.name} to cart.`, suggestions: ['Try again'] };
  }
}

// ─── Change Quantity ──────────────────────────────────────────────────────────

async function handleChangeQuantity(intent: ChangeQuantityIntent, conversationId: string): Promise<ChatResponse> {
  const state = getOrCreateConversation(conversationId);
  if (!state.currentCheckoutSession) {
    return { assistantMessage: "No active cart to update.", suggestions: ['Search for products'] };
  }

  const currentQty = state.currentCheckoutSession.quantity;
  let newQty = intent.quantity !== undefined ? intent.quantity : currentQty + (intent.delta ?? 0);

  if (newQty < 1) {
    return {
      assistantMessage: "Quantity can't be less than 1. Cancel the order?",
      cart: state.currentCheckoutSession,
      suggestions: ['Cancel order', 'Keep at 1']
    };
  }

  const merchant = getMerchantByName(state.currentCheckoutSession.merchant);
  if (!merchant) return { assistantMessage: 'Merchant not available.', suggestions: [] };

  try {
    const updated = await updateCheckout(merchant, state.currentCheckoutSession.sessionId, { quantity: newQty });
    setCheckoutSession(conversationId, updated);

    return {
      assistantMessage: `Quantity updated to **${newQty}**.\n\n- Subtotal: ₹${updated.subtotal.toLocaleString()}\n- Taxes: ₹${updated.taxes.toLocaleString()}\n- Delivery: ${updated.deliveryFee === 0 ? 'Free' : `₹${updated.deliveryFee}`}${updated.discount > 0 ? `\n- Discount: -₹${updated.discount}` : ''}\n- **Total: ₹${updated.total.toLocaleString()}**`,
      cart: updated,
      suggestions: ['Proceed to payment', 'Apply coupon SAVE10', 'Cancel order']
    };
  } catch (err) {
    return { assistantMessage: 'Failed to update quantity.', cart: state.currentCheckoutSession, suggestions: ['Try again'] };
  }
}

// ─── Apply Coupon ─────────────────────────────────────────────────────────────

async function handleApplyCoupon(intent: ApplyCouponIntent, conversationId: string): Promise<ChatResponse> {
  const state = getOrCreateConversation(conversationId);
  if (!state.currentCheckoutSession) {
    return { assistantMessage: "No active cart.", suggestions: ['Search for products'] };
  }

  const merchant = getMerchantByName(state.currentCheckoutSession.merchant);
  if (!merchant) return { assistantMessage: 'Merchant not available.', suggestions: [] };

  try {
    const updated = await updateCheckout(merchant, state.currentCheckoutSession.sessionId, { couponCode: intent.couponCode });
    setCheckoutSession(conversationId, updated);

    return {
      assistantMessage: `Coupon **${intent.couponCode}** applied! Saved ₹${updated.discount.toLocaleString()}.\n\n- Subtotal: ₹${updated.subtotal.toLocaleString()}\n- Discount: -₹${updated.discount.toLocaleString()}\n- Taxes: ₹${updated.taxes.toLocaleString()}\n- Delivery: ${updated.deliveryFee === 0 ? 'Free' : `₹${updated.deliveryFee}`}\n- **Total: ₹${updated.total.toLocaleString()}**`,
      cart: updated,
      suggestions: ['Proceed to payment', 'Cancel order']
    };
  } catch (err: any) {
    const msg = err?.response?.data?.error || 'Invalid coupon';
    return {
      assistantMessage: `Coupon "${intent.couponCode}" is not valid. ${msg}`,
      cart: state.currentCheckoutSession,
      suggestions: ['Try SAVE10', 'Try MYNTRA20', 'Proceed without coupon']
    };
  }
}

// ─── Init Payment ─────────────────────────────────────────────────────────────

async function handleInitPayment(conversationId: string): Promise<ChatResponse> {
  const state = getOrCreateConversation(conversationId);
  if (!state.currentCheckoutSession) {
    return { assistantMessage: "No active cart. Search for products first.", suggestions: ['Search for products'] };
  }

  const merchant = getMerchantByName(state.currentCheckoutSession.merchant);
  if (!merchant) return { assistantMessage: 'Merchant not available.', suggestions: [] };

  try {
    const payment = await initPayment(merchant, state.currentCheckoutSession.sessionId);
    setPendingPayment(conversationId, payment);

    return {
      assistantMessage: `Opening payment for **₹${payment.amount.toLocaleString()}** via ${payment.merchant}. Choose your payment method in the popup.`,
      cart: state.currentCheckoutSession,
      payment,
      suggestions: []
    };
  } catch (err) {
    console.error('Payment init error:', err);
    return { assistantMessage: 'Failed to initialize payment.', cart: state.currentCheckoutSession, suggestions: ['Try again'] };
  }
}

// ─── Cancel Checkout ──────────────────────────────────────────────────────────

async function handleCancelCheckout(conversationId: string): Promise<ChatResponse> {
  const state = getOrCreateConversation(conversationId);
  if (!state.currentCheckoutSession) {
    return { assistantMessage: "Nothing to cancel.", suggestions: ['Search for products'] };
  }
  const name = state.currentCheckoutSession.product.name;
  setCheckoutSession(conversationId, null);
  updateConversation(conversationId, { status: 'IDLE' });
  return {
    assistantMessage: `Order for **${name}** cancelled. What would you like to do next?`,
    suggestions: ['Search for products']
  };
}

// ─── Compare Products ─────────────────────────────────────────────────────────

async function handleCompareProducts(conversationId: string): Promise<ChatResponse> {
  const state = getOrCreateConversation(conversationId);
  if (state.currentProducts.length < 2) {
    return { assistantMessage: "Need at least 2 products to compare.", suggestions: ['Search Nike shoes'] };
  }

  const products = state.currentProducts.slice(0, 4);
  const table = products.map((p, i) =>
    `**${i + 1}. ${p.name}** (${p.merchant})\n   ₹${p.price.toLocaleString()} · ${p.discount}% off · ⭐${p.rating} (${p.reviewCount.toLocaleString()})`
  ).join('\n\n');

  return {
    assistantMessage: `Comparing top ${products.length} options:\n\n${table}\n\nWhich would you like to buy?`,
    products,
    suggestions: products.map((p, i) => `Buy option ${i + 1} (${p.merchant})`)
  };
}

// ─── Track Order ──────────────────────────────────────────────────────────────

async function handleTrackOrder(conversationId: string): Promise<ChatResponse> {
  const state = getOrCreateConversation(conversationId);
  if (!state.lastOrder) {
    return { assistantMessage: "No orders placed yet.", suggestions: ['Search for products'] };
  }
  const o = state.lastOrder;
  return {
    assistantMessage: `**Order ${o.orderId}** — ${o.merchant}\n\n✅ ${o.status}\n💳 ${o.paymentMethod ? `Paid via ${o.paymentMethod}` : 'Paid'}\n📦 ${o.estimatedDelivery}`,
    order: o,
    suggestions: ['Search for more products']
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFilterDesc(filters: SearchIntent['filters']): string {
  const parts: string[] = [];
  if (filters.query) parts.push(`"${filters.query}"`);
  if (filters.brand) parts.push(filters.brand);
  if (filters.color) parts.push(filters.color);
  if (filters.maxPrice) parts.push(`under ₹${filters.maxPrice.toLocaleString()}`);
  return parts.length > 0 ? ` for ${parts.join(', ')}` : '';
}
