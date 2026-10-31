/**
 * Module 1: User & Authentication Model
 * Supports Role-Based Access Control (RBAC):
 * - admin: full system access, manage staff, configuration
 * - staff: day-to-day sales, quotes, subscriptions, billing
 * - customer: restricted portal view to own account
 */

const createDualModel = require('./modelAdapter');

const userSchema = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'customer'], default: 'customer' },
  customerId: { type: String, default: null }, // Linked customer record for customer portal
  phone: { type: String, default: '' },
  active: { type: Boolean, default: true }
};

module.exports = createDualModel('users', userSchema);
