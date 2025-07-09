import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import connectDB from "./lib/db.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import cookieParser from "cookie-parser";
import { createSale } from "./controllers/salesController.js";
import stripe from "stripe";
import { sendBillEmail } from "./lib/billGenerator.js";
dotenv.config();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
import Sale from "./models/Sale.js";
import Customer from "./models/Customer.js";
const app = express();
const PORT=process.env.PORT || 5000;
const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
if (!endpointSecret) {
    throw new Error('STRIPE_ENDPOINT_SECRET is not defined in environment variables');
}
connectDB();
app.use(cors({
    origin: ["http://localhost:3000", "https://stockit-wine.vercel.app"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));

// --- STRIPE WEBHOOK ROUTE (must be before express.json) ---
app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;
    try {
      event = stripeClient.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      console.error('❌ Stripe signature verification failed:', err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const saleId = session.metadata?.saleId;
        if (!saleId) {
          console.error('❌ Missing saleId in metadata');
          return response.status(400).send('Missing saleId');
        }
        const sale = await Sale.findByIdAndUpdate(saleId, { paymentStatus: 'paid' }, { new: true });
        if (!sale) {
          console.error('❌ Sale not found with ID:', saleId);
          return response.status(404).send('Sale not found');
        }
        const customer = await Customer.findById(sale.customer);
        if (!customer) {
          console.error('❌ Customer not found:', sale.customer);
          return response.status(404).send('Customer not found');
        }
        const items = sale.products.map(p => ({
          name: p.name,
          quantity: p.quantity,
          price: p.price
        }));
        await sendBillEmail(customer.email, {
          date: new Date().toLocaleDateString(),
          customerName: customer.name,
          items,
          totalAmount: sale.totalAmount
        });
        console.log('✅ Bill sent successfully to:', customer.email);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    response.status(200).send('Webhook received');
});

// --- ALL OTHER MIDDLEWARES AND ROUTES ---
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use("/api/users",userRoutes);
app.use("/api/products",productRoutes);
app.use("/api/customers",authMiddleware,customerRoutes);
app.use("/api/sales",authMiddleware, salesRoutes);

app.get('/',(req,res)=>{
    res.send(`
        <h1>Welcome to the home page</h1>
        <p>Click <a href="/about">here</a> to go to the about page</p>`)
});

app.use((err,req,res,next)=>{
    console.error(err.stack);
    res.status(500).json({message:'something went wrong!'});
});
app.listen(PORT,()=>{
    console.log(`listening at ${PORT}`);
});