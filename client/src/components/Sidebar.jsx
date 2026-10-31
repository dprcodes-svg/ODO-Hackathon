/**
 * Sidebar Navigation Component
 * Adjusts menu options according to user role and authorization.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentView, onSelectView }) {
  const { currentUser } = useAuth();
  const isCustomer = currentUser?.role === 'customer';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <aside className="w-full md:w-60 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-1 text-xs">
        {/* Dashboard (All users) */}
        <button
          onClick={() => onSelectView('dashboard')}
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
            currentView === 'dashboard'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span>Dashboard</span>
        </button>

        {/* Subscriptions */}
        <button
          onClick={() => onSelectView('subscriptions')}
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
            currentView === 'subscriptions'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span>{isCustomer ? 'My Subscriptions' : 'Subscriptions'}</span>
        </button>

        {/* Invoices & Payments */}
        <button
          onClick={() => onSelectView('invoices')}
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
            currentView === 'invoices'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span>{isCustomer ? 'My Invoices & Payments' : 'Invoices & Payments'}</span>
        </button>

        {/* Products & Plans (Staff and Admin) */}
        {!isCustomer && (
          <button
            onClick={() => onSelectView('products')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
              currentView === 'products'
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Products & Plans</span>
          </button>
        )}

        {/* Customers Directory (Staff and Admin) */}
        {!isCustomer && (
          <button
            onClick={() => onSelectView('customers')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
              currentView === 'customers'
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Customers</span>
          </button>
        )}

        {/* Reports (Staff and Admin) */}
        {!isCustomer && (
          <button
            onClick={() => onSelectView('reports')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
              currentView === 'reports'
                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Financial Reports</span>
          </button>
        )}

        {/* Staff Management (Admin Only) */}
        {isAdmin && (
          <button
            onClick={() => onSelectView('staff')}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
              currentView === 'staff'
                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Staff Management</span>
          </button>
        )}
      </nav>
    </aside>
  );
}
