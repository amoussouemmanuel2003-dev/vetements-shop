import { pool } from '../config/db.js';

// Fonction de secours pour s'assurer que les colonnes de orders existent
const ensureOrderColumns = async () => {
  try {
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_items JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Stripe';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_result JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_price NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_price NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_fee NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'En attente';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
  } catch (err) {
    console.error('[Migration orders error]', err.message);
  }
};

// Normalisation pour compatibilité frontend (_id, orderItems, shippingAddress)
export const formatOrder = (o) => {
  if (!o) return null;
  return {
    ...o,
    _id: o.id,
    id: o.id,
    orderItems: typeof o.order_items === 'string' ? JSON.parse(o.order_items) : (o.order_items || []),
    shippingAddress: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : (o.shipping_address || {}),
    paymentMethod: o.payment_method,
    paymentResult: typeof o.payment_result === 'string' ? JSON.parse(o.payment_result) : (o.payment_result || {}),
    itemsPrice: Number(o.items_price),
    shippingPrice: Number(o.shipping_price),
    commissionFee: Number(o.commission_fee || 0),
    totalPrice: Number(o.total_price),
    isPaid: Boolean(o.is_paid),
    paidAt: o.paid_at,
    orderStatus: o.order_status,
    deliveredAt: o.delivered_at,
    createdAt: o.created_at,
    user: o.user_name ? { id: o.user_id, name: o.user_name, email: o.user_email } : o.user_id
  };
};

export const createOrder = async ({
  userId,
  orderItems,
  shippingAddress,
  paymentMethod = 'Wave',
  itemsPrice,
  shippingPrice = 1500,
  commissionFee = 50,
  totalPrice
}) => {
  await ensureOrderColumns();
  const result = await pool.query(
    `INSERT INTO orders 
      (user_id, order_items, shipping_address, payment_method, items_price, shipping_price, commission_fee, total_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      JSON.stringify(orderItems),
      JSON.stringify(shippingAddress),
      paymentMethod,
      itemsPrice,
      shippingPrice,
      commissionFee,
      totalPrice
    ]
  );
  return formatOrder(result.rows[0]);
};

export const findOrdersByUserId = async (userId) => {
  await ensureOrderColumns();
  const result = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map(formatOrder);
};

export const findOrderById = async (id) => {
  await ensureOrderColumns();
  const result = await pool.query(
    `SELECT orders.*, users.name as user_name, users.email as user_email 
     FROM orders 
     LEFT JOIN users ON orders.user_id = users.id 
     WHERE orders.id = $1`,
    [id]
  );
  return formatOrder(result.rows[0]);
};

export const findAllOrders = async () => {
  await ensureOrderColumns();
  const result = await pool.query(
    `SELECT orders.*, users.name as user_name, users.email as user_email 
     FROM orders 
     LEFT JOIN users ON orders.user_id = users.id 
     ORDER BY orders.created_at DESC`
  );
  return result.rows.map(formatOrder);
};

export const updateOrderStatus = async (id, status) => {
  await ensureOrderColumns();
  const isDelivered = status === 'Livrée';
  const result = await pool.query(
    `UPDATE orders 
     SET order_status = $1, delivered_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE delivered_at END 
     WHERE id = $3 
     RETURNING *`,
    [status, isDelivered, id]
  );
  return formatOrder(result.rows[0]);
};

export const markOrderAsPaid = async (id, paymentResult) => {
  await ensureOrderColumns();
  const result = await pool.query(
    `UPDATE orders 
     SET is_paid = true, paid_at = CURRENT_TIMESTAMP, order_status = 'Payée', payment_result = $1 
     WHERE id = $2 
     RETURNING *`,
    [JSON.stringify(paymentResult), id]
  );
  return formatOrder(result.rows[0]);
};

export const Order = {
  create: createOrder,
  findByUserId: findOrdersByUserId,
  findById: findOrderById,
  findAll: findAllOrders,
  updateStatus: updateOrderStatus,
  markPaid: markOrderAsPaid
};

export default Order;
