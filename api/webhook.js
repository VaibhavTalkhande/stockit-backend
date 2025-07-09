export const config = {
  api: {
    bodyParser: false, // Disable Vercel's default body parsing
  },
};

import { buffer } from 'micro';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Customer from '../models/Customer.js';
import { sendBillEmail } from '../lib/billGenerator.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log("webhook")
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
  if (!endpointSecret) {
    return res.status(500).send('STRIPE_WEBHOOK_ENDPOINT_SECRET is not defined');
  }

  let event;
  const sig = req.headers['stripe-signature'];
  let buf;
  try {
    buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const saleId = session.metadata?.saleId;
      if (!saleId) {
        console.error('❌ Missing saleId in metadata');
        return res.status(400).send('Missing saleId');
      }
      // Ensure DB connection (for serverless)
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
      }
      const sale = await Sale.findByIdAndUpdate(saleId, { paymentStatus: 'paid' }, { new: true });
      if (!sale) {
        console.error('❌ Sale not found with ID:', saleId);
        return res.status(404).send('Sale not found');
      }
      const customer = await Customer.findById(sale.customer);
      if (!customer) {
        console.error('❌ Customer not found:', sale.customer);
        return res.status(404).send('Customer not found');
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
  res.status(200).send('Webhook received');
} 