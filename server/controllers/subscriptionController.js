/**
 * Module 5: Subscriptions Controller
 * Orchestrates:
 * - Quotation templates (valid for set number of days)
 * - Multi-line subscription quotes with variant pricing (e.g. Odoo brand +$560)
 * - Automatic discount application and tax computations
 * - Lifecycle state machine: Draft -> Quotation -> Confirmed -> Active -> Paused / Closed
 */

const Subscription = require('../models/Subscription');
const Customer = require('../models/Customer');
const Plan = require('../models/Plan');
const Product = require('../models/Product');
const Discount = require('../models/Discount');

// Quotation templates to accelerate sales rep offers
const QUOTATION_TEMPLATES = [
  {
    id: 'tpl_enterprise',
    name: 'Enterprise Cloud Suite (Yearly Contract)',
    planName: 'Yearly Enterprise',
    validDays: 15,
    defaultLines: [
      { productName: 'Brightloop ERP Core', variantOption: 'Odoo Brand Edition', variantPriceModifier: 560, quantity: 10, unitPrice: 760, taxRate: 10 },
      { productName: 'Advanced Analytics Module', variantOption: 'Standard', variantPriceModifier: 0, quantity: 5, unitPrice: 120, taxRate: 10 },
      { productName: '24/7 Dedicated Support SLA', variantOption: 'Standard', variantPriceModifier: 0, quantity: 1, unitPrice: 150, taxRate: 10 }
    ]
  },
  {
    id: 'tpl_smb',
    name: 'Small Business Growth Plan (Monthly)',
    planName: 'Monthly Professional',
    validDays: 30,
    defaultLines: [
      { productName: 'Brightloop ERP Core', variantOption: 'Standard', variantPriceModifier: 0, quantity: 2, unitPrice: 200, taxRate: 10 },
      { productName: 'E-Commerce Connector Add-on', variantOption: 'Standard', variantPriceModifier: 0, quantity: 1, unitPrice: 75, taxRate: 10 }
    ]
  }
];

exports.getTemplates = (req, res) => {
  return res.json({ templates: QUOTATION_TEMPLATES });
};

exports.getSubscriptions = async (req, res) => {
  try {
    const isCustomer = req.user && req.user.role === 'customer';
    let filter = {};

    if (isCustomer) {
      let cust = null;
      if (req.user.customerId) {
        cust = await Customer.findById(req.user.customerId);
      }
      if (!cust && req.user.email) {
        cust = await Customer.findOne({ email: req.user.email.toLowerCase() });
      }
      if (cust) {
        filter.customerId = cust._id;
      } else if (req.user.customerId) {
        filter.customerId = req.user.customerId;
      }
    } else if (req.query.status) {
      filter.status = req.query.status;
    }

    const subscriptions = await Subscription.find(filter);
    return res.json({ subscriptions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    // Customer security check
    if (req.user && req.user.role === 'customer' && req.user.customerId && subscription.customerId !== req.user.customerId) {
      return res.status(403).json({ error: 'Access denied to this subscription.' });
    }

    return res.json({ subscription });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const {
      customerId,
      planId,
      lines,
      startDate,
      expiryDate,
      paymentTerms,
      quotationExpiryDays,
      discountCode,
      notes,
      isQuoteOnly,
      status
    } = req.body;

    if (!planId || !lines || lines.length === 0) {
      return res.status(400).json({ error: 'Plan and at least one Product line are required.' });
    }

    let targetCustomerId = customerId;
    if (req.user && req.user.role === 'customer') {
      targetCustomerId = customerId || req.user.customerId;
    }

    let customer = null;
    if (targetCustomerId) {
      customer = await Customer.findById(targetCustomerId);
    }
    if (!customer && req.user && req.user.email) {
      customer = await Customer.findOne({ email: req.user.email.toLowerCase() });
    }
    if (!customer) {
      const allCustomers = await Customer.find();
      if (allCustomers.length > 0) customer = allCustomers[0];
    }

    if (!customer) return res.status(404).json({ error: 'Customer account not found.' });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    // Validate minimum quantity if set on plan
    const totalQty = lines.reduce((acc, l) => acc + Number(l.quantity || 1), 0);
    if (plan.minQuantity && totalQty < plan.minQuantity) {
      return res.status(400).json({
        error: `Plan '${plan.name}' requires a minimum quantity of ${plan.minQuantity}. (Provided: ${totalQty})`
      });
    }

    // Process line items, variant modifiers, taxes
    let subtotal = 0;
    let taxTotal = 0;
    const processedLines = [];

    for (const line of lines) {
      const qty = Number(line.quantity || 1);
      const modifier = Number(line.variantPriceModifier || 0);
      const basePrice = Number(line.unitPrice || 0);
      const effectiveUnitPrice = basePrice + modifier;
      const lineSubtotal = effectiveUnitPrice * qty;
      const taxRate = Number(line.taxRate !== undefined ? line.taxRate : 10);
      const taxAmount = (lineSubtotal * taxRate) / 100;
      const total = lineSubtotal + taxAmount;

      subtotal += lineSubtotal;
      taxTotal += taxAmount;

      processedLines.push({
        productId: line.productId || 'prod_gen',
        productName: line.productName,
        variantOption: line.variantOption || 'Standard',
        variantPriceModifier: modifier,
        quantity: qty,
        unitPrice: effectiveUnitPrice,
        taxRate,
        taxAmount,
        discountAmount: 0,
        subtotal: lineSubtotal,
        total
      });
    }

    // Discount Engine: check discount code if provided
    let discountTotal = 0;
    let appliedDiscountCode = '';

    if (discountCode) {
      const discount = await Discount.findOne({ code: discountCode.toUpperCase().trim(), active: true });
      if (discount) {
        // Check minimum rules
        const meetsMinQty = !discount.minQuantity || totalQty >= discount.minQuantity;
        const meetsMinSpend = !discount.minPurchaseAmount || subtotal >= discount.minPurchaseAmount;

        if (meetsMinQty && meetsMinSpend) {
          appliedDiscountCode = discount.code;
          if (discount.type === 'percentage') {
            discountTotal = (subtotal * discount.value) / 100;
          } else {
            discountTotal = Math.min(discount.value, subtotal);
          }
          // Increment used count
          await Discount.findByIdAndUpdate(discount._id, { usedCount: (discount.usedCount || 0) + 1 });
        }
      }
    }

    const grandTotal = Math.max(0, subtotal + taxTotal - discountTotal);

    // Calculate dates
    const start = startDate || new Date().toISOString().split('T')[0];
    const today = new Date();
    const validUntilDays = quotationExpiryDays || 15;
    const quoteValidUntil = new Date(today.getTime() + validUntilDays * 86400000).toISOString().split('T')[0];

    // Compute next billing date based on plan interval
    const nextBillDate = new Date(start);
    if (plan.billingInterval === 'yearly') {
      nextBillDate.setFullYear(nextBillDate.getFullYear() + 1);
    } else if (plan.billingInterval === 'weekly') {
      nextBillDate.setDate(nextBillDate.getDate() + 7);
    } else if (plan.billingInterval === 'daily') {
      nextBillDate.setDate(nextBillDate.getDate() + 1);
    } else {
      nextBillDate.setMonth(nextBillDate.getMonth() + 1);
    }

    const subNumber = 'SUB-2026-' + Math.floor(1000 + Math.random() * 9000);
    let initialStatus = 'Active';
    if (status) {
      initialStatus = status;
    } else if (isQuoteOnly) {
      initialStatus = 'Quotation';
    } else {
      initialStatus = req.user && req.user.role === 'customer' ? 'Active' : 'Confirmed';
    }

    const subscription = await Subscription.create({
      subscriptionNumber: subNumber,
      customerId: customer._id,
      customerName: customer.companyName || customer.name,
      planId: plan._id,
      planName: plan.name,
      billingInterval: plan.billingInterval,
      startDate: start,
      expiryDate: expiryDate || '',
      nextBillingDate: nextBillDate.toISOString().split('T')[0],
      paymentTerms: paymentTerms || customer.paymentTerms || 'Net 30',
      quotationExpiryDate: quoteValidUntil,
      status: initialStatus,
      lines: processedLines,
      subtotal,
      taxTotal,
      discountCode: appliedDiscountCode,
      discountTotal,
      grandTotal,
      notes: notes || ''
    });

    return res.status(201).json({
      message: `Subscription created in '${initialStatus}' state.`,
      subscription
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Lifecycle State Machine Transition
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validTransitions = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'];
    if (!validTransitions.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validTransitions.join(', ')}` });
    }

    const sub = await Subscription.findById(id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    const updated = await Subscription.findByIdAndUpdate(id, {
      status,
      notes: note ? (sub.notes ? sub.notes + ' | ' + note : note) : sub.notes
    }, { new: true });

    return res.json({
      message: `Subscription status updated to '${status}'.`,
      subscription: updated
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
