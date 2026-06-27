import { Router } from 'express';
import { handleChat, handlePaymentVerify } from '../controllers/chat.controller.js';

const router = Router();

router.post('/', handleChat);
router.post('/payment/verify', handlePaymentVerify);

export default router;
