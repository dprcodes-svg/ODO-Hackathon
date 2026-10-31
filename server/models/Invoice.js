/**
 * Module 6: Invoice Model
 * Created automatically on Billing Day from Active Subscriptions.
 * Tracks invoice lifecycle: Draft -> Confirmed -> Paid (or Cancelled).
 * Prevents double-billing and calculates automatic taxes and discount deductions.
 */

const createDualModel = require('./modelAdapter');

const invoiceSchema = {
  invoiceNumber: { type: String, required: true, unique: true },
  subscriptionId: { type: String, required: true },
  subscriptionNumber: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  billingDate: { type: String, required: true },
  dueDate: { type: String, required: true },
  billingPeriod: { type: String, default: '' },
  paymentTerms: { type: String, default: 'Net 30' },
  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Paid', 'Cancelled'],
    default: 'Draft'
  },
  lines: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    variantOption: { type: String, default: 'Standard' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    taxRate: { type: Number, default: 10 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true }
  }],
  subtotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, required: true },
  notes: { type: String, default: '' }
};

module.exports = createDualModel('invoices', invoiceSchema);
