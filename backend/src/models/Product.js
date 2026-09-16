import { pool } from '../config/db.js';

// Fonction de secours pour s'assurer que les colonnes products existent
const ensureProductColumns = async () => {
  try {
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS title VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '["S", "M", "L"]'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) DEFAULT 5.0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
  } catch (err) {
    console.error('[Migration products error]', err.message);
  }
};

// Normalisation pour assurer la compatibilité frontend (_id, name, images)
export const formatProduct = (p) => {
  if (!p) return null;
  const name = p.name || p.title || 'Vêtement';
  const title = p.title || p.name || 'Vêtement';
  let images = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    images = p.images;
  } else if (p.image_url) {
    images = [p.image_url];
  } else {
    images = ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80'];
  }

  const sizes = Array.isArray(p.sizes) ? p.sizes : ['S', 'M', 'L'];
  const colors = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : [{ name: 'Standard', hex: '#000000' }];

  return {
    ...p,
    _id: p.id,
    id: p.id,
    name,
    title,
    images,
    image_url: p.image_url || images[0],
    sizes,
    colors,
    price: Math.round(Number(p.price) || 2000)
  };
};

export const getAllProducts = async ({ keyword, category, size, minPrice, maxPrice, sort, page = 1, limit = 12 } = {}) => {
  await ensureProductColumns();
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (keyword) {
    conditions.push(`(name ILIKE $${paramIndex} OR title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    params.push(`%${keyword}%`);
    paramIndex++;
  }

  if (category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }

  if (minPrice) {
    conditions.push(`price >= $${paramIndex}`);
    params.push(Number(minPrice));
    paramIndex++;
  }

  if (maxPrice) {
    conditions.push(`price <= $${paramIndex}`);
    params.push(Number(maxPrice));
    paramIndex++;
  }

  let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'ORDER BY created_at DESC';
  if (sort === 'price-asc') orderBy = 'ORDER BY price ASC';
  if (sort === 'price-desc') orderBy = 'ORDER BY price DESC';

  const countResult = await pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (Number(page) - 1) * Number(limit);
  const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(Number(limit), offset);

  const result = await pool.query(`SELECT * FROM products ${whereClause} ${orderBy} ${limitClause}`, params);
  const products = result.rows.map(formatProduct);

  return {
    products,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    totalProducts: total
  };
};

export const getProductById = async (id) => {
  await ensureProductColumns();
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return formatProduct(result.rows[0]);
};

export const getFeaturedProducts = async (limit = 8) => {
  await ensureProductColumns();
  const result = await pool.query(
    'SELECT * FROM products WHERE is_featured = true ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  if (result.rows.length === 0) {
    const fallback = await pool.query('SELECT * FROM products ORDER BY created_at DESC LIMIT $1', [limit]);
    return fallback.rows.map(formatProduct);
  }
  return result.rows.map(formatProduct);
};

export const createProduct = async (data) => {
  await ensureProductColumns();
  const name = data.name || data.title;
  const title = data.title || data.name;
  const description = data.description || '';
  const price = Number(data.price) || 2000;
  const category = data.category || 'Homme';
  const subcategory = data.subcategory || '';
  const imageUrl = data.image_url || (Array.isArray(data.images) ? data.images[0] : '');
  const images = JSON.stringify(Array.isArray(data.images) ? data.images : (imageUrl ? [imageUrl] : []));
  const sizes = JSON.stringify(Array.isArray(data.sizes) ? data.sizes : ['S', 'M', 'L']);
  const colors = JSON.stringify(Array.isArray(data.colors) ? data.colors : [{ name: 'Standard', hex: '#000000' }]);
  const stock = Number(data.stock) || 0;
  const isFeatured = Boolean(data.isFeatured || data.is_featured);

  const result = await pool.query(
    `INSERT INTO products 
      (name, title, description, price, category, subcategory, image_url, images, sizes, colors, stock, is_featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [name, title, description, price, category, subcategory, imageUrl, images, sizes, colors, stock, isFeatured]
  );
  return formatProduct(result.rows[0]);
};

export const updateProduct = async (id, data) => {
  await ensureProductColumns();
  const existing = await getProductById(id);
  if (!existing) return null;

  const name = data.name || data.title || existing.name;
  const title = data.title || data.name || existing.title;
  const description = data.description !== undefined ? data.description : existing.description;
  const price = data.price !== undefined ? Number(data.price) : existing.price;
  const category = data.category || existing.category;
  const subcategory = data.subcategory !== undefined ? data.subcategory : existing.subcategory;
  const imageUrl = data.image_url || existing.image_url;
  const images = JSON.stringify(Array.isArray(data.images) ? data.images : existing.images);
  const sizes = JSON.stringify(Array.isArray(data.sizes) ? data.sizes : existing.sizes);
  const colors = JSON.stringify(Array.isArray(data.colors) ? data.colors : existing.colors);
  const stock = data.stock !== undefined ? Number(data.stock) : existing.stock;
  const isFeatured = data.isFeatured !== undefined ? Boolean(data.isFeatured) : existing.is_featured;

  const result = await pool.query(
    `UPDATE products 
     SET name = $1, title = $2, description = $3, price = $4, category = $5,
         subcategory = $6, image_url = $7, images = $8, sizes = $9, colors = $10,
         stock = $11, is_featured = $12
     WHERE id = $13
     RETURNING *`,
    [name, title, description, price, category, subcategory, imageUrl, images, sizes, colors, stock, isFeatured, id]
  );
  return formatProduct(result.rows[0]);
};

export const deleteProduct = async (id) => {
  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
  return result.rows.length > 0;
};

export const Product = {
  getAll: getAllProducts,
  getById: getProductById,
  getFeatured: getFeaturedProducts,
  create: createProduct,
  update: updateProduct,
  delete: deleteProduct
};

export default Product;
