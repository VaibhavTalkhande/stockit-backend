import express from 'express';
import { getSales,createSale,deleteSale,getTopSellingProducts,getDailySales} from '../controllers/salesController.js';

const router = express.Router();

// Add logging middlewar

router.route('/')
.post(createSale);
// router.get('/daily-sales', getDailySales);
// router.get('/top-products', getTopSellingProducts);

// router.get('/',getSales);

// router.route('/:id')
// .delete(deleteSale);
export default router;