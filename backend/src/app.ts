import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.routes.js';
import { refreshMerchants } from './services/merchant.service.js';

const app = express();

app.use(cors());
app.use(express.json());

// Warm up merchant discovery at startup
refreshMerchants();

app.use('/chat', chatRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
