import { pool } from '../config/db.js';

// Fonction de secours pour s'assurer que toutes les colonnes requises existent
const ensureUserColumns = async () => {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
  } catch (err) {
    console.error('[Migration users error]', err.message);
  }
};

// Rechercher un utilisateur par son email
export const findUserByEmail = async (email) => {
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
  const user = result.rows[0];
  if (!user) return null;
  return {
    ...user,
    shipping_address: user.shipping_address || {},
    role: user.role || 'user'
  };
};

// Créer un nouvel utilisateur avec auto-réparation des colonnes
export const createUser = async (name, email, passwordHash) => {
  const cleanEmail = email.trim().toLowerCase();
  
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, shipping_address) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name.trim(), cleanEmail, passwordHash, 'user', '{}']
    );
    const user = result.rows[0];
    return {
      ...user,
      shipping_address: user.shipping_address || {},
      role: user.role || 'user'
    };
  } catch (err) {
    // Si une colonne manque (ex: shipping_address inexistante dans Neon)
    if (err.code === '42703' || (err.message && err.message.includes('shipping_address'))) {
      console.log('[Auto-Heal] Ajout de la colonne shipping_address dans la table users...');
      await ensureUserColumns();
      
      // Réessai immédiat de l'insertion
      const retryResult = await pool.query(
        `INSERT INTO users (name, email, password, role, shipping_address) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [name.trim(), cleanEmail, passwordHash, 'user', '{}']
      );
      const user = retryResult.rows[0];
      return {
        ...user,
        shipping_address: user.shipping_address || {},
        role: user.role || 'user'
      };
    }
    throw err;
  }
};

// Rechercher un utilisateur par son ID
export const findUserById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  const user = result.rows[0];
  if (!user) return null;
  return {
    ...user,
    shipping_address: user.shipping_address || {},
    role: user.role || 'user'
  };
};

// Mettre à jour le profil d'un utilisateur
export const updateUser = async (id, { name, email, shippingAddress, passwordHash }) => {
  const currentUser = await findUserById(id);
  if (!currentUser) return null;

  await ensureUserColumns();

  const newName = name || currentUser.name;
  const newEmail = email ? email.trim().toLowerCase() : currentUser.email;
  const newAddress = shippingAddress ? JSON.stringify(shippingAddress) : JSON.stringify(currentUser.shipping_address || {});
  
  let query = '';
  let params = [];

  if (passwordHash) {
    query = `
      UPDATE users 
      SET name = $1, email = $2, shipping_address = $3, password = $4
      WHERE id = $5
      RETURNING *
    `;
    params = [newName, newEmail, newAddress, passwordHash, id];
  } else {
    query = `
      UPDATE users 
      SET name = $1, email = $2, shipping_address = $3
      WHERE id = $4
      RETURNING *
    `;
    params = [newName, newEmail, newAddress, id];
  }

  const result = await pool.query(query, params);
  const user = result.rows[0];
  return {
    ...user,
    shipping_address: user.shipping_address || {},
    role: user.role || 'user'
  };
};

export const User = {
  findByEmail: findUserByEmail,
  findById: findUserById,
  create: createUser,
  update: updateUser
};

export default User;