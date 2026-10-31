/**
 * Navbar Component
 * Clean and simple light theme header with user profile and session controls.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              B
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tracking-tight text-base leading-none">
                Brightloop Software
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Subscription & Recurring Billing</div>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{currentUser?.role}</div>
              </div>
              <button
                onClick={logout}
                className="ml-2 px-2.5 py-1 text-xs border border-slate-300 hover:bg-slate-50 text-slate-600 rounded transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
