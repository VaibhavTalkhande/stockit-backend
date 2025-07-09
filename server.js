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
app.use((req, res, next) => {
    if (req.originalUrl === '/webhook') {
      next(); // skip JSON body parser for webhook
    } else {
      express.json()(req, res, next);
    }
  });
// //app.use(express.json());
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
})

app.use((err,req,res,next)=>{
    console.error(err.stack);
    res.status(500).json({message:'something went wrong!'});
})
app.listen(PORT,()=>{
    console.log(`listening at ${PORT}`);
}
)