import jwt from 'jsonwebtoken';
import { findUserById } from '../models/User.js';

// Middleware d'authentification JWT
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_987654321'
      );

      const user = await findUserById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur introuvable avec ce token' });
      }

      // Attachement de l'utilisateur avec compatibilité _id et id
      req.user = {
        ...user,
        _id: user.id,
        id: user.id
      };

      return next();
    } catch (error) {
      console.error('[Auth Error]', error.message);
      return res.status(401).json({ message: 'Accès non autorisé, token invalide ou expiré' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé, aucun token fourni' });
  }
};

// Middleware d'authentification optionnelle (permet aux clients de commander sur WhatsApp sans compte obligatoire)
export const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_987654321'
      );

      const user = await findUserById(decoded.id);
      if (user) {
        req.user = {
          ...user,
          _id: user.id,
          id: user.id
        };
      }
    } catch (error) {
      console.warn('[Optional Auth Warning] Token invalide ou absent, commande en mode invité');
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

// Middleware de vérification des privilèges Administrateur
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accès interdit : privilèges administrateur requis' });
  }
};
