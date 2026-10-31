/**
 * Module 3: Products, Plans & Discount Rules Component
 * Enforces:
 * - Product Types (Software, Service, Add-on)
 * - Brand Variants (e.g. Odoo brand edition adds +$560)
 * - Billing intervals (daily, weekly, monthly, yearly)
 * - Plan rules: auto-close on end date, allow pause, early close, renew
 * - Admin discount engine: percentage/fixed, min purchase/quantity, usage quotas
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function ProductsPlansModule() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState('products'); // 'products', 'plans', 'discounts'
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    type: 'Software',
    salesPrice: '',
    costPrice: '',
    taxRate: 10,
    notes: '',
    variants: [
      { groupName: 'Brand', optionName: 'Standard Edition', priceModifier: 0 },
      { groupName: 'Brand', optionName: 'Odoo Brand Edition', priceModifier: 560 }
    ]
  });

  // New Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    billingInterval: 'monthly',
    price: '',
    minQuantity: 1,
    availableFrom: '2026-01-01',
    availableTo: '2027-12-31',
    autoCloseOnEnd: false,
    allowEarlyClose: true,
    allowPause: true,
    allowRenew: true,
    description: ''
  });

  // New Discount Modal State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    name: '',
    type: 'percentage',
    value: '',
    minQuantity: 0,
    minPurchaseAmount: 0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    maxUses: 100,
    appliesTo: 'subscription'
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [prodRes, planRes, discRes] = await Promise.all([
        api.getProducts(),
        api.getPlans(),
        api.getDiscounts()
      ]);
      setProducts(prodRes.products || []);
      setPlans(planRes.plans || []);
      setDiscounts(discRes.discounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.createProduct(newProduct);
      setShowProductModal(false);
      setNewProduct({
        name: '',
        type: 'Software',
        salesPrice: '',
        costPrice: '',
        taxRate: 10,
        notes: '',
        variants: [
          { groupName: 'Brand', optionName: 'Standard Edition', priceModifier: 0 },
          { groupName: 'Brand', optionName: 'Odoo Brand Edition', priceModifier: 560 }
        ]
      });
      loadAll();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await api.createPlan(newPlan);
      setShowPlanModal(false);
      loadAll();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    try {
      await api.createDiscount(newDiscount);
      setShowDiscountModal(false);
      loadAll();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Products, Plans & Discounts</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Define software items, brand variant pricing, billing intervals, and discount policies.
          </p>
        </div>

        {/* Action Button */}
        {isAdmin && (
          <div className="flex gap-2">
            {activeTab === 'products' && (
              <button
                onClick={() => setShowProductModal(true)}
                className="px-3 py-2 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                + Add Product
              </button>
            )}
            {activeTab === 'plans' && (
              <button
                onClick={() => setShowPlanModal(true)}
                className="px-3 py-2 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                + Add Plan
              </button>
            )}
            {activeTab === 'discounts' && (
              <button
                onClick={() => setShowDiscountModal(true)}
                className="px-3 py-2 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                + Add Discount Rule
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-lg">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Products & Brand Variants ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'plans'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Billing Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('discounts')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'discounts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Discount Rules ({discounts.length})
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading catalog...</div>
      ) : (
        <>
          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(prod => (
                <div key={prod._id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {prod.type}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{prod.code}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{prod.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">{prod.notes || 'No description provided.'}</p>

                    <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-2 mb-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Base Sales Price:</span>
                        <span className="font-bold text-slate-900">${prod.salesPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cost Price:</span>
                        <span className="text-slate-700">${prod.costPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tax Rate:</span>
                        <span className="text-slate-700">{prod.taxRate}%</span>
                      </div>
                    </div>

                    {/* Variants preview */}
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">Configured Variants:</span>
                      <div className="mt-1 space-y-1">
                        {(prod.variants || []).map((v, i) => (
                          <div key={i} className="flex justify-between text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                            <span>{v.optionName}</span>
                            <span className="font-semibold text-blue-600">
                              {v.priceModifier > 0 ? `+$${v.priceModifier}` : 'Standard (+$0)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: PLANS */}
          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map(plan => (
                <div key={plan._id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {plan.billingInterval}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{plan.code}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">{plan.description}</p>

                    <div className="text-2xl font-black text-slate-900 mb-4">
                      ${plan.price} <span className="text-xs font-normal text-slate-500">/ {plan.billingInterval}</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span>Min Seats/Qty:</span>
                        <span className="font-semibold">{plan.minQuantity || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto-Close on End:</span>
                        <span className={plan.autoCloseOnEnd ? 'text-amber-600 font-semibold' : 'text-slate-600'}>
                          {plan.autoCloseOnEnd ? 'Yes (Auto Closes)' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allow Pause:</span>
                        <span>{plan.allowPause ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allow Early Close:</span>
                        <span>{plan.allowEarlyClose ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: DISCOUNTS */}
          {activeTab === 'discounts' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Discount Code</th>
                    <th className="p-3">Rule Name</th>
                    <th className="p-3">Discount Value</th>
                    <th className="p-3">Qualification Criteria</th>
                    <th className="p-3">Usage Limits</th>
                    <th className="p-3">Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {discounts.map(d => (
                    <tr key={d._id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-600">{d.code}</td>
                      <td className="p-3 font-medium text-slate-900">{d.name}</td>
                      <td className="p-3 font-semibold text-emerald-600">
                        {d.type === 'percentage' ? `${d.value}% Off` : `$${d.value} Flat Off`}
                      </td>
                      <td className="p-3 text-slate-600">
                        {d.minQuantity > 0 && <div>Min Qty: {d.minQuantity} seats</div>}
                        {d.minPurchaseAmount > 0 && <div>Min Spend: ${d.minPurchaseAmount}</div>}
                        {!d.minQuantity && !d.minPurchaseAmount && <div>No minimum</div>}
                      </td>
                      <td className="p-3 text-slate-600">
                        {d.usedCount || 0} / {d.maxUses} redeemed
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                          {d.appliesTo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CREATE PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add New Software Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Brightloop Inventory Pro"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Type</label>
                  <select
                    value={newProduct.type}
                    onChange={e => setNewProduct({ ...newProduct, type: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Software">Software</option>
                    <option value="Service">Service</option>
                    <option value="Add-on">Add-on</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={newProduct.taxRate}
                    onChange={e => setNewProduct({ ...newProduct, taxRate: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Sales Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.salesPrice}
                    onChange={e => setNewProduct({ ...newProduct, salesPrice: e.target.value })}
                    placeholder="200"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    value={newProduct.costPrice}
                    onChange={e => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    placeholder="50"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Notes</label>
                <textarea
                  value={newProduct.notes}
                  onChange={e => setNewProduct({ ...newProduct, notes: e.target.value })}
                  placeholder="Product description and billing notes"
                  rows={2}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              {/* Variant Rule Preview (Odoo Brand +$560) */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="font-semibold text-slate-700">Pre-configured Brand Variants:</div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Standard Edition: +$0 | <strong>Odoo Brand Edition: +$560</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Recurring Billing Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={newPlan.name}
                  onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g. Quarterly Growth"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Billing Frequency</label>
                  <select
                    value={newPlan.billingInterval}
                    onChange={e => setNewPlan({ ...newPlan, billingInterval: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={newPlan.price}
                    onChange={e => setNewPlan({ ...newPlan, price: e.target.value })}
                    placeholder="199"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Min Quantity / Seats</label>
                  <input
                    type="number"
                    value={newPlan.minQuantity}
                    onChange={e => setNewPlan({ ...newPlan, minQuantity: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlan.autoCloseOnEnd}
                      onChange={e => setNewPlan({ ...newPlan, autoCloseOnEnd: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Auto-close when ends</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DISCOUNT MODAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Admin Discount Rule</h3>
            <form onSubmit={handleCreateDiscount} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={newDiscount.code}
                    onChange={e => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. VIP30"
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Rule Name *</label>
                  <input
                    type="text"
                    required
                    value={newDiscount.name}
                    onChange={e => setNewDiscount({ ...newDiscount, name: e.target.value })}
                    placeholder="VIP Client Discount"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Discount Type</label>
                  <select
                    value={newDiscount.type}
                    onChange={e => setNewDiscount({ ...newDiscount, type: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={newDiscount.value}
                    onChange={e => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })}
                    placeholder="15"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Min Spend ($)</label>
                  <input
                    type="number"
                    value={newDiscount.minPurchaseAmount}
                    onChange={e => setNewDiscount({ ...newDiscount, minPurchaseAmount: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={newDiscount.maxUses}
                    onChange={e => setNewDiscount({ ...newDiscount, maxUses: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Save Discount Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
