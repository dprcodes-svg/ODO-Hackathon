/**
 * Module 4: Customers Directory Component
 * Manages customer profiles, enterprise accounts, credit limits,
 * payment terms (Net 15, Net 30, Immediate), and linked subscriptions.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function CustomersModule() {
  const { currentUser } = useAuth();
  const isCustomer = currentUser?.role === 'customer';

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);

  // New Customer Modal
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    paymentTerms: 'Net 30',
    creditLimit: 10000,
    notes: ''
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers(searchTerm);
      setCustomers(res.customers || []);
      if (res.customers && res.customers.length === 1 && isCustomer) {
        // Auto-select in customer view
        viewDetails(res.customers[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [searchTerm, simulatedRole]);

  const viewDetails = async (id) => {
    try {
      const res = await api.getCustomerById(id);
      setSelectedCustomer(res.customer);
      setCustomerDetail(res);
    } catch (err) {
      alert('Error fetching customer profile: ' + err.message);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.createCustomer({
        ...newCustomer,
        address: {
          street: newCustomer.street,
          city: newCustomer.city,
          state: newCustomer.state,
          zip: newCustomer.zip,
          country: 'USA'
        }
      });
      setShowModal(false);
      setNewCustomer({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        paymentTerms: 'Net 30',
        creditLimit: 10000,
        notes: ''
      });
      loadCustomers();
    } catch (err) {
      alert('Error creating customer: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Accounts Directory</h2>
          <p className="text-sm text-slate-500">
            {isCustomer
              ? 'Your company contact details, address, and billing terms.'
              : 'Enterprise clients, small business accounts, payment terms, and linked subscription ledgers.'}
          </p>
        </div>

        {!isCustomer && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            + Add New Customer
          </button>
        )}
      </div>

      {/* Search Bar */}
      {!isCustomer && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company name, contact, or email address..."
            className="w-full text-xs border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Customer Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading customers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map(c => (
            <div
              key={c._id}
              onClick={() => viewDetails(c._id)}
              className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {c.paymentTerms || 'Net 30'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {c._id.slice(-6)}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{c.companyName || c.name}</h3>
                <div className="text-xs text-slate-500 mt-0.5">Contact: {c.name}</div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div><strong>Email:</strong> {c.email}</div>
                  <div><strong>Phone:</strong> {c.phone || 'N/A'}</div>
                  <div><strong>Credit Limit:</strong> ${(c.creditLimit || 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-blue-600 font-semibold hover:underline">View History &rarr;</span>
                <span className="text-slate-400">USA</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL DRAWER / MODAL */}
      {customerDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {customerDetail.customer.paymentTerms}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {customerDetail.customer.companyName || customerDetail.customer.name}
                </h3>
                <p className="text-xs text-slate-500">Contact Person: {customerDetail.customer.name} • {customerDetail.customer.email}</p>
              </div>
              <button
                onClick={() => setCustomerDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Linked Subscriptions */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Active & Past Subscriptions ({customerDetail.subscriptions.length})
              </h4>
              <div className="border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                {customerDetail.subscriptions.length === 0 ? (
                  <div className="p-3 text-slate-400">No subscriptions created yet.</div>
                ) : (
                  customerDetail.subscriptions.map(s => (
                    <div key={s._id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <span className="font-semibold text-slate-900">{s.subscriptionNumber}</span>
                        <div className="text-slate-500">{s.planName} • Interval: {s.billingInterval}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">${(s.grandTotal || 0).toLocaleString()}</div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Linked Invoices */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Invoices & Billing Ledger ({customerDetail.invoices.length})
              </h4>
              <div className="border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                {customerDetail.invoices.length === 0 ? (
                  <div className="p-3 text-slate-400">No invoices issued yet.</div>
                ) : (
                  customerDetail.invoices.map(inv => (
                    <div key={inv._id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <span className="font-semibold text-slate-900">{inv.invoiceNumber}</span>
                        <div className="text-slate-500">Date: {inv.billingDate} • Due: {inv.dueDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">${(inv.totalAmount || 0).toLocaleString()}</div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status} (Due: ${(inv.balanceDue || 0).toLocaleString()})
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Customer Account</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomer.companyName}
                  onChange={e => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                  placeholder="e.g. Apex Global Ltd."
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="billing@apex.com"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Terms</label>
                  <select
                    value={newCustomer.paymentTerms}
                    onChange={e => setNewCustomer({ ...newCustomer, paymentTerms: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
