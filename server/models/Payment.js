/**
 * Module 6: Payment Model
 * Records financial transactions against invoices with method, amount,
 * date, and audit reference notes.
 */

const createDualModel = require('./modelAdapter');

const paymentSchema = {
  paymentNumber: { type: String, required: true, unique: true },
  invoiceId: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Credit Card', 'Cash', 'UPI / Online', 'Check'],
    default: 'Bank Transfer'
  },
  paymentDate: { type: String, required: true },
  note: { type: String, default: '' },
  referenceCode: { type: String, default: '' }
};

module.exports = createDualModel('payments', paymentSchema);
