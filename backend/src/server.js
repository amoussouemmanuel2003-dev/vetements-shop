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

// Configuration CORS dynamique (compatible Vercel, Render, Localhost et CLIENT_URL)
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Requêtes directes ou sans header Origin (Postman, scripts, curl)
    if (!origin) return callback(null, true);

    // Autoriser localhost et 127.0.0.1
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Autoriser automatiquement tous les déploiements Vercel (*.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Autoriser les domaines personnalisés définis dans CLIENT_URL
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Autoriser par défaut pour garantir l'accès à la boutique
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de protection contre le double préfixe /api/api
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  }
  next();
});
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
