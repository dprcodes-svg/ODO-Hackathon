/**
 * API Service Client for Brightloop Subscription Monolith
 * Handles REST calls, JWT authentication, and Demo Role Simulation headers.
 */

const BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('brightloop_token');
  const simRole = localStorage.getItem('brightloop_sim_role') || 'admin';
  const simCustomerId = localStorage.getItem('brightloop_sim_customer_id');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(simRole ? { 'X-Simulated-Role': simRole } : {}),
    ...(simCustomerId ? { 'X-Simulated-Customer-Id': simCustomerId } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed with status ' + response.status);
  }
  return data;
}

export const api = {
  // Module 1: Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  getMe: () => request('/auth/me'),
  addStaff: (data) => request('/auth/staff', { method: 'POST', body: JSON.stringify(data) }),
  listUsers: () => request('/auth/users'),

  // Module 2: Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Module 3: Products, Plans & Discounts
  getProducts: () => request('/catalog/products'),
  createProduct: (data) => request('/catalog/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/catalog/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/catalog/products/${id}`, { method: 'DELETE' }),
  getPlans: () => request('/catalog/plans'),
  createPlan: (data) => request('/catalog/plans', { method: 'POST', body: JSON.stringify(data) }),
  getDiscounts: () => request('/catalog/discounts'),
  createDiscount: (data) => request('/catalog/discounts', { method: 'POST', body: JSON.stringify(data) }),

  // Module 4: Customers
  getCustomers: (search = '') => request(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getCustomerById: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Module 5: Subscriptions
  getSubscriptions: (status = '') => request(`/subscriptions${status ? `?status=${status}` : ''}`),
  getSubscriptionById: (id) => request(`/subscriptions/${id}`),
  createSubscription: (data) => request('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscriptionStatus: (id, status, note = '') => request(`/subscriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note })
  }),
  getTemplates: () => request('/subscriptions/templates'),

  // Module 6: Invoices & Payments
  getInvoices: (status = '') => request(`/invoices${status ? `?status=${status}` : ''}`),
  getInvoiceById: (id) => request(`/invoices/${id}`),
  runBillingDay: () => request('/invoices/run-billing-day', { method: 'POST' }),
  updateInvoiceStatus: (id, status) => request(`/invoices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  recordPayment: (data) => request('/invoices/payments', { method: 'POST', body: JSON.stringify(data) }),
  getPayments: () => request('/invoices/payments/list'),

  // Module 7: Reports
  getFinancialSummary: () => request('/reports/summary')
};
