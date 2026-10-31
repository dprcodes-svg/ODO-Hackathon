/**
 * Module 2: Dashboard Controller
 * Aggregates high-level metrics for business monitoring:
 * - Active Subscriptions
 * - MRR (Monthly Recurring Revenue) & ARR
 * - Revenue Collected vs Outstanding
 * - Overdue Invoices
 * - Tailored views for Admin, Staff, and Customer Portal
 */

const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

exports.getDashboardStats = async (req, res) => {
  try {
    const isCustomer = req.user && req.user.role === 'customer';
    const customerId = req.user ? req.user.customerId : null;

    // Filters for customer isolation
    const subFilter = isCustomer && customerId ? { customerId } : {};
    const invFilter = isCustomer && customerId ? { customerId } : {};

    const subscriptions = await Subscription.find(subFilter);
    const invoices = await Invoice.find(invFilter);
    const payments = await Payment.find(isCustomer && customerId ? { customerId } : {});

    // Metrics computation
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'Active').length;
    const pendingQuotes = subscriptions.filter(s => s.status === 'Quotation' || s.status === 'Draft').length;

    // Calculate MRR from active subscriptions
    let mrr = 0;
    for (const sub of subscriptions) {
      if (sub.status === 'Active') {
        const interval = sub.billingInterval || 'monthly';
        const total = sub.grandTotal || 0;
        if (interval === 'monthly') {
          mrr += total;
        } else if (interval === 'yearly') {
          mrr += total / 12;
        } else if (interval === 'weekly') {
          mrr += (total * 52) / 12;
        } else if (interval === 'daily') {
          mrr += total * 30;
        }
      }
    }
    const arr = mrr * 12;

    // Invoices metrics
    let totalRevenueCollected = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    for (const inv of invoices) {
      totalRevenueCollected += inv.paidAmount || 0;
      if (inv.status !== 'Paid' && inv.status !== 'Cancelled') {
        totalOutstanding += inv.balanceDue || 0;
        if (inv.dueDate && inv.dueDate < todayStr) {
          overdueCount++;
          overdueAmount += inv.balanceDue || 0;
        }
      }
    }

    const totalCustomers = isCustomer ? 1 : await Customer.countDocuments();

    return res.json({
      role: req.user ? req.user.role : 'admin',
      isCustomer,
      kpis: {
        totalSubscriptions,
        activeSubscriptions,
        pendingQuotes,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        totalRevenueCollected: Math.round(totalRevenueCollected * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        overdueCount,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        totalCustomers
      },
      recentSubscriptions: subscriptions.slice(-5).reverse(),
      recentInvoices: invoices.slice(-5).reverse(),
      recentPayments: payments.slice(-5).reverse()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve dashboard stats: ' + error.message });
  }
};
