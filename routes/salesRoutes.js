import express from 'express';
import { getSales,createSale,deleteSale,getTopSellingProducts,getDailySales, getSaleById} from '../controllers/salesController.js';

const router = express.Router();

// Add logging middlewar
router.get("/test", (req, res) => {
  res.send("Sales route is working");
});
router.post('/',createSale) // matches POST /api/sales

router.get('/getsales',getSales);
router.get('/top-selling-products',getTopSellingProducts);
router.get('/daily-sales',getDailySales);
router.delete('/deleteSale',deleteSale);
//router.get('/:id', getSaleById);
export default router;