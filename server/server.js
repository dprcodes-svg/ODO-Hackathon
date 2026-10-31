/**
 * Brightloop Subscription Management System - MERN Monolith Server
 * 
 * Hackathon 7-Module Architecture:
 * 1. Authentication (RBAC, JWT, Password Complexity, Reset)
 * 2. Dashboard (MRR/ARR, Active Subs, Invoices, Role Metrics)
 * 3. Products and Plans (Types, Odoo Brand Variants, Intervals, Discounts)
 * 4. Customers (Directory, Profiles, Ledger)
 * 5. Subscriptions (Quotation Templates, Line Items, State Machine)
 * 6. Invoices and Payments (Automated Billing Day, Payment Recording, Overdue alerts)
 * 7. Reports (Finance Lead summary, Aging, Collections vs Receivables)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB, isInMemory } = require('./config/db');
const { seedDatabase } = require('./seed/seedData');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const clientPublicPath = path.join(__dirname, '../client/public');
app.use(express.static(clientPublicPath));

// API Route Registration (Modules 1 - 7)
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/catalog', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);

// System health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Brightloop Subscription Management System',
    mode: isInMemory() ? 'In-Memory Mode' : 'MongoDB Production Mode',
    timestamp: new Date().toISOString()
  });
});

// Single Page Application Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPublicPath, 'index.html'));
});

// Start Server
async function startServer() {
  await connectDB();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Brightloop Subscription Management System (MERN)`);
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`Mode: ${isInMemory() ? 'Dual-Mode In-Memory' : 'Mongoose MongoDB'}`);
    console.log(`Frontend UI: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
