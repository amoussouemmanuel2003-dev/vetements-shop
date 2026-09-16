import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

// Configuration du pool de connexion PostgreSQL pour Neon
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requis pour Neon Database Cloud
  }
});

// Création, migration et initialisation automatique du catalogue à prix unique (2 000 FCFA)
const initializeTables = async (client) => {
  // 1. Création des tables de base si inexistantes
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      shipping_address JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      title VARCHAR(255),
      description TEXT,
      price NUMERIC(10, 2) NOT NULL DEFAULT 2000.00,
      category VARCHAR(100),
      subcategory VARCHAR(100),
      image_url TEXT,
      images JSONB DEFAULT '[]'::jsonb,
      sizes JSONB DEFAULT '["S", "M", "L"]'::jsonb,
      colors JSONB DEFAULT '[]'::jsonb,
      stock INTEGER DEFAULT 20,
      is_featured BOOLEAN DEFAULT false,
      rating NUMERIC(2, 1) DEFAULT 5.0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      order_items JSONB NOT NULL DEFAULT '[]'::jsonb,
      shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
      payment_method VARCHAR(50) DEFAULT 'Stripe',
      payment_result JSONB DEFAULT '{}'::jsonb,
      items_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      shipping_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      is_paid BOOLEAN DEFAULT false,
      paid_at TIMESTAMP WITH TIME ZONE,
      order_status VARCHAR(50) DEFAULT 'En attente',
      delivered_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Sécurité des colonnes
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

    ALTER TABLE products ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '["S", "M", "L"]'::jsonb;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) DEFAULT 5.0;

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_fee NUMERIC(10, 2) DEFAULT 0.00;

    -- 3. Application du Prix Unique : TOUS les articles sont fixés à 2 000 FCFA
    UPDATE products SET price = 2000;
  `;
  await client.query(schemaSQL);

  // 4. Insertion automatique du compte Administrateur si inexistant
  const adminCheck = await client.query("SELECT * FROM users WHERE LOWER(email) = 'admin@mode.com'");
  if (adminCheck.rows.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Password123!', salt);
    await client.query(
      `INSERT INTO users (name, email, password, role, shipping_address)
       VALUES ($1, $2, $3, 'admin', '{}'::jsonb)`,
      ['Administrateur', 'admin@mode.com', adminPassword]
    );
    console.log('[Neon PostgreSQL] Compte Administrateur (admin@mode.com) initialisé.');
  } else if (adminCheck.rows[0].role !== 'admin') {
    await client.query("UPDATE users SET role = 'admin' WHERE LOWER(email) = 'admin@mode.com'");
  }

  // 5. Peuplement automatique du catalogue de vêtements, chapeaux et pantalons (Tout à 2 000 FCFA)
  const prodCheck = await client.query("SELECT COUNT(*) FROM products");
  if (parseInt(prodCheck.rows[0].count, 10) === 0) {
    const defaultArticles = [
      {
        name: 'Bob Streetwear Coton Noir',
        title: 'Bob Streetwear Coton Noir',
        description: 'Chapeau bob urbain tendance en coton résistant, idéal pour se protéger du soleil avec style à Abidjan.',
        price: 2000,
        category: 'Accessoires',
        subcategory: 'Chapeaux',
        image_url: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80'],
        sizes: ['Unique'],
        colors: [{ name: 'Noir', hex: '#111827' }, { name: 'Kaki', hex: '#4B5320' }],
        stock: 35,
        is_featured: true,
        rating: 4.9
      },
      {
        name: 'Casquette Visière Courbée Brodée',
        title: 'Casquette Visière Courbée Brodée',
        description: 'Casquette snapback classique avec lanière ajustable à l’arrière. Finitions haute précision.',
        price: 2000,
        category: 'Accessoires',
        subcategory: 'Chapeaux',
        image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80'],
        sizes: ['Unique'],
        colors: [{ name: 'Blanc', hex: '#FFFFFF' }, { name: 'Noir', hex: '#000000' }],
        stock: 25,
        is_featured: true,
        rating: 4.8
      },
      {
        name: 'Pantalon Cargo Léger Multi-Poches',
        title: 'Pantalon Cargo Léger Multi-Poches',
        description: 'Pantalon cargo coupe droite avec poches latérales pratiques. Tissu respirant parfait pour le climat chaud.',
        price: 2000,
        category: 'Homme',
        subcategory: 'Pantalons',
        image_url: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80'],
        sizes: ['M', 'L', 'XL'],
        colors: [{ name: 'Kaki', hex: '#4B5320' }, { name: 'Noir', hex: '#111827' }],
        stock: 20,
        is_featured: true,
        rating: 5.0
      },
      {
        name: 'Pantalon Jogger Coupe Ample',
        title: 'Pantalon Jogger Coupe Ample',
        description: 'Pantalon fluide resserré aux chevilles, taille élastiquée avec cordon de serrage.',
        price: 2000,
        category: 'Homme',
        subcategory: 'Pantalons',
        image_url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [{ name: 'Gris', hex: '#4B5563' }, { name: 'Noir', hex: '#111827' }],
        stock: 18,
        is_featured: false,
        rating: 4.7
      },
      {
        name: 'T-Shirt Graphique Coton Premium',
        title: 'T-Shirt Graphique Coton Premium',
        description: 'Habit classique col rond en 100% coton doux. Impression durable et coupe moderne.',
        price: 2000,
        category: 'Homme',
        subcategory: 'Habits',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [{ name: 'Blanc', hex: '#FFFFFF' }, { name: 'Noir', hex: '#000000' }],
        stock: 40,
        is_featured: true,
        rating: 4.9
      },
      {
        name: 'Chemise Légère Imprimée Wax & Lin',
        title: 'Chemise Légère Imprimée Wax & Lin',
        description: 'Habit estival tendance avec col cubain ouvert. Léger et agréable à porter au quotidien.',
        price: 2000,
        category: 'Homme',
        subcategory: 'Habits',
        image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80'],
        sizes: ['M', 'L', 'XL'],
        colors: [{ name: 'Orange & Bleu', hex: '#ea580c' }],
        stock: 15,
        is_featured: true,
        rating: 5.0
      },
      {
        name: 'Robe d’Été Fluide Fleurie',
        title: 'Robe d’Été Fluide Fleurie',
        description: 'Robe courte féminine à bretelles réglables et tissu vaporeux.',
        price: 2000,
        category: 'Femme',
        subcategory: 'Habits',
        image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80'],
        sizes: ['XS', 'S', 'M', 'L'],
        colors: [{ name: 'Vert Forêt', hex: '#064e3b' }, { name: 'Bordeaux', hex: '#881337' }],
        stock: 22,
        is_featured: true,
        rating: 4.8
      }
    ];

    for (const a of defaultArticles) {
      await client.query(
        `INSERT INTO products 
          (name, title, description, price, category, subcategory, image_url, images, sizes, colors, stock, is_featured, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          a.name,
          a.title,
          a.description,
          a.price,
          a.category,
          a.subcategory,
          a.image_url,
          JSON.stringify(a.images),
          JSON.stringify(a.sizes),
          JSON.stringify(a.colors),
          a.stock,
          a.is_featured,
          a.rating
        ]
      );
    }
    console.log('[Neon PostgreSQL] Catalogue initialisé : tous les articles sont à 2 000 FCFA.');
  }
};

// Fonction pour tester la connexion et initialiser le schéma au démarrage
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('[Neon PostgreSQL] Connecté avec succès à la base de données !');
    await initializeTables(client);
    console.log('[Neon PostgreSQL] Tables vérifiées et catalogue prêt (Tout à 2 000 FCFA).');
    client.release();
  } catch (error) {
    console.error(`[Neon PostgreSQL] Erreur de connexion : ${error.message}`);
    process.exit(1);
  }
};

export default { pool, connectDB };