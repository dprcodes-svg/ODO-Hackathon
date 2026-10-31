/**
 * Brightloop Subscription Management App
 * Workflow: Enforces authentication prior to accessing business operations.
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Business Modules
import AuthModule from './modules/01_auth/AuthModule';
import DashboardModule from './modules/02_dashboard/DashboardModule';
import ProductsPlansModule from './modules/03_products/ProductsPlansModule';
import CustomersModule from './modules/04_customers/CustomersModule';
import SubscriptionsModule from './modules/05_subscriptions/SubscriptionsModule';
import InvoicesPaymentsModule from './modules/06_invoices/InvoicesPaymentsModule';
import ReportsModule from './modules/07_reports/ReportsModule';

function MainApp() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // If unauthenticated: render login / signup screen
  if (!currentUser) {
    return <AuthModule />;
  }

  const isCustomer = currentUser.role === 'customer';
  const isAdmin = currentUser.role === 'admin';

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardModule onNavigate={setCurrentView} />;
      case 'subscriptions':
        return <SubscriptionsModule />;
      case 'invoices':
        return <InvoicesPaymentsModule />;
      case 'products':
        return !isCustomer ? <ProductsPlansModule /> : <DashboardModule onNavigate={setCurrentView} />;
      case 'customers':
        return !isCustomer ? <CustomersModule /> : <DashboardModule onNavigate={setCurrentView} />;
      case 'reports':
        return !isCustomer ? <ReportsModule /> : <DashboardModule onNavigate={setCurrentView} />;
      case 'staff':
        return isAdmin ? <AuthModule isStaffManagementOnly={true} /> : <DashboardModule onNavigate={setCurrentView} />;
      default:
        return <DashboardModule onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
