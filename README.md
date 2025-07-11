# Stockit Backend

Stockit Backend is a Node.js/Express/MongoDB REST API for managing inventory, sales, customers, users, and business analytics for retail stores. It supports authentication, billing, payment integration, AI-powered business suggestions, and more.

deployed on render
## Related Projects

- **Frontend Nextjs GitHub:** [https://github.com/VaibhavTalkhande/stockit](https://github.com/VaibhavTalkhande/stockit)
- **Frontend Deployed App Link:** [https://stockit-wine.vercel.app](https://stockit-wine.vercel.app)
- **ElectronJS Desktop App:** [https://github.com/VaibhavTalkhande/stockit-desktop](https://github.com/VaibhavTalkhande/stockit-desktop)

- **Backend GitHub:** [https://github.com/VaibhavTalkhande/stockit-backend](https://github.com/VaibhavTalkhande/stockit-backend)

---

## Features

- **User Authentication:** Register, login, logout, JWT-based session management.
- **Password Management:** Forgot/reset password with secure email token flow.
- **Store Management:** Each user is associated with a store.
- **Product Management:** CRUD operations for products, stock tracking.
- **Customer Management:** CRUD operations, purchase history, customer insights.
- **Sales Management:** Create sales, track products sold, payment status, Stripe integration.
- **Billing & Email:** Generate and email bills/receipts to customers.
- **Payment Integration:** Stripe Checkout for online payments, payment link resending.
- **AI Business Suggestions:** Uses Gemini API to analyze store data and provide actionable business advice.
- **Role-based Access:** Auth middleware protects sensitive routes.
- **Analytics:** Daily sales, top-selling products, and more.

---

## API Endpoints

### **User & Auth**
- `POST /api/users/register` — Register a new user/store
- `POST /api/users/login` — Login
- `POST /api/users/logout` — Logout
- `GET /api/users/profile` — Get user profile
- `POST /api/users/forgot-password` — Request password reset
- `POST /api/users/reset-password` — Reset password

### **Products**
- `POST /api/products/` — Add product
- `GET /api/products/` — List products
- `PUT /api/products/:id` — Update product
- `DELETE /api/products/:id` — Delete product

### **Customers**
- `POST /api/customers/` — Add customer
- `GET /api/customers/` — List customers
- `GET /api/customers/:id` — Get customer (with purchase history)
- `PUT /api/customers/:id` — Update customer
- `DELETE /api/customers/:id` — Delete customer

### **Sales**
- `POST /api/sales/` — Create sale (updates stock, customer purchases, triggers payment link)
- `GET /api/sales/getsales` — List sales
- `GET /api/sales/:id` — Get sale details
- `DELETE /api/sales/deleteSale` — Delete sale
- `POST /api/sales/resend-payment-link` — Resend payment link to customer

### **Analytics**
- `GET /api/sales/daily-sales` — Get daily sales summary
- `GET /api/sales/top-selling-products` — Get top-selling products

### **AI Suggestions**
- `POST /api/ai/suggestions` — Get AI-powered business suggestions (requires authentication)

---

## Task Model (Backend Flow)

1. **User Registration & Store Creation**
   - User registers, a store is created and linked to the user.

2. **Product & Customer Management**
   - Products and customers are managed per store.

3. **Sales Creation**
   - Sale is created, stock is updated, customer’s purchase history is updated.
   - Stripe payment link is generated and emailed to the customer.

4. **Payment & Billing**
   - Stripe webhook updates payment status.
   - Bill/receipt is generated and emailed to the customer.

5. **Password Reset**
   - User requests password reset, receives email with secure token.
   - User resets password using the token.

6. **AI Suggestions**
   - Aggregates sales, product, and customer data.
   - Sends data to Gemini AI for actionable business advice.

---

## Environment Variables

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT secret for authentication
- `NODEMAILER_USER` / `NODEMAILER_PASS` — Email credentials for Nodemailer
- `STRIPE_SECRET_KEY` — Stripe API key
- `FRONTEND_URL` — Frontend base URL for redirects and links
- `GEMINI_API_KEY` — Gemini API key for AI suggestions

---

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Set up your `.env` file** with the required environment variables.

3. **Run the server:**
   ```sh
   npm run dev
   ```

---

## Tech Stack

- Node.js, Express.js
- MongoDB, Mongoose
- Stripe API
- Nodemailer
- Gemini AI (Google GenAI)

---

## Contribution

Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

---

## License

MIT 