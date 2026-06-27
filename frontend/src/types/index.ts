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
  status: string;
  createdAt: string;
}

export interface PaymentInitResult {
  paymentToken: string;
  amount: number;
  currency: string;
  merchant: string;
  expiresIn: number;
  sessionId: string;
  methods: Array<{ type: string; label: string; icon: string }>;
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

export interface ChatApiResponse {
  conversationId: string;
  assistantMessage: string;
  products?: Product[];
  cart?: CheckoutSession | null;
  checkout?: CheckoutSession | null;
  order?: OrderConfirmation | null;
  payment?: PaymentInitResult | null;
  suggestions?: string[];
}

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  products?: Product[];
  cart?: CheckoutSession | null;
  order?: OrderConfirmation | null;
  payment?: PaymentInitResult | null;
  suggestions?: string[];
}
