/**
 * Dashboard Component
 * Clean light theme executive overview:
 * - Real-time MRR, ARR, Active Subscriptions count
 * - Revenue Collections vs Outstanding Receivables
 * - Overdue invoice alerts
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function DashboardModule({ onNavigate }) {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingResult, setBillingResult] = useState(null);

  const isCustomer = currentUser?.role === 'customer';

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser?.role]);

  const handleRunBillingDay = async () => {
    try {
      const res = await api.runBillingDay();
      setBillingResult(res.message);
      fetchStats();
    } catch (err) {
      alert('Billing Day Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading dashboard metrics...
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isCustomer ? 'Customer Portal Dashboard' : 'Subscription Business Dashboard'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isCustomer
              ? `Welcome, ${currentUser?.name || 'Customer'}. Manage your active subscriptions and invoices.`
              : 'Brightloop Software revenue pulse, recurring contracts, and billing telemetry.'}
          </p>
        </div>

        {/* Quick Actions */}
        {!isCustomer && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRunBillingDay}
              className="px-3.5 py-2 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>⚡</span> Run Billing Day
            </button>
            <button
              onClick={() => onNavigate && onNavigate('subscriptions')}
              className="px-3.5 py-2 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              + New Quote / Sub
            </button>
          </div>
        )}
      </div>

      {billingResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex justify-between items-center">
          <span>{billingResult}</span>
          <button onClick={() => setBillingResult(null)} className="text-emerald-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {isCustomer ? 'My Active Subscriptions' : 'Active Subscriptions'}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">
            {kpis.activeSubscriptions || 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {isCustomer ? 'Current active contracts' : `Total contracts: ${kpis.totalSubscriptions || 0}`}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {isCustomer ? 'Monthly Commitment' : 'Monthly Recurring (MRR)'}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-600">
            ${(kpis.mrr || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {isCustomer ? 'Recurring monthly charges' : `ARR: $${(kpis.arr || 0).toLocaleString()}`}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {isCustomer ? 'Total Paid to Date' : 'Revenue Collected'}
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600">
            ${(kpis.totalRevenueCollected || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Settled via Bank / Card
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {isCustomer ? 'Pending Invoices' : 'Overdue Invoices'}
          </div>
          <div className={`mt-2 text-3xl font-extrabold ${kpis.overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {kpis.overdueCount || 0}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {kpis.overdueAmount ? `$${kpis.overdueAmount.toLocaleString()} overdue` : 'All invoices current'}
          </div>
        </div>
      </div>

      {/* Tables: Recent Subscriptions and Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Subscriptions */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Recent Subscriptions</h3>
            <button
              onClick={() => onNavigate && onNavigate('subscriptions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View All &rarr;
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {(data?.recentSubscriptions || []).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No subscriptions found.</div>
            ) : (
              data.recentSubscriptions.map(sub => (
                <div key={sub._id} className="p-3.5 text-xs flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="font-semibold text-slate-900">{sub.subscriptionNumber}</div>
                    <div className="text-slate-500">{sub.customerName} • {sub.planName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">${(sub.grandTotal || 0).toLocaleString()}</div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      sub.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                      sub.status === 'Quotation' ? 'bg-amber-100 text-amber-800' :
                      sub.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Recent Invoices</h3>
            <button
              onClick={() => onNavigate && onNavigate('invoices')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View All &rarr;
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {(data?.recentInvoices || []).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No invoices generated yet.</div>
            ) : (
              data.recentInvoices.map(inv => (
                <div key={inv._id} className="p-3.5 text-xs flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="font-semibold text-slate-900">{inv.invoiceNumber}</div>
                    <div className="text-slate-500">{inv.customerName} • Due: {inv.dueDate || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">${(inv.totalAmount || 0).toLocaleString()}</div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                      inv.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                      inv.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
