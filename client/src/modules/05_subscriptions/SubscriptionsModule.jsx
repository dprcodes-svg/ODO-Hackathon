/**
 * Module 5: Subscriptions & Quotation Engine Component
 * Implements:
 * - Quotation templates for sales reps
 * - Multi-line subscription creation with brand variants (e.g. Odoo brand +$560)
 * - Discount code application & automatic tax calculation
 * - Full lifecycle state machine: Draft -> Quotation -> Confirmed -> Active -> Paused / Closed
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function SubscriptionsModule() {
  const { currentUser } = useAuth();
  const isCustomer = currentUser?.role === 'customer';

  const [subscriptions, setSubscriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // New Subscription / Quote Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [quotationDays, setQuotationDays] = useState(15);
  const [discountCode, setDiscountCode] = useState('');
  const [isQuoteOnly, setIsQuoteOnly] = useState(true);
  const [lines, setLines] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subRes, custRes, planRes, prodRes, tplRes] = await Promise.all([
        api.getSubscriptions(filterStatus),
        api.getCustomers(),
        api.getPlans(),
        api.getProducts(),
        api.getTemplates()
      ]);
      setSubscriptions(subRes.subscriptions || []);
      setCustomers(custRes.customers || []);
      setPlans(planRes.plans || []);
      setProducts(prodRes.products || []);
      setTemplates(tplRes.templates || []);

      if (custRes.customers?.length > 0 && !selectedCustomer) {
        setSelectedCustomer(custRes.customers[0]._id);
      }
      if (planRes.plans?.length > 0 && !selectedPlan) {
        setSelectedPlan(planRes.plans[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, simulatedRole]);

  // Load quotation template lines
  const applyTemplate = (tpl) => {
    const matchedPlan = plans.find(p => p.name === tpl.planName);
    if (matchedPlan) setSelectedPlan(matchedPlan._id);
    setQuotationDays(tpl.validDays);

    const templateLines = tpl.defaultLines.map(dl => {
      const prod = products.find(p => p.name === dl.productName) || products[0];
      return {
        productId: prod?._id || 'prod_01',
        productName: dl.productName,
        variantOption: dl.variantOption,
        variantPriceModifier: dl.variantPriceModifier,
        quantity: dl.quantity,
        unitPrice: prod?.salesPrice || dl.unitPrice,
        taxRate: dl.taxRate
      };
    });
    setLines(templateLines);
  };

  const addLine = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setLines([
      ...lines,
      {
        productId: firstProd._id,
        productName: firstProd.name,
        variantOption: 'Standard Edition',
        variantPriceModifier: 0,
        quantity: 1,
        unitPrice: firstProd.salesPrice,
        taxRate: firstProd.taxRate || 10
      }
    ]);
  };

  const removeLine = (idx) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, val) => {
    const updated = [...lines];
    updated[idx][field] = val;

    if (field === 'productId') {
      const prod = products.find(p => p._id === val);
      if (prod) {
        updated[idx].productName = prod.name;
        updated[idx].unitPrice = prod.salesPrice;
        updated[idx].taxRate = prod.taxRate || 10;
      }
    } else if (field === 'variantOption') {
      // Check if Odoo Brand Edition selected -> adds +560
      if (val.includes('Odoo')) {
        updated[idx].variantPriceModifier = 560;
      } else {
        updated[idx].variantPriceModifier = 0;
      }
    }

    setLines(updated);
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert('Please add at least one product line item to the quotation.');
      return;
    }

    try {
      await api.createSubscription({
        customerId: isCustomer ? (currentUser?.customerId || selectedCustomer) : selectedCustomer,
        planId: selectedPlan,
        lines,
        quotationExpiryDays: Number(quotationDays),
        discountCode,
        isQuoteOnly: isCustomer ? false : isQuoteOnly,
        status: isCustomer ? 'Active' : undefined
      });
      setShowModal(false);
      setLines([]);
      setDiscountCode('');
      loadData();
    } catch (err) {
      alert('Error creating subscription: ' + err.message);
    }
  };

  const handleTransitionStatus = async (id, status, note = '') => {
    try {
      await api.updateSubscriptionStatus(id, status, note);
      loadData();
    } catch (err) {
      alert('Status transition failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isCustomer ? 'My Subscriptions' : 'Subscriptions & Quotation Engine'}
          </h2>
          <p className="text-sm text-slate-500">
            {isCustomer
              ? 'Review your active software contracts and validity periods.'
              : 'Quotation templates, line-item variant pricing, discount codes, and complete lifecycle states.'}
          </p>
        </div>

        <button
          onClick={() => {
            if (lines.length === 0) addLine();
            setShowModal(true);
          }}
          className="px-3.5 py-2 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
        >
          {isCustomer ? '+ Subscribe to Plan' : '+ Create Quote / Subscription'}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-2 text-xs">
        <span className="font-semibold text-slate-500 py-1 px-2">Filter Status:</span>
        {['', 'Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1 rounded transition-colors ${
              filterStatus === st ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st || 'All Subscriptions'}
          </button>
        ))}
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading subscriptions...</div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="p-3">Sub #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Plan / Interval</th>
                <th className="p-3">Line Items</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Status</th>
                {!isCustomer && <th className="p-3 text-right">Lifecycle Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-400">
                    No subscriptions found for this filter.
                  </td>
                </tr>
              ) : (
                subscriptions.map(sub => (
                  <tr key={sub._id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-600">{sub.subscriptionNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{sub.customerName}</div>
                      <div className="text-[10px] text-slate-400">Terms: {sub.paymentTerms}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">{sub.planName}</div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{sub.billingInterval}</span>
                    </td>
                    <td className="p-3 max-w-xs">
                      {(sub.lines || []).map((l, i) => (
                        <div key={i} className="text-[11px] text-slate-600 truncate">
                          {l.quantity}x {l.productName} ({l.variantOption})
                        </div>
                      ))}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">${(sub.grandTotal || 0).toLocaleString()}</div>
                      {sub.discountTotal > 0 && (
                        <div className="text-[10px] text-emerald-600">Saved: -${sub.discountTotal}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                        sub.status === 'Quotation' ? 'bg-amber-100 text-amber-800' :
                        sub.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                        sub.status === 'Paused' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {sub.status}
                      </span>
                    </td>

                    {/* Interactive State Machine Action Buttons */}
                    {!isCustomer && (
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        {sub.status === 'Draft' && (
                          <button
                            onClick={() => handleTransitionStatus(sub._id, 'Quotation')}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-medium text-[10px]"
                          >
                            Send Quote
                          </button>
                        )}
                        {sub.status === 'Quotation' && (
                          <button
                            onClick={() => handleTransitionStatus(sub._id, 'Confirmed')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[10px]"
                          >
                            Confirm Order
                          </button>
                        )}
                        {sub.status === 'Confirmed' && (
                          <button
                            onClick={() => handleTransitionStatus(sub._id, 'Active')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[10px]"
                          >
                            Activate Now
                          </button>
                        )}
                        {sub.status === 'Active' && (
                          <>
                            <button
                              onClick={() => handleTransitionStatus(sub._id, 'Paused')}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium text-[10px]"
                            >
                              Pause
                            </button>
                            <button
                              onClick={() => handleTransitionStatus(sub._id, 'Closed', 'Closed early by admin/customer')}
                              className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded font-medium text-[10px]"
                            >
                              Close
                            </button>
                          </>
                        )}
                        {sub.status === 'Paused' && (
                          <button
                            onClick={() => handleTransitionStatus(sub._id, 'Active', 'Resumed subscription')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[10px]"
                          >
                            Resume
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE QUOTE / SUB MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Prepare New Subscription / Quotation</h3>
                <p className="text-xs text-slate-500">Pick a customer, choose products and variants, and calculate recurring dues.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            {/* Quick Template Picker */}
            <div className="mb-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700 block mb-1.5">⚡ Start from Quotation Template:</span>
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 rounded text-slate-700 font-medium text-[11px]"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {!isCustomer ? (
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Customer *</label>
                    <select
                      value={selectedCustomer}
                      onChange={e => setSelectedCustomer(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs"
                    >
                      {customers.map(c => (
                        <option key={c._id} value={c._id}>{c.companyName || c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Subscriber Account</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser?.name || 'My Account'}
                      className="w-full border border-slate-200 bg-slate-50 text-slate-600 rounded p-2 text-xs"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Plan Frequency *</label>
                  <select
                    value={selectedPlan}
                    onChange={e => setSelectedPlan(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    {plans.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.billingInterval})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-slate-800">Product Line Items ({lines.length})</label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 p-3 rounded bg-slate-50">
                  {lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-slate-200">
                      <div className="col-span-4">
                        <select
                          value={line.productId}
                          onChange={e => updateLine(idx, 'productId', e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 text-xs"
                        >
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <select
                          value={line.variantOption}
                          onChange={e => updateLine(idx, 'variantOption', e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 text-xs"
                        >
                          <option value="Standard Edition">Standard (+$0)</option>
                          <option value="Odoo Brand Edition">Odoo Brand (+560)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={e => updateLine(idx, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full border border-slate-300 rounded p-1 text-xs text-center"
                        />
                      </div>

                      <div className="col-span-2 text-right font-bold text-slate-800">
                        ${((line.unitPrice + line.variantPriceModifier) * line.quantity).toLocaleString()}
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-rose-500 font-bold hover:text-rose-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount & Terms */}
              <div className={`grid ${isCustomer ? 'grid-cols-1' : 'grid-cols-3'} gap-3`}>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Discount Code</label>
                  <input
                    type="text"
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER20"
                    className="w-full border border-slate-300 rounded p-2 text-xs font-mono uppercase"
                  />
                </div>
                {!isCustomer && (
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Quote Validity (Days)</label>
                    <input
                      type="number"
                      value={quotationDays}
                      onChange={e => setQuotationDays(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                )}
                {!isCustomer && (
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Initial Mode</label>
                    <select
                      value={isQuoteOnly ? 'quote' : 'direct'}
                      onChange={e => setIsQuoteOnly(e.target.value === 'quote')}
                      className="w-full border border-slate-300 rounded p-2 text-xs"
                    >
                      <option value="quote">Draft Quotation</option>
                      <option value="direct">Direct Confirmed</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                >
                  {isCustomer ? 'Confirm & Subscribe' : isQuoteOnly ? 'Generate Quotation' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
