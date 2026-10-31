/**
 * Module 6: Invoices & Payments Component
 * Implements:
 * - Automated "Billing Day" Engine (Generates bills from Active subs, zero duplicate billing)
 * - Invoice lifecycle: Draft -> Confirmed -> Paid
 * - Printable invoice view with line breakdown and taxes
 * - Multi-method Payment recording (Bank Transfer, Credit Card, UPI, Cash)
 * - Real-time Overdue invoice warnings
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function InvoicesPaymentsModule() {
  const { currentUser } = useAuth();
  const isCustomer = currentUser?.role === 'customer';

  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'payments'
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingSummary, setBillingSummary] = useState(null);

  // Payment Recording Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    note: ''
  });

  // Printable Invoice Modal
  const [printableInvoice, setPrintableInvoice] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, payRes] = await Promise.all([
        api.getInvoices(),
        api.getPayments()
      ]);
      setInvoices(invRes.invoices || []);
      setPayments(payRes.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [simulatedRole]);

  const handleRunBillingDay = async () => {
    try {
      const res = await api.runBillingDay();
      setBillingSummary(res);
      loadData();
    } catch (err) {
      alert('Billing Day error: ' + err.message);
    }
  };

  const handleConfirmInvoice = async (id) => {
    try {
      await api.updateInvoiceStatus(id, 'Confirmed');
      loadData();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const openPaymentModal = (invoice) => {
    setPaymentModalInvoice(invoice);
    setPaymentForm({
      amount: invoice.balanceDue || invoice.totalAmount,
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      note: `Payment for ${invoice.invoiceNumber}`
    });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.recordPayment({
        invoiceId: paymentModalInvoice._id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        note: paymentForm.note
      });
      setPaymentModalInvoice(null);
      loadData();
    } catch (err) {
      alert('Payment recording failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isCustomer ? 'My Invoices & Payments' : 'Invoices & Payments Engine'}
          </h2>
          <p className="text-sm text-slate-500">
            {isCustomer
              ? 'Review pending balances, download tax invoices, and record direct settlements.'
              : 'Execute Billing Day for all active subscriptions, prevent double billing, and track cash collections.'}
          </p>
        </div>

        {!isCustomer && (
          <button
            onClick={handleRunBillingDay}
            className="px-4 py-2 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>⚡</span> Run Billing Day
          </button>
        )}
      </div>

      {/* Billing Summary Banner */}
      {billingSummary && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex justify-between items-center">
          <div>
            <strong>Billing Day Completed:</strong> {billingSummary.generatedCount} invoices generated, {billingSummary.skippedCount} subscriptions already billed for the current cycle.
          </div>
          <button onClick={() => setBillingSummary(null)} className="font-bold text-emerald-700 ml-4">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-lg">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Invoices Directory ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading billing records...</div>
      ) : (
        <>
          {/* TAB 1: INVOICES TABLE */}
          {activeTab === 'invoices' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Billing Cycle / Due Date</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Balance Due</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-slate-400">
                        No invoices generated. Click 'Run Billing Day' to generate invoices from active subscriptions.
                      </td>
                    </tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv._id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{inv.customerName}</div>
                          <div className="text-[10px] text-slate-400">{inv.customerEmail}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-700">{inv.billingDate}</div>
                          <div className={`text-[10px] ${inv.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                            Due: {inv.dueDate} {inv.isOverdue && '(OVERDUE)'}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          ${(inv.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className={`font-bold ${(inv.balanceDue || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ${(inv.balanceDue || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                            inv.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            inv.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {/* Print / View Modal */}
                          <button
                            onClick={() => setPrintableInvoice(inv)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[10px]"
                          >
                            Print / PDF
                          </button>

                          {/* Confirm Draft */}
                          {inv.status === 'Draft' && !isCustomer && (
                            <button
                              onClick={() => handleConfirmInvoice(inv._id)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[10px]"
                            >
                              Confirm
                            </button>
                          )}

                          {/* Record Payment */}
                          {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[10px]"
                            >
                              {isCustomer ? 'Pay Now' : 'Record Pay'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: PAYMENTS TABLE */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Payment #</th>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Notes & Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-slate-400">
                        No payment transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-emerald-600">{p.paymentNumber}</td>
                        <td className="p-3 font-mono text-blue-600">{p.invoiceNumber}</td>
                        <td className="p-3 font-medium text-slate-900">{p.customerName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-emerald-600">
                          ${(p.amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-500">{p.paymentDate}</td>
                        <td className="p-3 text-slate-600">{p.note || 'Direct payment recorded'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Record Payment for {paymentModalInvoice.invoiceNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Client: {paymentModalInvoice.customerName} • Outstanding: ${(paymentModalInvoice.balanceDue || 0).toLocaleString()}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Amount to Pay ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Method *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                >
                  <option value="Bank Transfer">Bank Transfer (Wire / ACH)</option>
                  <option value="Credit Card">Credit Card (Stripe)</option>
                  <option value="UPI / Online">UPI / Instant Online</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Corporate Check</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Reference Code / Transaction Note</label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  placeholder="e.g. Wire Transfer Ref: TXN-8921"
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE INVOICE MODAL */}
      {printableInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-300 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-slate-800">
            {/* Invoice Top */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
              <div>
                <div className="text-xl font-black text-slate-900 tracking-tight">BRIGHTLOOP SOFTWARE</div>
                <div className="text-xs text-slate-500">Subscription & Cloud Infrastructure Billing</div>
                <div className="text-xs text-slate-400 mt-1">100 Tech Boulevard, Suite 400 • Austin, TX</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-blue-600">{printableInvoice.invoiceNumber}</div>
                <div className="text-xs text-slate-500">Date: {printableInvoice.billingDate}</div>
                <div className="text-xs font-semibold text-rose-600">Due: {printableInvoice.dueDate}</div>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Billed To:</span>
                <div className="font-bold text-slate-900 text-sm">{printableInvoice.customerName}</div>
                <div className="text-slate-600">{printableInvoice.customerEmail}</div>
                <div className="text-slate-500">Terms: {printableInvoice.paymentTerms}</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Billing Cycle:</span>
                <div className="text-slate-700">{printableInvoice.billingPeriod || 'Recurring Subscription Cycle'}</div>
                <div className="text-slate-500">Sub Ref: {printableInvoice.subscriptionNumber}</div>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full text-xs text-left mb-6">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2">Description</th>
                  <th className="p-2">Variant</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">Tax (10%)</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(printableInvoice.lines || []).map((l, i) => (
                  <tr key={i}>
                    <td className="p-2 font-medium">{l.productName}</td>
                    <td className="p-2 text-slate-500">{l.variantOption || 'Standard'}</td>
                    <td className="p-2 text-center">{l.quantity}</td>
                    <td className="p-2 text-right">${(l.unitPrice || 0).toLocaleString()}</td>
                    <td className="p-2 text-right">${(l.taxAmount || 0).toLocaleString()}</td>
                    <td className="p-2 text-right font-bold">${(l.lineTotal || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary calculations */}
            <div className="flex justify-end text-xs mb-6">
              <div className="w-64 space-y-1.5 border-t border-slate-200 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>${(printableInvoice.subtotal || 0).toLocaleString()}</span>
                </div>
                {printableInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Applied:</span>
                    <span>-${printableInvoice.discountTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax Total:</span>
                  <span>${(printableInvoice.taxTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-300 pt-1">
                  <span>Total Due:</span>
                  <span>${(printableInvoice.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 text-xs">
                  <span>Paid to Date:</span>
                  <span>${(printableInvoice.paidAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-rose-600">
                  <span>Balance Outstanding:</span>
                  <span>${(printableInvoice.balanceDue || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center border-t border-slate-200 pt-4 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Brightloop Billing Engine v1.0</span>
              <div className="space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setPrintableInvoice(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
