import {
  createOrder as insertOrder,
  findOrdersByUserId,
  findOrderById,
  findAllOrders,
  updateOrderStatus as editOrderStatus
} from '../models/Order.js';
import { getProductById } from '../models/Product.js';

// @desc    Créer une nouvelle commande en FCFA
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Le panier est vide' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ message: 'Adresse de livraison incomplète (Quartier/Commune requis)' });
    }

    // Sécurité : Re-calcul des prix côté serveur en FCFA
    let itemsPrice = 0;
    const verifiedOrderItems = [];

    for (const item of orderItems) {
      const productId = item.product || item.productId;
      const dbProduct = await getProductById(productId);

      if (!dbProduct) {
        return res.status(404).json({ message: `Article introuvable : ${item.name || productId}` });
      }

      const itemQty = Number(item.qty || item.quantity || 1);
      const unitPrice = Math.round(Number(dbProduct.price));
      const itemTotal = unitPrice * itemQty;
      itemsPrice += itemTotal;

      verifiedOrderItems.push({
        name: dbProduct.name || dbProduct.title,
        qty: itemQty,
        image: dbProduct.images?.[0] || dbProduct.image_url,
        price: unitPrice,
        size: item.size || 'Unique',
        color: item.color || 'Standard',
        product: dbProduct.id
      });
    }

    // Frais de livraison fixes Côte d'Ivoire : 1 500 FCFA
    const shippingPrice = 1500;

    // Commission sur paiement en ligne / Mobile Money (Wave, Orange, MTN, Moov)
    // 50 FCFA pour 1 article (<= 2000 F), 100 FCFA pour 2 articles (<= 4000 F), 200 FCFA pour 3+ articles
    let commissionFee = 50;
    if (itemsPrice > 4000) {
      commissionFee = 200;
    } else if (itemsPrice > 2000) {
      commissionFee = 100;
    }

    const totalPrice = Math.round(itemsPrice + shippingPrice + commissionFee);
    const userId = req.user ? (req.user.id || req.user._id) : null;

    const order = await insertOrder({
      userId,
      orderItems: verifiedOrderItems,
      shippingAddress: {
        ...shippingAddress,
        country: 'Côte d\'Ivoire'
      },
      paymentMethod: paymentMethod || 'Wave',
      itemsPrice: Math.round(itemsPrice),
      shippingPrice,
      commissionFee,
      totalPrice
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Récupérer les commandes de l'utilisateur connecté
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const orders = await findOrdersByUserId(userId);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Récupérer une commande par son ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await findOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    if (req.user) {
      const currentUserId = (req.user.id || req.user._id).toString();
      const orderUserId = (order.user_id || (order.user && order.user.id) || '').toString();

      // Vérification que l'utilisateur est le propriétaire ou un admin s'il est connecté
      if (orderUserId && orderUserId !== currentUserId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès non autorisé à cette commande' });
      }
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir toutes les commandes (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await findAllOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour le statut d'une commande (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const updatedOrder = await editOrderStatus(req.params.id, req.body.status);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};
