// ─── UCP Types ───────────────────────────────────────────────────────────────

export interface UCPCapabilities {
  catalog?: { endpoint: string; methods: string[] };
  checkout?: { endpoint: string; methods: string[] };
  payment?: {
    initEndpoint: string;
    verifyEndpoint: string;
    methods: string[];
  };
  orders?: { endpoint: string; methods: string[] };
}

export interface UCPMerchantMetadata {
  merchant: string;
  version: string;
  baseUrl: string;
  capabilities: UCPCapabilities;
}

// ─── Product Types ───────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  color: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  availability: string;
  imageUrl: string;
  description: string;
  merchant: string;
}

export interface SearchFilters {
  query?: string;
  brand?: string;
  color?: string;
  maxPrice?: number;
  minPrice?: number;
  category?: string;
}

// ─── Checkout Types ───────────────────────────────────────────────────────────

export interface CheckoutSession {
  sessionId: string;
  merchant: string;
  product: Product;
  quantity: number;
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  discount: number;
  couponCode: string | null;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  orderId?: string;
  confirmedAt?: string;
}

export interface PaymentInitResult {
  paymentToken: string;
  amount: number;
  currency: string;
  merchant: string;
  expiresIn: number;
  methods: Array<{ type: string; label: string; icon: string }>;
  sessionId: string;
}

export interface OrderConfirmation {
  orderId: string;
  merchant: string;
  status: string;
  paymentMethod?: string;
  message: string;
  items: Array<{ product: Product; quantity: number }>;
  total: number;
  estimatedDelivery: string;
}

// ─── Conversation Types ───────────────────────────────────────────────────────

export type ConversationStatus =
  | 'IDLE'
  | 'SEARCHING'
  | 'VIEWING_PRODUCTS'
  | 'CHECKOUT_PENDING'
  | 'CHECKOUT_ACTIVE'
  | 'PAYMENT_PENDING'
  | 'ORDER_CONFIRMED';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationState {
  id: string;
  status: ConversationStatus;
  currentMerchant: string | null;
  currentCheckoutSession: CheckoutSession | null;
  pendingPayment: PaymentInitResult | null;
  currentProducts: Product[];
  selectedProduct: Product | null;
  selectedQuantity: number;
  history: ConversationMessage[];
  lastOrder: OrderConfirmation | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Intent Types ─────────────────────────────────────────────────────────────

export type IntentType =
  | 'SEARCH_PRODUCTS'
  | 'COMPARE_PRODUCTS'
  | 'CREATE_CHECKOUT'
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'CHANGE_QUANTITY'
  | 'APPLY_COUPON'
  | 'COMPLETE_CHECKOUT'
  | 'CANCEL_CHECKOUT'
  | 'TRACK_ORDER'
  | 'UNKNOWN';

export interface SearchIntent {
  intent: 'SEARCH_PRODUCTS';
  filters: SearchFilters;
}

export interface CreateCheckoutIntent {
  intent: 'CREATE_CHECKOUT';
  productId?: string;
  productIndex?: number;
  merchantPreference?: string;
}

export interface ChangeQuantityIntent {
  intent: 'CHANGE_QUANTITY';
  quantity: number;
  delta?: number;
}

export interface ApplyCouponIntent {
  intent: 'APPLY_COUPON';
  couponCode: string;
}

export interface SimpleIntent {
  intent: 'COMPLETE_CHECKOUT' | 'CANCEL_CHECKOUT' | 'COMPARE_PRODUCTS' | 'TRACK_ORDER' | 'UNKNOWN';
}

export type ParsedIntent =
  | SearchIntent
  | CreateCheckoutIntent
  | ChangeQuantityIntent
  | ApplyCouponIntent
  | SimpleIntent;

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ChatResponse {
  assistantMessage: string;
  products?: Product[];
  cart?: CheckoutSession | null;
  checkout?: CheckoutSession | null;
  order?: OrderConfirmation | null;
  payment?: PaymentInitResult | null;
  suggestions?: string[];
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
}
