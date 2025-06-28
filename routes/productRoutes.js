import express from 'express';
import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  productByName,
  totalProducts
} from '../controllers/productController.js';

const router = express.Router();

// Search route - must be before other routes
router.get('/search', productByName);

// Product CRUD routes
router.get('/', getProducts);
router.post('/', createProduct);
router.get('/total-products',totalProducts);
// ID based routes
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
