/**
 * Authentication & Staff Provisioning Component
 * Implements password validation policies, password reset, and staff creation.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function AuthModule({ isStaffManagementOnly = false }) {
  const { login } = useAuth();

  const [mode, setMode] = useState(isStaffManagementOnly ? 'addStaff' : 'login'); // 'login', 'register', 'forgot', 'addStaff'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: ''
  });

  const fillCredentials = (email, password) => {
    setMode('login');
    setError(null);
    setFormData(prev => ({
      ...prev,
      email,
      password
    }));
  };

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [resetLink, setResetLink] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password complexity checks: >8 chars, 1 uppercase, 1 lowercase, 1 special character
  const pw = formData.password;
  const isLenValid = pw.length > 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
  const isPasswordStrong = isLenValid && hasUpper && hasLower && hasSpecial;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isPasswordStrong) {
      setError('Password does not meet required complexity standards.');
      return;
    }

    setLoading(true);
    try {
      await api.register(formData);
      // Automatically log in
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.forgotPassword(formData.email);
      setResetLink(res.simulatedLink);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isPasswordStrong) {
      setError('Staff password must be > 8 characters with upper, lower, and special character.');
      return;
    }

    try {
      const res = await api.addStaff(formData);
      setMessage(`Staff member ${res.staff.name} created successfully.`);
      setFormData({ name: '', email: '', password: '', companyName: '', phone: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  // If used for Admin Staff Management screen
  if (isStaffManagementOnly) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Staff Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Provision internal team accounts for sales, quoting, and billing operations.
          </p>
        </div>

        {message && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">{message}</div>}
        {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">{error}</div>}

        <div className="max-w-md bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Add Staff Member</h3>
          <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rachel Green"
                className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="rachel@brightloop.com"
                className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Temporary Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create password"
                className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <div className="text-[11px] text-slate-400 mt-1">Must be &gt;8 characters with uppercase, lowercase, and symbol.</div>
            </div>
            <button
              type="submit"
              disabled={!isPasswordStrong}
              className={`w-full py-2 font-medium rounded text-white ${
                isPasswordStrong ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Provision Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Unauthenticated Screen
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-blue-600 text-white inline-flex items-center justify-center font-black text-2xl shadow-sm mb-3">
            B
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Brightloop Software</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to access your subscriptions and account.</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex border-b border-slate-200 mb-6 text-xs font-semibold">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`pb-3 flex-1 text-center border-b-2 transition-colors ${
                mode === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`pb-3 flex-1 text-center border-b-2 transition-colors ${
                mode === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">{error}</div>}

          {/* SIGN IN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@brightloop.com"
                  className="w-full border border-slate-300 rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-blue-600 hover:underline text-[11px]"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors text-xs"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* SIGN UP */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. David Miller"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Miller Retailers Ltd"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="david@miller.com"
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create secure password"
                  className="w-full border border-slate-300 rounded p-2"
                />

                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
                  <div className="font-semibold text-slate-600 mb-1">Password Requirements:</div>
                  <div className={isLenValid ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                    {isLenValid ? '✓' : '○'} More than 8 characters ({pw.length}/9+)
                  </div>
                  <div className={hasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                    {hasUpper ? '✓' : '○'} Uppercase letter (A-Z)
                  </div>
                  <div className={hasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                    {hasLower ? '✓' : '○'} Lowercase letter (a-z)
                  </div>
                  <div className={hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                    {hasSpecial ? '✓' : '○'} Special character (!@#$...)
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isPasswordStrong || loading}
                className={`w-full py-2.5 rounded font-semibold transition-colors ${
                  isPasswordStrong ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <div className="space-y-4 text-xs">
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="acme@business.com"
                    className="w-full border border-slate-300 rounded p-2.5"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setResetLink(null); }}
                    className="px-3 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>

              {resetLink && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[11px] space-y-1">
                  <div className="font-semibold text-blue-900">Reset Link Generated:</div>
                  <div className="font-mono break-all text-slate-700 bg-white p-2 rounded border border-slate-200">
                    {resetLink}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sample Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] text-slate-400 font-semibold mb-2 text-center uppercase tracking-wider">
              Sample Accounts
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@brightloop.com', 'Admin@1234')}
                className="p-2 border border-slate-200 hover:border-slate-400 rounded text-slate-700 text-[11px] font-medium bg-slate-50 text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('staff@brightloop.com', 'Staff@1234')}
                className="p-2 border border-slate-200 hover:border-blue-400 rounded text-blue-700 text-[11px] font-medium bg-blue-50/50 text-center"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('acme@business.com', 'Customer@1234')}
                className="p-2 border border-slate-200 hover:border-emerald-400 rounded text-emerald-700 text-[11px] font-medium bg-emerald-50/50 text-center"
              >
                Customer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
