import express from 'express';
import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  productByName
} from '../controllers/productController.js';

const router = express.Router();

// Search route - must be before other routes
router.get('/search', productByName);

// Product CRUD routes
router.get('/', getProducts);
router.post('/', createProduct);

// ID based routes
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
