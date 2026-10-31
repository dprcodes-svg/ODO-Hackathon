/**
 * Module 3/5/6: Discount Model
 * Admin configurable discount engine:
 * - Fixed amount ($) or Percentage (%)
 * - Minimum purchase or quantity qualification
 * - Date availability and usage quota limits
 * - Product-level or Subscription-level application
 */

const createDualModel = require('./modelAdapter');

const discountSchema = {
  code: { type: String, required: true, uppercase: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  value: { type: Number, required: true }, // e.g. 15 for 15% or 50 for $50
  minQuantity: { type: Number, default: 0 },
  minPurchaseAmount: { type: Number, default: 0 },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  maxUses: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  appliesTo: { type: String, enum: ['subscription', 'product'], default: 'subscription' },
  specificProductId: { type: String, default: null },
  active: { type: Boolean, default: true }
};

module.exports = createDualModel('discounts', discountSchema);
