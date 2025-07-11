import Sale from '../models/Sale.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import { sendBillEmail, sendPaymentLink } from '../lib/mailhandler.js';
import stripe from 'stripe';
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
export const createSale = async (req,res)=>{
    try {
        const { customer, products, total } = req.body || {};
        if (!customer || !products || !total) {
            return res.status(400).json({ message: 'customer, products, and total are required' });
        }
        let customerInfo = await Customer.findOne({ name: customer.name, store: req.user.store });
        console.log('Customer found:', customerInfo);
        if (!customerInfo) {
            customerInfo = await Customer.create({
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                store: req.user.store
            });
            console.log('Customer created:', customerInfo);
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
            store: req.user.store,
            customer: customerId,
            products: processedProducts,
            totalAmount: total
        });
        console.log('Sale created:', sale);
        // Add sale to customer's purchases
        customerInfo.purchases.push({ saleId: sale._id, date: sale.date });
        console.log('Purchases after push:', customerInfo.purchases);
        await customerInfo.save();
        console.log('Customer after save:', await Customer.findById(customerInfo._id));
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
            //only needed if using dashboard
            // success_url: `${process.env.FRONTEND_URL}/`,
            // cancel_url: `${process.env.FRONTEND_URL}/cancel`,
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

        const sales= await Sale.findOne({ _id: req.params.id, store: req.user.store })
            .populate('customer', 'name email phone').populate('store','name')
        if (!sales) return res.status(404).json({message: 'Sale not found'});
        return res.status(200).json(sales);
    } catch (error) {
        return res.status(500).json({message: 'Server error', error: error.message});
    }
}

export const getSales = async (req,res)=>{
    try{
        const sales= await Sale.find({ store: req.user.store })
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
        const sale= await Sale.findById({ _id: req.params.id, store: req.user.store });
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
        { $match: { store: req.user.store } },
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