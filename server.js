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
import stripe from "stripe";
import { sendBillEmail } from "./lib/mailhandler.js";
dotenv.config();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
import Sale from "./models/Sale.js";
import Customer from "./models/Customer.js";
import aiRoutes from "./routes/aiRoutes.js";
const app = express();
const PORT=process.env.PORT || 5000;
const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
if (!endpointSecret) {
    throw new Error('STRIPE_ENDPOINT_SECRET is not defined in environment variables');
}
connectDB();
app.use(cors({
    origin: ["http://localhost:3000", `${process.env.FRONTEND_URL}`],
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
      console.error('Stripe signature verification failed:', err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const saleId = session.metadata?.saleId;
        if (!saleId) {
          console.error('Missing saleId in metadata');
          return response.status(400).send('Missing saleId');
        }
        const sale = await Sale.findById(saleId).populate("store");
        if (!sale) {
          console.error('Sale not found with ID:', saleId);
          return response.status(404).send('Sale not found');
        }
        const customer = await Customer.findOne({ _id: sale.customer, store: sale.store });
        if (!customer) {
          console.error('Customer not found or does not belong to the store:', sale.customer);
          return response.status(404).send('Customer not found');
        }

        sale.paymentStatus = 'paid';
        await sale.save();
        const items = sale.products.map(p => ({
          name: p.name,
          quantity: p.quantity,
          price: p.price
        }));
        await sendBillEmail(customer.email, {
          date: new Date().toLocaleDateString(),
          customerName: customer.name,
          items,
          totalAmount: sale.totalAmount,
          storeName:sale.store.name
        });
        console.log('Bill sent successfully to:', customer.email);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    response.status(200).send('Webhook received');
});

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use("/api/users",userRoutes);
app.use("/api/products",authMiddleware,productRoutes);
app.use("/api/customers",authMiddleware,customerRoutes);
app.use("/api/sales",authMiddleware, salesRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);

app.get('/',(req,res)=>{
    res.send(`
        <h1>Welcome to the Stockit-Backend</h1>
        `)
});

app.use((err,req,res,next)=>{
    console.error(err.stack);
    res.status(500).json({message:'something went wrong!'});
});
app.listen(PORT,()=>{
    console.log(`listening at ${PORT}`);
});