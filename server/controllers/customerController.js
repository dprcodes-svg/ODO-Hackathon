/**
 * Module 4: Customers Controller
 * Manages customer profiles, billing addresses, credit limits,
 * payment terms, and related subscription histories.
 */

const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');

exports.getCustomers = async (req, res) => {
  try {
    const isCustomer = req.user && req.user.role === 'customer';
    const customerId = req.user ? req.user.customerId : null;

    if (isCustomer && customerId) {
      const single = await Customer.findById(customerId);
      return res.json({ customers: single ? [single] : [] });
    }

    const { search } = req.query;
    let customers = await Customer.find();

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return res.json({ customers });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const subscriptions = await Subscription.find({ customerId: id });
    const invoices = await Invoice.find({ customerId: id });

    return res.json({
      customer,
      subscriptions,
      invoices
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, companyName, email, phone, address, paymentTerms, creditLimit, notes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Customer name and email are required.' });
    }

    const customer = await Customer.create({
      name,
      companyName: companyName || name,
      email: email.toLowerCase(),
      phone: phone || '',
      address: address || { street: '', city: '', state: '', zip: '', country: 'USA' },
      paymentTerms: paymentTerms || 'Net 30',
      creditLimit: Number(creditLimit || 10000),
      notes: notes || ''
    });

    return res.status(201).json({ message: 'Customer created successfully.', customer });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Customer.findByIdAndUpdate(id, req.body, { new: true });
    return res.json({ message: 'Customer updated.', customer: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
