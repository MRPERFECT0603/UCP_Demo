import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// ─── UCP Discovery ───────────────────────────────────────────────────────────

app.get('/.well-known/ucp', (_req, res) => {
  res.json({
    merchant: 'Flipkart',
    version: '1.0',
    capabilities: {
      catalog: { endpoint: '/ucp/catalog/search', methods: ['GET'] },
      checkout: { endpoint: '/ucp/checkout', methods: ['POST', 'PUT'] },
      payment: {
        initEndpoint: '/ucp/checkout/:sessionId/payment/init',
        verifyEndpoint: '/ucp/checkout/:sessionId/payment/verify',
        methods: ['POST']
      },
      orders: { endpoint: '/ucp/orders/:orderId', methods: ['GET'] }
    }
  });
});

// ─── Product Catalog ─────────────────────────────────────────────────────────

const BASE_IMG = 'http://localhost:5173/images';

const products = [
  {
    id: 'fk-001',
    name: 'Nike Air Max 270',
    brand: 'Nike',
    category: 'Lifestyle Shoes',
    color: 'Triple Black',
    price: 4799,
    originalPrice: 6999,
    discount: 31,
    rating: 4.3,
    reviewCount: 1250,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/nike-air-max-270.webp`,
    description: 'All-black colourway with a large 270-degree Air heel unit and breathable mesh upper. Maximum cushioning for all-day comfort.'
  },
  {
    id: 'fk-002',
    name: 'Nike Revolution 6',
    brand: 'Nike',
    category: 'Running Shoes',
    color: 'Royal Blue/Yellow',
    price: 3299,
    originalPrice: 4999,
    discount: 34,
    rating: 4.1,
    reviewCount: 890,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/nike-revolution-6.jpg`,
    description: 'Vibrant royal blue mesh upper with yellow heel accent and orange pull tab. Lightweight foam midsole for everyday runs.'
  },
  {
    id: 'fk-003',
    name: 'Adidas Ultraboost 22',
    brand: 'Adidas',
    category: 'Running Shoes',
    color: 'Black/Silver',
    price: 8999,
    originalPrice: 13999,
    discount: 36,
    rating: 4.6,
    reviewCount: 2100,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/adidas-ultraboost-22.webp`,
    description: 'Black Primeknit upper with silver 3-Stripes and signature white BOOST midsole. Exceptional energy return for serious runners.'
  },
  {
    id: 'fk-004',
    name: 'Adidas NMD R1',
    brand: 'Adidas',
    category: 'Casual Shoes',
    color: 'Triple Black',
    price: 7499,
    originalPrice: 9999,
    discount: 25,
    rating: 4.4,
    reviewCount: 680,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/adidas-nmd-r1.jpeg`,
    description: 'Full triple-black colourway with tonal NMD plug midsole inserts and Japanese branding details. Iconic streetwear silhouette.'
  },
  {
    id: 'fk-005',
    name: 'Puma Softride Enzo',
    brand: 'Puma',
    category: 'Running Shoes',
    color: 'Triple Black',
    price: 2999,
    originalPrice: 4499,
    discount: 33,
    rating: 3.9,
    reviewCount: 420,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/puma-softride-enzo.webp`,
    description: 'Sleek all-black sock-like knit upper with SoftFoam+ insole and perforated SOFTRIDE midsole for cloud-like cushioning.'
  }
];

app.get('/ucp/catalog/search', (req, res) => {
  const { q, brand, color, maxPrice, minPrice, category } = req.query as Record<string, string>;

  let results = [...products];

  if (q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    results = results.filter(p => {
      const haystack = `${p.name} ${p.brand} ${p.category} ${p.color} ${p.description}`.toLowerCase();
      return words.every(w => haystack.includes(w));
    });
  }
  if (brand) results = results.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  if (color) results = results.filter(p => p.color.toLowerCase().includes(color.toLowerCase()));
  if (maxPrice) results = results.filter(p => p.price <= parseInt(maxPrice));
  if (minPrice) results = results.filter(p => p.price >= parseInt(minPrice));
  if (category) results = results.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));

  res.json({ merchant: 'Flipkart', products: results, total: results.length });
});

// ─── Checkout ────────────────────────────────────────────────────────────────

const checkoutSessions: Record<string, any> = {};

app.post('/ucp/checkout', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const sessionId = `cs_fk_${uuidv4().slice(0, 8)}`;
  const subtotal = product.price * quantity;
  const taxes = Math.round(subtotal * 0.18);
  const deliveryFee = subtotal > 499 ? 0 : 40;

  checkoutSessions[sessionId] = {
    sessionId,
    merchant: 'Flipkart',
    product,
    quantity,
    subtotal,
    taxes,
    deliveryFee,
    discount: 0,
    couponCode: null,
    total: subtotal + taxes + deliveryFee,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  res.status(201).json(checkoutSessions[sessionId]);
});

app.put('/ucp/checkout/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = checkoutSessions[sessionId];

  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { quantity, couponCode } = req.body;

  if (quantity !== undefined) session.quantity = quantity;
  if (couponCode !== undefined) {
    if (couponCode === 'SAVE10') {
      session.discount = Math.round(session.product.price * session.quantity * 0.10);
      session.couponCode = couponCode;
    } else if (couponCode === 'FLAT200') {
      session.discount = 200;
      session.couponCode = couponCode;
    } else {
      return res.status(400).json({ error: 'Invalid coupon code' });
    }
  }

  session.subtotal = session.product.price * session.quantity;
  session.taxes = Math.round(session.subtotal * 0.18);
  session.deliveryFee = session.subtotal > 499 ? 0 : 40;
  session.total = session.subtotal + session.taxes + session.deliveryFee - session.discount;

  res.json(session);
});

app.get('/ucp/checkout/:sessionId', (req, res) => {
  const session = checkoutSessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// Payment init — returns payment methods and a payment token
app.post('/ucp/checkout/:sessionId/payment/init', (req, res) => {
  const session = checkoutSessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const paymentToken = `ptok_fk_${uuidv4().slice(0, 12)}`;
  session.paymentToken = paymentToken;
  session.paymentStatus = 'AWAITING_PAYMENT';

  res.json({
    paymentToken,
    amount: session.total,
    currency: 'INR',
    merchant: 'Flipkart',
    expiresIn: 600,
    methods: [
      { type: 'card', label: 'Credit / Debit Card', icon: 'card' },
      { type: 'upi', label: 'UPI / Google Pay', icon: 'upi' },
      { type: 'cod', label: 'Cash on Delivery', icon: 'cod' }
    ]
  });
});

// Payment verify — called after user "pays"
app.post('/ucp/checkout/:sessionId/payment/verify', (req, res) => {
  const session = checkoutSessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { paymentToken, method } = req.body;

  if (paymentToken !== session.paymentToken) {
    return res.status(400).json({ error: 'Invalid payment token' });
  }

  const orderId = `FK${Date.now()}`;
  session.status = 'CONFIRMED';
  session.paymentStatus = 'PAID';
  session.orderId = orderId;
  session.paymentMethod = method;
  session.confirmedAt = new Date().toISOString();

  res.json({
    orderId,
    merchant: 'Flipkart',
    status: 'CONFIRMED',
    paymentMethod: method,
    message: `Order ${orderId} placed successfully on Flipkart!`,
    items: [{ product: session.product, quantity: session.quantity }],
    total: session.total,
    estimatedDelivery: '3-5 business days'
  });
});

// Keep legacy complete endpoint for backward compat
app.post('/ucp/checkout/:sessionId/complete', (req, res) => {
  const session = checkoutSessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const orderId = `FK${Date.now()}`;
  session.status = 'CONFIRMED';
  session.orderId = orderId;
  session.confirmedAt = new Date().toISOString();

  res.json({
    orderId,
    merchant: 'Flipkart',
    status: 'CONFIRMED',
    message: `Order ${orderId} placed successfully on Flipkart!`,
    items: [{ product: session.product, quantity: session.quantity }],
    total: session.total,
    estimatedDelivery: '3-5 business days'
  });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Flipkart UCP Server running on port ${PORT}`));
