/**
 * Module 5: Subscription Model
 * Orchestrates quotation lifecycles, product line items, variant modifiers,
 * discount rules, tax calculations, and status transitions:
 * Draft -> Quotation -> Confirmed -> Active -> Paused / Closed
 */

const createDualModel = require('./modelAdapter');

const subscriptionSchema = {
  subscriptionNumber: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  billingInterval: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: { type: String, required: true },
  expiryDate: { type: String, default: '' },
  nextBillingDate: { type: String, default: '' },
  lastBilledDate: { type: String, default: null },
  paymentTerms: { type: String, default: 'Net 30' },
  quotationExpiryDate: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'],
    default: 'Draft'
  },
  lines: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    variantOption: { type: String, default: 'Standard' },
    variantPriceModifier: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    taxRate: { type: Number, default: 10 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  discountCode: { type: String, default: '' },
  discountTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  notes: { type: String, default: '' }
};

module.exports = createDualModel('subscriptions', subscriptionSchema);
