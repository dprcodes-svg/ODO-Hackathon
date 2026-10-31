/**
 * Brightloop Software Demo Seed Script
 * Pre-populates all 7 modules with realistic data reflecting the hackathon challenge.
 */

const User = require('../models/User');
const Product = require('../models/Product');
const Plan = require('../models/Plan');
const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Discount = require('../models/Discount');

async function seedDatabase() {
  console.log('[Seed] Seeding Brightloop Software demo data...');

  // 1. Clean existing records if any
  await User.deleteMany();
  await Product.deleteMany();
  await Plan.deleteMany();
  await Customer.deleteMany();
  await Subscription.deleteMany();
  await Invoice.deleteMany();
  await Payment.deleteMany();
  await Discount.deleteMany();

  // 2. Customers
  const customerAcme = await Customer.create({
    name: 'Charlie Smith',
    companyName: 'Acme Enterprises Inc.',
    email: 'acme@business.com',
    phone: '+1 (555) 234-5678',
    address: { street: '100 Innovation Way', city: 'San Francisco', state: 'CA', zip: '94105', country: 'USA' },
    paymentTerms: 'Net 30',
    creditLimit: 50000,
    notes: 'Large enterprise client on yearly recurring plan.'
  });

  const customerCorner = await Customer.create({
    name: 'David Miller',
    companyName: 'Corner Store Retailers',
    email: 'corner@store.com',
    phone: '+1 (555) 345-6789',
    address: { street: '42 Market Street', city: 'Austin', state: 'TX', zip: '78701', country: 'USA' },
    paymentTerms: 'Net 15',
    creditLimit: 10000,
    notes: 'Small business on monthly billing cycle.'
  });

  const customerApex = await Customer.create({
    name: 'Elena Rostova',
    companyName: 'Apex Digital Agency',
    email: 'apex@digital.io',
    phone: '+1 (555) 890-1234',
    address: { street: '77 Silicon Blvd', city: 'Seattle', state: 'WA', zip: '98101', country: 'USA' },
    paymentTerms: 'Immediate',
    creditLimit: 25000,
    notes: 'Fast growing media company with multiple add-ons.'
  });

  // 3. Users (RBAC)
  await User.create({
    name: 'Alice Vance',
    email: 'admin@brightloop.com',
    password: 'Admin@1234',
    role: 'admin',
    customerId: null
  });

  await User.create({
    name: 'Bob Harper',
    email: 'staff@brightloop.com',
    password: 'Staff@1234',
    role: 'staff',
    customerId: null
  });

  await User.create({
    name: 'Charlie Smith',
    email: 'acme@business.com',
    password: 'Customer@1234',
    role: 'customer',
    customerId: customerAcme._id
  });

  await User.create({
    name: 'David Miller',
    email: 'corner@store.com',
    password: 'Customer@1234',
    role: 'customer',
    customerId: customerCorner._id
  });

  // 4. Products with Brand Variants (e.g. Odoo brand +$560)
  const prodERP = await Product.create({
    name: 'Brightloop ERP Core',
    code: 'PRD-ERP-01',
    type: 'Software',
    salesPrice: 200,
    costPrice: 50,
    taxRate: 10,
    notes: 'Flagship business operating system with billing and inventory.',
    variants: [
      { groupName: 'Brand', optionName: 'Standard Edition', priceModifier: 0 },
      { groupName: 'Brand', optionName: 'Odoo Brand Edition', priceModifier: 560 },
      { groupName: 'Brand', optionName: 'Enterprise Edition', priceModifier: 200 }
    ]
  });

  const prodEcom = await Product.create({
    name: 'E-Commerce Connector Add-on',
    code: 'PRD-ECO-02',
    type: 'Add-on',
    salesPrice: 75,
    costPrice: 15,
    taxRate: 10,
    notes: 'Connects online storefronts with real-time stock sync.',
    variants: [
      { groupName: 'Tier', optionName: 'Standard', priceModifier: 0 },
      { groupName: 'Tier', optionName: 'Multi-Storefront', priceModifier: 40 }
    ]
  });

  const prodAnalytics = await Product.create({
    name: 'Advanced Analytics Module',
    code: 'PRD-BI-03',
    type: 'Software',
    salesPrice: 120,
    costPrice: 30,
    taxRate: 10,
    notes: 'Executive financial reporting and churn predictive modeling.',
    variants: [{ groupName: 'Edition', optionName: 'Standard', priceModifier: 0 }]
  });

  const prodSupport = await Product.create({
    name: '24/7 Dedicated Support SLA',
    code: 'PRD-SLA-04',
    type: 'Service',
    salesPrice: 150,
    costPrice: 60,
    taxRate: 10,
    notes: 'Priority queue with guaranteed 15-minute response SLA.',
    variants: [{ groupName: 'Tier', optionName: 'Standard', priceModifier: 0 }]
  });

  // 5. Plans (intervals: daily, weekly, monthly, yearly)
  const planMonthly = await Plan.create({
    name: 'Monthly Professional',
    code: 'PLN-MON-PRO',
    billingInterval: 'monthly',
    price: 199,
    minQuantity: 1,
    availableFrom: '2026-01-01',
    availableTo: '2027-12-31',
    autoCloseOnEnd: false,
    allowEarlyClose: true,
    allowPause: true,
    allowRenew: true,
    description: 'Flexible monthly billing for growing teams.'
  });

  const planYearly = await Plan.create({
    name: 'Yearly Enterprise',
    code: 'PLN-YR-ENT',
    billingInterval: 'yearly',
    price: 1990,
    minQuantity: 3,
    availableFrom: '2026-01-01',
    availableTo: '2028-12-31',
    autoCloseOnEnd: false,
    allowEarlyClose: true,
    allowPause: true,
    allowRenew: true,
    description: 'Comprehensive annual contract with multi-seat volume discount.'
  });

  const planWeekly = await Plan.create({
    name: 'Weekly Pilot',
    code: 'PLN-WK-PILOT',
    billingInterval: 'weekly',
    price: 50,
    minQuantity: 1,
    availableFrom: '2026-01-01',
    availableTo: '2026-12-31',
    autoCloseOnEnd: true,
    allowEarlyClose: true,
    allowPause: false,
    allowRenew: true,
    description: 'Short-term evaluation pilot that closes on its own.'
  });

  const planDaily = await Plan.create({
    name: 'Daily Compute Pass',
    code: 'PLN-DAY-COMP',
    billingInterval: 'daily',
    price: 15,
    minQuantity: 1,
    availableFrom: '2026-01-01',
    availableTo: '2026-12-31',
    autoCloseOnEnd: true,
    allowEarlyClose: false,
    allowPause: false,
    allowRenew: false,
    description: 'Single day on-demand surge compute capacity.'
  });

  // 6. Discounts
  await Discount.create({
    code: 'SUMMER20',
    name: 'Summer SaaS Promo',
    type: 'percentage',
    value: 20,
    minPurchaseAmount: 300,
    minQuantity: 1,
    startDate: '2026-06-01',
    endDate: '2026-12-31',
    maxUses: 50,
    usedCount: 8,
    appliesTo: 'subscription'
  });

  await Discount.create({
    code: 'SEATS50',
    name: 'Bulk Seats Discount',
    type: 'fixed',
    value: 50,
    minPurchaseAmount: 0,
    minQuantity: 5,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    maxUses: 100,
    usedCount: 14,
    appliesTo: 'subscription'
  });

  // 7. Subscriptions
  // Sub 1: Active Yearly Enterprise for Acme Corp with Odoo Brand (+560)
  const sub1 = await Subscription.create({
    subscriptionNumber: 'SUB-2026-001',
    customerId: customerAcme._id,
    customerName: customerAcme.companyName,
    planId: planYearly._id,
    planName: planYearly.name,
    billingInterval: 'yearly',
    startDate: '2026-01-15',
    expiryDate: '2027-01-15',
    nextBillingDate: '2027-01-15',
    lastBilledDate: '2026-01-15',
    paymentTerms: 'Net 30',
    status: 'Active',
    lines: [
      {
        productId: prodERP._id,
        productName: prodERP.name,
        variantOption: 'Odoo Brand Edition',
        variantPriceModifier: 560,
        quantity: 5,
        unitPrice: 760, // 200 + 560
        taxRate: 10,
        taxAmount: 380,
        subtotal: 3800,
        total: 4180
      },
      {
        productId: prodSupport._id,
        productName: prodSupport.name,
        variantOption: 'Standard',
        variantPriceModifier: 0,
        quantity: 1,
        unitPrice: 150,
        taxRate: 10,
        taxAmount: 15,
        subtotal: 150,
        total: 165
      }
    ],
    subtotal: 3950,
    taxTotal: 395,
    discountCode: 'SUMMER20',
    discountTotal: 790,
    grandTotal: 3555,
    notes: 'Premium enterprise subscription with Odoo branding.'
  });

  // Sub 2: Active Monthly for Corner Store
  const sub2 = await Subscription.create({
    subscriptionNumber: 'SUB-2026-002',
    customerId: customerCorner._id,
    customerName: customerCorner.companyName,
    planId: planMonthly._id,
    planName: planMonthly.name,
    billingInterval: 'monthly',
    startDate: '2026-09-01',
    expiryDate: '2027-09-01',
    nextBillingDate: '2026-11-01',
    lastBilledDate: '2026-10-01',
    paymentTerms: 'Net 15',
    status: 'Active',
    lines: [
      {
        productId: prodERP._id,
        productName: prodERP.name,
        variantOption: 'Standard Edition',
        variantPriceModifier: 0,
        quantity: 2,
        unitPrice: 200,
        taxRate: 10,
        taxAmount: 40,
        subtotal: 400,
        total: 440
      },
      {
        productId: prodEcom._id,
        productName: prodEcom.name,
        variantOption: 'Standard',
        variantPriceModifier: 0,
        quantity: 1,
        unitPrice: 75,
        taxRate: 10,
        taxAmount: 7.5,
        subtotal: 75,
        total: 82.5
      }
    ],
    subtotal: 475,
    taxTotal: 47.5,
    discountCode: '',
    discountTotal: 0,
    grandTotal: 522.5,
    notes: 'Retail branch monthly subscription.'
  });

  // Sub 3: Pending Quotation for Apex Digital
  await Subscription.create({
    subscriptionNumber: 'SUB-2026-003',
    customerId: customerApex._id,
    customerName: customerApex.companyName,
    planId: planMonthly._id,
    planName: planMonthly.name,
    billingInterval: 'monthly',
    startDate: '2026-11-01',
    expiryDate: '2027-11-01',
    nextBillingDate: '2026-11-01',
    paymentTerms: 'Immediate',
    quotationExpiryDate: '2026-11-15',
    status: 'Quotation',
    lines: [
      {
        productId: prodAnalytics._id,
        productName: prodAnalytics.name,
        variantOption: 'Standard',
        variantPriceModifier: 0,
        quantity: 4,
        unitPrice: 120,
        taxRate: 10,
        taxAmount: 48,
        subtotal: 480,
        total: 528
      }
    ],
    subtotal: 480,
    taxTotal: 48,
    discountCode: '',
    discountTotal: 0,
    grandTotal: 528,
    notes: 'Offer prepared by sales rep. Valid for 15 days.'
  });

  // 8. Invoices
  // Invoice 1: Acme Paid Invoice
  const inv1 = await Invoice.create({
    invoiceNumber: 'INV-2026-001',
    subscriptionId: sub1._id,
    subscriptionNumber: sub1.subscriptionNumber,
    customerId: customerAcme._id,
    customerName: customerAcme.companyName,
    customerEmail: customerAcme.email,
    billingDate: '2026-01-15',
    dueDate: '2026-02-14',
    billingPeriod: '2026-01-15 to 2027-01-14 (Yearly)',
    paymentTerms: 'Net 30',
    status: 'Paid',
    lines: [
      {
        productId: prodERP._id,
        productName: 'Brightloop ERP Core (Odoo Brand)',
        variantOption: 'Odoo Brand Edition',
        quantity: 5,
        unitPrice: 760,
        taxRate: 10,
        taxAmount: 380,
        discountAmount: 790,
        lineTotal: 3390
      },
      {
        productId: prodSupport._id,
        productName: '24/7 Dedicated Support SLA',
        variantOption: 'Standard',
        quantity: 1,
        unitPrice: 150,
        taxRate: 10,
        taxAmount: 15,
        discountAmount: 0,
        lineTotal: 165
      }
    ],
    subtotal: 3950,
    taxTotal: 395,
    discountTotal: 790,
    totalAmount: 3555,
    paidAmount: 3555,
    balanceDue: 0,
    notes: 'Yearly renewal bill.'
  });

  // Payment for Invoice 1
  await Payment.create({
    paymentNumber: 'PAY-2026-001',
    invoiceId: inv1._id,
    invoiceNumber: inv1.invoiceNumber,
    customerId: customerAcme._id,
    customerName: customerAcme.companyName,
    amount: 3555,
    paymentMethod: 'Bank Transfer',
    paymentDate: '2026-01-20',
    note: 'Wire transfer via Chase JPMorgan. Ref: WIRE-982341.',
    referenceCode: 'TXN-WIRE-982341'
  });

  // Invoice 2: Corner Store Overdue Invoice (Due 2026-10-16, unpaid)
  await Invoice.create({
    invoiceNumber: 'INV-2026-002',
    subscriptionId: sub2._id,
    subscriptionNumber: sub2.subscriptionNumber,
    customerId: customerCorner._id,
    customerName: customerCorner.companyName,
    customerEmail: customerCorner.email,
    billingDate: '2026-10-01',
    dueDate: '2026-10-16', // Past due!
    billingPeriod: '2026-10-01 to 2026-10-31 (Monthly)',
    paymentTerms: 'Net 15',
    status: 'Confirmed',
    lines: [
      {
        productId: prodERP._id,
        productName: 'Brightloop ERP Core',
        variantOption: 'Standard Edition',
        quantity: 2,
        unitPrice: 200,
        taxRate: 10,
        taxAmount: 40,
        discountAmount: 0,
        lineTotal: 440
      },
      {
        productId: prodEcom._id,
        productName: 'E-Commerce Connector Add-on',
        variantOption: 'Standard',
        quantity: 1,
        unitPrice: 75,
        taxRate: 10,
        taxAmount: 7.5,
        discountAmount: 0,
        lineTotal: 82.5
      }
    ],
    subtotal: 475,
    taxTotal: 47.5,
    discountTotal: 0,
    totalAmount: 522.5,
    paidAmount: 0,
    balanceDue: 522.5,
    notes: 'October billing cycle - currently overdue.'
  });

  console.log('[Seed] Brightloop Software demo data successfully initialized!');
  console.log('       Admin User: admin@brightloop.com (Pass: Admin@1234)');
  console.log('       Staff User: staff@brightloop.com (Pass: Staff@1234)');
  console.log('       Customer:   acme@business.com    (Pass: Customer@1234)');
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
