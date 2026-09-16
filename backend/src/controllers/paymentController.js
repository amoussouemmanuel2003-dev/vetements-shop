import Stripe from 'stripe';
import { findOrderById, markOrderAsPaid } from '../models/Order.js';

const getStripeInstance = () => {
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
};

// ==========================================
// 🇨🇮 INTÉGRATION GENIUSPAY (CÔTE D'IVOIRE)
// ==========================================

/**
 * @desc    Initier une session de paiement avec GeniusPay (Wave, OM, MoMo, Moov, Carte)
 * @route   POST /api/payments/geniuspay/initiate
 * @access  Private
 */
export const initiateGeniusPayPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Identifiant de commande manquant.' });
    }

    const order = await findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée pour le paiement.' });
    }

    const amountInXOF = Math.round(Number(order.totalPrice || order.total_price));
    const customerName = order.shippingAddress?.customerName || req.user.name || 'Client Atelier Mode';
    const customerPhone = order.shippingAddress?.customerPhone || '';
    const customerEmail = req.user.email || 'client@mode.com';

    const apiKey = process.env.GENIUSPAY_API_KEY;
    const apiSecret = process.env.GENIUSPAY_API_SECRET;
    const apiUrl = process.env.GENIUSPAY_API_URL || 'https://pay.genius.ci/api/v1/merchant';
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // Mode simulation / sandbox automatique si les clés réelles ne sont pas encore configurées dans .env
    const isPlaceholder = !apiKey || !apiSecret || apiKey.includes('votre_cle_ici') || apiKey.includes('placeholder');

    if (isPlaceholder) {
      console.log(`[GeniusPay Simulator] Clés non configurées dans .env. Démarrage de la simulation pour la commande #${order.id}.`);
      const simRef = `GENIUS-SIM-${Date.now()}`;
      return res.json({
        success: true,
        isSimulation: true,
        reference: simRef,
        checkoutUrl: `${clientUrl}/checkout?status=success&order_id=${order.id}&reference=${simRef}&sim=1`,
        message: 'Mode simulation actif. Renseignez vos clés GENIUSPAY_API_KEY et GENIUSPAY_API_SECRET dans backend/.env pour les paiements réels.'
      });
    }

    // Appel direct à l'API GeniusPay Côte d'Ivoire
    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInXOF,
        currency: 'XOF',
        description: `Commande #${order.id} - Atelier Mode CI`,
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail
        },
        metadata: {
          order_id: order.id.toString(),
          user_id: (req.user.id || req.user._id).toString()
        },
        success_url: `${clientUrl}/checkout?status=success&order_id=${order.id}`,
        error_url: `${clientUrl}/checkout?status=cancel&order_id=${order.id}`
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('[GeniusPay API Error]', result);
      return res.status(400).json({
        message: result.error?.message || result.message || 'Erreur lors de l’initialisation GeniusPay.'
      });
    }

    res.json({
      success: true,
      reference: result.data.reference,
      checkoutUrl: result.data.checkout_url || result.data.payment_url
    });
  } catch (error) {
    console.error('[GeniusPay Exception]', error);
    next(error);
  }
};

/**
 * @desc    Vérifier le statut d'un paiement GeniusPay et valider la commande
 * @route   GET /api/payments/geniuspay/verify/:reference
 * @access  Public / Private
 */
export const verifyGeniusPayPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const { order_id } = req.query;

    if (!reference) {
      return res.status(400).json({ message: 'Référence de transaction requise.' });
    }

    // Cas du mode simulation
    if (reference.startsWith('GENIUS-SIM-') && order_id) {
      const order = await findOrderById(order_id);
      if (order && !order.isPaid) {
        await markOrderAsPaid(order_id, {
          id: reference,
          status: 'completed',
          provider: 'GeniusPay (Simulation Sandbox)',
          paidAt: new Date().toISOString()
        });
      }
      return res.json({
        success: true,
        isPaid: true,
        status: 'completed',
        reference,
        message: 'Paiement simulé validé avec succès.'
      });
    }

    const apiKey = process.env.GENIUSPAY_API_KEY;
    const apiSecret = process.env.GENIUSPAY_API_SECRET;
    const apiUrl = process.env.GENIUSPAY_API_URL || 'https://pay.genius.ci/api/v1/merchant';

    const response = await fetch(`${apiUrl}/payments/${reference}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return res.status(400).json({
        success: false,
        message: result.error?.message || 'Transaction introuvable sur GeniusPay.'
      });
    }

    const txData = result.data;
    const isCompleted = txData.status === 'completed' || txData.status === 'successful';
    const targetOrderId = order_id || txData.metadata?.order_id;

    if (isCompleted && targetOrderId) {
      const updatedOrder = await markOrderAsPaid(targetOrderId, {
        id: txData.reference,
        status: txData.status,
        provider: txData.payment_method || txData.payment_provider || 'GeniusPay',
        amount: txData.amount,
        fees: txData.fees,
        customer: txData.customer,
        paidAt: txData.completed_at || new Date().toISOString()
      });

      return res.json({
        success: true,
        isPaid: true,
        order: updatedOrder
      });
    }

    res.json({
      success: true,
      isPaid: isCompleted,
      status: txData.status,
      orderId: targetOrderId
    });
  } catch (error) {
    console.error('[GeniusPay Verify Error]', error);
    next(error);
  }
};

/**
 * @desc    Webhook GeniusPay pour notification instantanée des transactions
 * @route   POST /api/payments/geniuspay/webhook
 * @access  Public
 */
export const handleGeniusPayWebhook = async (req, res) => {
  try {
    const payload = req.body;
    console.log('[GeniusPay Webhook Received]:', JSON.stringify(payload));

    const event = payload.event;
    const data = payload.data || payload;

    if (event === 'payment.success' || data.status === 'completed') {
      const orderId = data.metadata?.order_id;
      if (orderId) {
        await markOrderAsPaid(orderId, {
          id: data.reference,
          status: 'completed',
          provider: data.payment_method || data.payment_provider || 'GeniusPay',
          amount: data.amount,
          paidAt: data.completed_at || new Date().toISOString()
        });
        console.log(`[GeniusPay Webhook] Commande #${orderId} validée et marquée comme payée.`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[GeniusPay Webhook Error]:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// 💳 GESTION STRIPE (COMPATIBILITÉ)
// ==========================================

// @desc    Créer un PaymentIntent Stripe en FCFA (XOF)
// @route   POST /api/payments/create-payment-intent
// @access  Private
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée pour le paiement' });
    }

    const stripe = getStripeInstance();

    // XOF (Franc CFA) est une devise à zéro décimale dans Stripe (pas de multiplication par 100)
    const amountInXOF = Math.round(Number(order.totalPrice || order.total_price));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInXOF,
      currency: 'xof',
      metadata: {
        orderId: order.id.toString(),
        userId: (req.user.id || req.user._id).toString()
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirmer le paiement et valider la commande
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res, next) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    const stripe = getStripeInstance();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded' || paymentIntentId.startsWith('pi_mock')) {
      const paymentResult = {
        id: paymentIntent.id || paymentIntentId,
        status: paymentIntent.status || 'succeeded',
        updateTime: new Date().toISOString(),
        emailAddress: req.user.email
      };

      const updatedOrder = await markOrderAsPaid(orderId, paymentResult);
      res.json(updatedOrder);
    } else {
      res.status(400).json({ message: 'Le paiement n’a pas abouti' });
    }
  } catch (error) {
    next(error);
  }
};
