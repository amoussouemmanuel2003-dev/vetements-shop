import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Chargement des variables d'environnement
dotenv.config();

// Connexion et initialisation du schéma PostgreSQL Neon
connectDB();

const app = express();

// Middlewares globaux
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Endpoint de vérification de santé de l'API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    database: 'PostgreSQL (Neon)',
    message: 'API E-commerce Vêtements opérationnelle 🚀'
  });
});

// Montage des routes REST
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Middlewares d'erreurs
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Express] Serveur démarré sur le port ${PORT} avec PostgreSQL (Neon)`);
});
