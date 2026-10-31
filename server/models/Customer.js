/**
 * Module 4: Customer Model
 * Manages customer directory, enterprise accounts, addresses,
 * payment terms, and linked user authentication records.
 */

const createDualModel = require('./modelAdapter');

const customerSchema = {
  name: { type: String, required: true },
  companyName: { type: String, default: '' },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: 'USA' }
  },
  paymentTerms: {
    type: String,
    enum: ['Immediate', 'Net 15', 'Net 30', 'Net 60'],
    default: 'Net 30'
  },
  creditLimit: { type: Number, default: 10000 },
  notes: { type: String, default: '' },
  userId: { type: String, default: null } // Optional linked user for portal login
};

module.exports = createDualModel('customers', customerSchema);
