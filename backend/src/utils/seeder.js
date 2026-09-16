import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool, connectDB } from '../config/db.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Nettoyage des tables existantes...');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM users');

    console.log('[Seeder] Création des utilisateurs de test...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Password123!', salt);
    const clientPassword = await bcrypt.hash('Password123!', salt);

    await pool.query(
      `INSERT INTO users (name, email, password, role, shipping_address)
       VALUES 
       ($1, $2, $3, 'admin', '{}'::jsonb),
       ($4, $5, $6, 'user', $7::jsonb)`,
      [
        'Administrateur',
        'admin@mode.com',
        adminPassword,
        'Jane Doe',
        'jane@client.com',
        clientPassword,
        JSON.stringify({
          street: 'Cocody Angré 8ème Tranche',
          city: 'Abidjan',
          postalCode: '01 BP 1234',
          country: 'Côte d\'Ivoire'
        })
      ]
    );

    console.log('[Seeder] Création du catalogue : Tout à 2 000 FCFA (Habits, Chapeaux, Pantalons)...');
    const sampleProducts = [
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

    for (const p of sampleProducts) {
      await pool.query(
        `INSERT INTO products 
          (name, title, description, price, category, subcategory, image_url, images, sizes, colors, stock, is_featured, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          p.name,
          p.title,
          p.description,
          p.price,
          p.category,
          p.subcategory,
          p.image_url,
          JSON.stringify(p.images),
          JSON.stringify(p.sizes),
          JSON.stringify(p.colors),
          p.stock,
          p.is_featured,
          p.rating
        ]
      );
    }

    console.log('✅ Base de données Neon PostgreSQL peuplée : Tout est fixé à 2 000 FCFA !');
    console.log('Comptes disponibles :');
    console.log(' - Administrateur : admin@mode.com / Password123!');
    console.log(' - Client         : jane@client.com / Password123!');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Erreur lors du peuplement : ${error.message}`);
    process.exit(1);
  }
};

seed();
