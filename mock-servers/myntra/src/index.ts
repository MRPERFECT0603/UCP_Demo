import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// ─── UCP Discovery ───────────────────────────────────────────────────────────

app.get('/.well-known/ucp', (_req, res) => {
  res.json({
    merchant: 'Myntra',
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
    id: 'mn-001',
    name: 'Nike Air Max 270',
    brand: 'Nike',
    category: 'Lifestyle Shoes',
    color: 'Triple Black',
    price: 4699,
    originalPrice: 6999,
    discount: 33,
    rating: 4.4,
    reviewCount: 1480,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/nike-air-max-270.webp`,
    description: 'Triple black colourway with the tallest Air unit in Nike history. Textured mesh upper and heel pull tab for easy on/off.'
  },
  {
    id: 'mn-002',
    name: 'Nike Free Run 5.0',
    brand: 'Nike',
    category: 'Running Shoes',
    color: 'White/Navy',
    price: 3899,
    originalPrice: 5999,
    discount: 35,
    rating: 4.2,
    reviewCount: 710,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/nike-free-run-5.jpg`,
    description: 'White and light grey Flyknit upper with navy swoosh and coral pull tab. Deeply segmented Free sole for natural barefoot-like flex.'
  },
  {
    id: 'mn-003',
    name: 'Adidas Superstar',
    brand: 'Adidas',
    category: 'Casual Shoes',
    color: 'Black/White',
    price: 5999,
    originalPrice: 7999,
    discount: 25,
    rating: 4.5,
    reviewCount: 3200,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/adidas-superstar.jpeg`,
    description: 'Classic black leather upper with bold white 3-Stripes and iconic shell toe. The original b-ball sneaker since 1969.'
  },
  {
    id: 'mn-004',
    name: 'Adidas Ultraboost Light',
    brand: 'Adidas',
    category: 'Running Shoes',
    color: 'Triple Black',
    price: 12999,
    originalPrice: 18000,
    discount: 28,
    rating: 4.7,
    reviewCount: 890,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/adidas-ultraboost-light.webp`,
    description: 'All-black Light BOOST midsole — 30% lighter than original BOOST. Black Primeknit upper and black Continental rubber outsole.'
  },
  {
    id: 'mn-005',
    name: 'Reebok Club C 85',
    brand: 'Reebok',
    category: 'Casual Shoes',
    color: 'Black/White/Gum',
    price: 4499,
    originalPrice: 5999,
    discount: 25,
    rating: 4.1,
    reviewCount: 560,
    availability: 'In Stock',
    imageUrl: `${BASE_IMG}/reebok-classic-leather.jpeg`,
    description: 'Black leather upper with white pinstripe, iconic Reebok wordmark, and honey gum outsole. Clean retro court style.'
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

  res.json({ merchant: 'Myntra', products: results, total: results.length });
});

// ─── Checkout ────────────────────────────────────────────────────────────────

const checkoutSessions: Record<string, any> = {};

app.post('/ucp/checkout', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const sessionId = `cs_mn_${uuidv4().slice(0, 8)}`;
  const subtotal = product.price * quantity;
  const taxes = Math.round(subtotal * 0.18);
  const deliveryFee = subtotal > 799 ? 0 : 49;

  checkoutSessions[sessionId] = {
    sessionId,
    merchant: 'Myntra',
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
    } else if (couponCode === 'MYNTRA20') {
      session.discount = Math.round(session.product.price * session.quantity * 0.20);
      session.couponCode = couponCode;
    } else {
      return res.status(400).json({ error: 'Invalid coupon code' });
    }
  }

  session.subtotal = session.product.price * session.quantity;
  session.taxes = Math.round(session.subtotal * 0.18);
  session.deliveryFee = session.subtotal > 799 ? 0 : 49;
  session.total = session.subtotal + session.taxes + session.deliveryFee - session.discount;

  res.json(session);
});

app.get('/ucp/checkout/:sessionId', (req, res) => {
  const session = checkoutSessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// Payment init
app.post('/ucp/checkout/:sessionId/payment/init', (req, res) => {
  const session = checkoutSessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const paymentToken = `ptok_mn_${uuidv4().slice(0, 12)}`;
  session.paymentToken = paymentToken;
  session.paymentStatus = 'AWAITING_PAYMENT';

  res.json({
    paymentToken,
    amount: session.total,
    currency: 'INR',
    merchant: 'Myntra',
    expiresIn: 600,
    methods: [
      { type: 'card', label: 'Credit / Debit Card', icon: 'card' },
      { type: 'upi', label: 'UPI / Google Pay', icon: 'upi' },
      { type: 'cod', label: 'Cash on Delivery', icon: 'cod' }
    ]
  });
});

// Payment verify
app.post('/ucp/checkout/:sessionId/payment/verify', (req, res) => {
  const session = checkoutSessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const { paymentToken, method } = req.body;
  if (paymentToken !== session.paymentToken) {
    return res.status(400).json({ error: 'Invalid payment token' });
  }

  const orderId = `MN${Date.now()}`;
  session.status = 'CONFIRMED';
  session.paymentStatus = 'PAID';
  session.orderId = orderId;
  session.paymentMethod = method;
  session.confirmedAt = new Date().toISOString();

  res.json({
    orderId,
    merchant: 'Myntra',
    status: 'CONFIRMED',
    paymentMethod: method,
    message: `Order ${orderId} placed successfully on Myntra!`,
    items: [{ product: session.product, quantity: session.quantity }],
    total: session.total,
    estimatedDelivery: '4-6 business days'
  });
});

app.post('/ucp/checkout/:sessionId/complete', (req, res) => {
  const session = checkoutSessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const orderId = `MN${Date.now()}`;
  session.status = 'CONFIRMED';
  session.orderId = orderId;
  session.confirmedAt = new Date().toISOString();

  res.json({
    orderId,
    merchant: 'Myntra',
    status: 'CONFIRMED',
    message: `Order ${orderId} placed successfully on Myntra!`,
    items: [{ product: session.product, quantity: session.quantity }],
    total: session.total,
    estimatedDelivery: '4-6 business days'
  });
});

const PORT = 3002;
app.listen(PORT, () => console.log(`Myntra UCP Server running on port ${PORT}`));
