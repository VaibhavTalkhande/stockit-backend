import Sale from '../models/Sale.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import { sendBillEmail, sendPaymentLink } from '../lib/billGenerator.js';
import stripe from 'stripe';
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
export const createSale = async (req,res)=>{
    try {
        const { storeName, customer, products, total } = req.body || {};
        if (!storeName || !customer || !products || !total) {
            return res.status(400).json({ message: 'Store name, customer, products, and total are required' });
        }
        let customerInfo = await Customer.findOne({ name: customer.name });
        if (!customerInfo) {
            customerInfo = await Customer.create({
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            });
        }
        const customerId = customerInfo._id;
        const processedProducts = [];
        for (const item of products) {
            const product = await Product.findById(item._id);
            if (!product) {
                return res.status(404).json({ message: `Product not found with ID: ${item._id}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
            }
            product.stock -= item.quantity;
            await product.save();
            processedProducts.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }
        const sale = await Sale.create({
            storeName,
            customer: customerId,
            products: processedProducts,
            totalAmount: total
        });
        const session = await stripeClient.checkout.sessions.create({
            mode: 'payment',
            line_items: products.map(p => ({
                price_data: {
                    currency: 'usd',
                    product_data: { name: p.name },
                    unit_amount: Math.round(p.price * 100),
                },
                quantity: p.quantity,
            })),
            success_url: `${process.env.FRONTEND_URL}/dashboard/orders/${sale._id}`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            metadata: { saleId: sale._id.toString() }
        });

        await sendPaymentLink(customer.email, session.url);
        return res.status(201).json(sale);
    } catch (error) {
        console.error('Error in createSale:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export const getSaleById= async (req,res)=>{
    console.log('Fetching sale with ID:', req.params.id);
    if (!req.params.id) {
        console.error('No sale ID provided');
        return res.status(400).json({message: 'Sale ID is required'});
    }
    try{

        const sales= await Sale.findById(req.params.id)
            .populate('customer', 'name email contact')
        if (!sales) return res.status(404).json({message: 'Sale not found'});
        return res.status(200).json(sales);
    } catch (error) {
        return res.status(500).json({message: 'Server error', error: error.message});
    }
}

export const getSales = async (req,res)=>{
    try{
        const sales= await Sale.find()
            .populate('customer', 'name email contact')
        if (sales.length === 0) return res.status(404).json({message: 'No sales found'});
        console.log(sales);
        return res.status(200).json(sales);
    } catch (error) {
        return res.status(500).json({message: 'Server error', error: error.message});
    }
}

export const deleteSale = async (req,res)=>{
    try{
        const sale= await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({message: 'Sale not found'});
        if(sale){
            await sale.deleteOne();
            res.json({message: 'Sale deleted successfully'});
        }else{
            res.status(404).json({message: 'Sale not found'});
        }
    }catch (error) {
        res.status(500).json({message: 'Server error', error: error.message});
    }
}

export const getDailySales = async (req, res) => {
    try {
      const result = await Sale.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

export const getTopSellingProducts = async (req, res) => {
    try {
      const result = await Sale.aggregate([
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product",
            totalSold: { $sum: "$products.quantity" }
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        { $unwind: "$productDetails" },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
      ]);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};