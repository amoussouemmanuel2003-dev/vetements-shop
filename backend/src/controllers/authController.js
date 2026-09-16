import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { findUserByEmail, createUser, findUserById, updateUser } from '../models/User.js';

// Générateur de token JWT
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_987654321',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userExists = await findUserByEmail(cleanEmail);
    if (userExists) {
      return res.status(400).json({ message: 'Un compte existe déjà avec cette adresse email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await createUser(name, cleanEmail, passwordHash);

    res.status(201).json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shippingAddress: user.shipping_address,
      token: generateToken(user.id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Connexion utilisateur & obtention du token JWT
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez renseigner un email et un mot de passe' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await findUserByEmail(cleanEmail);

    // Cas spécifique pour le compte Administrateur de démonstration
    if (cleanEmail === 'admin@mode.com') {
      const salt = await bcrypt.genSalt(10);
      const defaultAdminHash = await bcrypt.hash('Password123!', salt);

      // Si le compte admin n'existe pas encore dans Neon, le créer directement
      if (!user) {
        const insertRes = await pool.query(
          `INSERT INTO users (name, email, password, role, shipping_address)
           VALUES ($1, $2, $3, 'admin', '{}'::jsonb)
           RETURNING *`,
          ['Administrateur', 'admin@mode.com', defaultAdminHash]
        );
        user = insertRes.rows[0];
      }

      // S'assurer que le rôle est bien 'admin'
      if (user.role !== 'admin') {
        await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
        user.role = 'admin';
      }

      // Vérification mot de passe (accepte Password123! ou password123)
      const isPasswordValid = 
        (await bcrypt.compare(password, user.password)) || 
        password === 'Password123!' || 
        password === 'password123';

      if (isPasswordValid) {
        return res.json({
          _id: user.id,
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'admin',
          shippingAddress: user.shipping_address,
          token: generateToken(user.id)
        });
      }
    }

    // Authentification standard
    if (user && (await bcrypt.compare(password, user.password))) {
      return res.json({
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        shippingAddress: user.shipping_address,
        token: generateToken(user.id)
      });
    }

    res.status(401).json({ message: 'Identifiants invalides (email ou mot de passe incorrect)' });
  } catch (error) {
    next(error);
  }
};

// @desc    Récupérer le profil de l'utilisateur connecté
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shippingAddress: user.shipping_address
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour le profil utilisateur
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    let passwordHash = null;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await updateUser(userId, {
      name: req.body.name,
      email: req.body.email,
      shippingAddress: req.body.shippingAddress,
      passwordHash
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.json({
      _id: updatedUser.id,
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      shippingAddress: updatedUser.shipping_address,
      token: generateToken(updatedUser.id)
    });
  } catch (error) {
    next(error);
  }
};
