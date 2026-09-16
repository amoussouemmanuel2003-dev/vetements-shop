import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  initiateGeniusPayPayment,
  verifyGeniusPayPayment,
  handleGeniusPayWebhook
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🇨🇮 Routes GeniusPay (Côte d'Ivoire)
router.post('/geniuspay/initiate', protect, initiateGeniusPayPayment);
router.get('/geniuspay/verify/:reference', verifyGeniusPayPayment);
router.post('/geniuspay/webhook', handleGeniusPayWebhook);

// 💳 Routes Stripe (Compatibilité)
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

export default router;
