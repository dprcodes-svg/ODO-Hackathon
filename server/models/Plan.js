/**
 * Module 3: Plan Model
 * Controls billing intervals (daily, weekly, monthly, yearly)
 * and lifecycle rules (auto-close, early close, pause, renewal).
 */

const createDualModel = require('./modelAdapter');

const planSchema = {
  name: { type: String, required: true },
  code: { type: String, default: '' },
  billingInterval: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  price: { type: Number, required: true },
  minQuantity: { type: Number, default: 1 },
  availableFrom: { type: String, default: '' },
  availableTo: { type: String, default: '' },
  autoCloseOnEnd: { type: Boolean, default: false },
  allowEarlyClose: { type: Boolean, default: true },
  allowPause: { type: Boolean, default: true },
  allowRenew: { type: Boolean, default: true },
  description: { type: String, default: '' },
  active: { type: Boolean, default: true }
};

module.exports = createDualModel('plans', planSchema);
