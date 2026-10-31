/**
 * Module 3: Product Model
 * Supports Product Types, Cost/Sales Pricing, and Brand Variants (e.g. Odoo brand +$560)
 */

const createDualModel = require('./modelAdapter');

const productSchema = {
  name: { type: String, required: true },
  code: { type: String, default: '' },
  type: { type: String, enum: ['Software', 'Service', 'Add-on'], default: 'Software' },
  salesPrice: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
  taxRate: { type: Number, default: 10 }, // Tax percentage (e.g. 10%)
  notes: { type: String, default: '' },
  active: { type: Boolean, default: true },
  // Product Variants (e.g. Brand variant where Odoo adds +$560)
  variants: [{
    groupName: { type: String, default: 'Brand' },
    optionName: { type: String, required: true }, // e.g. 'Standard', 'Odoo Brand'
    priceModifier: { type: Number, default: 0 }    // e.g. 560
  }]
};

module.exports = createDualModel('products', productSchema);
