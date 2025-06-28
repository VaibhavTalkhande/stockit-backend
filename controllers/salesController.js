import Sale from '../models/Sale.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import { sendBillEmail, sendPaymentLink } from '../lib/billGenerator.js';
import stripe from 'stripe';
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
export const createSale = async (req,res)=>{
    try {
        console.log('Creating sale with data:', JSON.stringify(req.body, null, 2));
        
        // First validate the request body exists
        if (!req.body) {
            return res.status(400).json({message: 'Request body is required'});
        }

        // Then destructure the body
        const {storeName, customer, products, total} = req.body;
        
        // Validate all required fields
        if (!storeName || !customer || !products || !total) {
            return res.status(400).json({message: 'Store name, customer, products, and total are required'});
        }
        // console.log('Looking for existing customer:', customer.name);
        let customerId;
        
        try {
            // Check if customer exists by name
            const existingCustomer = await Customer.findOne({name: customer.name});
            console.log('Existing customer:', existingCustomer);

            if(existingCustomer) {
                customerId = existingCustomer._id;
                console.log('Using existing customer:', customerId);
            } else {
                console.log('Creating new customer');
                const newCustomer = new Customer({
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone
                });
                const savedCustomer = await newCustomer.save();
                customerId = savedCustomer._id;
                console.log('New customer created:', customerId);
            }
        } catch (customerError) {
            console.error('Error handling customer:', customerError);
            return res.status(500).json({message: 'Error processing customer', error: customerError.message});
        }

        console.log('Processing products:', JSON.stringify(products, null, 2));
        const processedProducts = [];
        
        try {
            for(const item of products){
                console.log('Processing product with ID:', item._id);
                const product = await Product.findById(item._id);
                console.log('Found product:', product ? 'Yes' : 'No');
                
                if(!product) {
                    console.log('Product not found:', item._id);
                    return res.status(404).json({message: `Product not found with ID: ${item._id}`});
                }
                
                if(product.stock < item.quantity) {
                    console.log('Insufficient stock for product:', product.name);
                    return res.status(400).json({message: `Insufficient stock for product: ${product.name}`});
                }

                console.log('Updating product stock');
                product.stock -= item.quantity;
                await product.save();
                console.log('Product stock updated');

                processedProducts.push({
                    productId: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    price: product.price
                });
            }
        } catch (productError) {
            console.error('Error processing products:', productError);
            return res.status(500).json({message: 'Error processing products', error: productError.message});
        }

        try {
            console.log('Creating sale with data:', {
                storeName,
                customerId,
                processedProducts,
                total
            });

            const sale = new Sale({
                storeName,
                customer: customerId,
                products: processedProducts,
                totalAmount: total
            });
            
            console.log('Saving sale');
            const savedSale = await sale.save();
            console.log('Sale saved successfully:', savedSale);
            const session = await stripeClient.checkout.sessions.create({
                mode: 'payment',
                line_items: products.map(p => ({
                  price_data: {
                    currency: 'usd',
                    product_data: {
                      name: p.name,
                    },
                    unit_amount: Math.round(p.price * 100),
                    
                  },
                  quantity: p.quantity,
                })),
                success_url: `http://localhost:3000/dashboard/orders/${savedSale._id}`,
                cancel_url: `http://localhost:3000/cancel`,
                metadata: {
                  saleId: savedSale._id.toString()
                }
              });
            // Optionally, you can send a bill email here
            // await sendBillEmail(customer.email, {
            //     date: new Date().toLocaleDateString(),
            //     storeName: storeName,
            //     customerName: customer.name,
            //     items: processedProducts.map(item => ({
            //         name: item.name, // Assuming productId has a name field
            //         quantity: item.quantity,
            //         price: item.price
            //     })),
            //     totalAmount: total
            // });
            await sendPaymentLink(customer.email, session.url);
            return res.status(201).json(savedSale);
        } catch (saleError) {
            console.error('Error creating sale:', saleError);
            return res.status(500).json({message: 'Error creating sale', error: saleError.message});
        }
    } catch (error) {
        console.error('Error in createSale:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({message: 'Server error', error: error.message});
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