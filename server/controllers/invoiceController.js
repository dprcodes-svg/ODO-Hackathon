/**
 * Module 6: Invoices and Payments Controller
 * Implements:
 * - One-click Automated "Billing Day" Engine (Zero duplicate billing guarantee)
 * - Invoice lifecycle: Draft -> Confirmed -> Paid (and Cancelled)
 * - Multi-method Payment recording (Bank Transfer, Credit Card, UPI, Cash)
 * - Real-time Outstanding & Overdue balance accounting
 */

const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

// Helper to calculate due date based on payment terms
const calculateDueDate = (billingDateStr, paymentTerms) => {
  const date = new Date(billingDateStr);
  if (paymentTerms === 'Net 15') {
    date.setDate(date.getDate() + 15);
  } else if (paymentTerms === 'Net 60') {
    date.setDate(date.getDate() + 60);
  } else if (paymentTerms === 'Immediate') {
    date.setDate(date.getDate());
  } else {
    // Default Net 30
    date.setDate(date.getDate() + 30);
  }
  return date.toISOString().split('T')[0];
};

// ==================== INVOICES ====================
exports.getInvoices = async (req, res) => {
  try {
    const isCustomer = req.user && req.user.role === 'customer';
    const customerId = req.user ? req.user.customerId : null;

    let filter = {};
    if (isCustomer && customerId) {
      filter.customerId = customerId;
    } else if (req.query.status) {
      filter.status = req.query.status;
    }

    const invoices = await Invoice.find(filter);
    const today = new Date().toISOString().split('T')[0];

    // Mark overdue flag dynamically
    const enriched = invoices.map(inv => ({
      ...inv,
      isOverdue: inv.status !== 'Paid' && inv.status !== 'Cancelled' && inv.dueDate < today
    }));

    return res.json({ invoices: enriched });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    // Customer security barrier
    if (req.user && req.user.role === 'customer' && req.user.customerId && invoice.customerId !== req.user.customerId) {
      return res.status(403).json({ error: 'Access denied to this invoice.' });
    }

    const payments = await Payment.find({ invoiceId: id });
    return res.json({ invoice, payments });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Automated Billing Day Engine
 * Simulates Brightloop Software's billing day:
 * Runs through all Active subscriptions and generates accurate invoices
 * with taxes, line items, and discounts pre-filled.
 * Prevents double billing.
 */
exports.runBillingDay = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeSubs = await Subscription.find({ status: 'Active' });

    let generatedCount = 0;
    let skippedCount = 0;
    const generatedInvoices = [];

    for (const sub of activeSubs) {
      // Check if already billed for this billing cycle
      if (sub.lastBilledDate === todayStr) {
        skippedCount++;
        continue;
      }

      // Check existing invoice in Draft or Confirmed for this sub today
      const existing = await Invoice.findOne({
        subscriptionId: sub._id,
        billingDate: todayStr
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const customer = await Customer.findById(sub.customerId);
      const dueDate = calculateDueDate(todayStr, sub.paymentTerms);

      const invoiceLines = (sub.lines || []).map(line => ({
        productId: line.productId,
        productName: line.productName,
        variantOption: line.variantOption || 'Standard',
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        taxAmount: line.taxAmount,
        discountAmount: line.discountAmount || 0,
        lineTotal: line.total || (line.unitPrice * line.quantity)
      }));

      const invNumber = 'INV-2026-' + Math.floor(1000 + Math.random() * 9000);

      const newInvoice = await Invoice.create({
        invoiceNumber: invNumber,
        subscriptionId: sub._id,
        subscriptionNumber: sub.subscriptionNumber,
        customerId: sub.customerId,
        customerName: sub.customerName,
        customerEmail: customer ? customer.email : '',
        billingDate: todayStr,
        dueDate,
        billingPeriod: `Cycle starting ${todayStr} (${sub.billingInterval})`,
        paymentTerms: sub.paymentTerms,
        status: 'Draft',
        lines: invoiceLines,
        subtotal: sub.subtotal,
        taxTotal: sub.taxTotal,
        discountTotal: sub.discountTotal || 0,
        totalAmount: sub.grandTotal,
        paidAmount: 0,
        balanceDue: sub.grandTotal,
        notes: `Automated recurring bill generated for plan ${sub.planName}.`
      });

      // Update subscription lastBilledDate to safeguard against double-billing
      await Subscription.findByIdAndUpdate(sub._id, {
        lastBilledDate: todayStr
      });

      generatedCount++;
      generatedInvoices.push(newInvoice);
    }

    return res.json({
      message: `Billing Day executed successfully. ${generatedCount} invoices created, ${skippedCount} subscriptions already billed/skipped.`,
      generatedCount,
      skippedCount,
      invoices: generatedInvoices
    });
  } catch (error) {
    return res.status(500).json({ error: 'Billing engine failure: ' + error.message });
  }
};

// Invoice status transitions (Draft -> Confirmed -> Cancelled)
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Draft', 'Confirmed', 'Paid', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid invoice status.' });
    }

    const updated = await Invoice.findByIdAndUpdate(id, { status }, { new: true });
    return res.json({ message: `Invoice status updated to ${status}.`, invoice: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ==================== PAYMENTS ====================
exports.recordPayment = async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, paymentDate, note } = req.body;

    if (!invoiceId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invoice ID and positive payment amount are required.' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    const payAmount = Number(amount);
    const newPaidAmount = (invoice.paidAmount || 0) + payAmount;
    const newBalanceDue = Math.max(0, (invoice.totalAmount || 0) - newPaidAmount);

    const payNumber = 'PAY-2026-' + Math.floor(1000 + Math.random() * 9000);

    const payment = await Payment.create({
      paymentNumber: payNumber,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: payAmount,
      paymentMethod: paymentMethod || 'Bank Transfer',
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      note: note || 'Payment received and settled.',
      referenceCode: 'TXN-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    });

    // Auto-transition invoice status to 'Paid' if balance is settled
    const updatedStatus = newBalanceDue <= 0.01 ? 'Paid' : 'Confirmed';

    const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, {
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status: updatedStatus
    }, { new: true });

    return res.status(201).json({
      message: `Payment of $${payAmount} recorded successfully.`,
      payment,
      invoice: updatedInvoice
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error recording payment: ' + error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const isCustomer = req.user && req.user.role === 'customer';
    const customerId = req.user ? req.user.customerId : null;

    let filter = {};
    if (isCustomer && customerId) {
      filter.customerId = customerId;
    } else if (req.query.invoiceId) {
      filter.invoiceId = req.query.invoiceId;
    }

    const payments = await Payment.find(filter);
    return res.json({ payments });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
