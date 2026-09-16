import {
  getAllProducts,
  getProductById as findProductById,
  getFeaturedProducts,
  createProduct as insertProduct,
  updateProduct as editProduct,
  deleteProduct as removeProduct
} from '../models/Product.js';

// @desc    Récupérer les produits avec filtrage, tri et recherche
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const result = await getAllProducts(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Récupérer les produits en vedette (Featured)
// @route   GET /api/products/featured
// @access  Public
export const getFeatured = async (req, res, next) => {
  try {
    const products = await getFeaturedProducts(req.query.limit ? Number(req.query.limit) : 8);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Récupérer un produit par son ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await findProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Vêtement non trouvé' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un vêtement (Produit)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const product = await insertProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Modifier un vêtement (Produit)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const product = await editProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ message: 'Vêtement non trouvé' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un vêtement (Produit)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await removeProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Vêtement non trouvé' });
    }
    res.json({ message: 'Produit retiré du catalogue avec succès' });
  } catch (error) {
    next(error);
  }
};

// Compatibilité d'exportation
export { getFeatured as getFeaturedProducts };
export default {
  getProducts,
  getProductById,
  getFeaturedProducts: getFeatured,
  createProduct,
  updateProduct,
  deleteProduct
};