import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, Store } from 'lucide-react';
import api from '../api';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        username: username.trim(),
        password: password,
      });

      const { access_token, user } = res.data;
      localStorage.setItem('shop_token', access_token);
      localStorage.setItem('shop_user', JSON.stringify(user));

      onLoginSuccess(user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/30 mb-4 font-black text-3xl">
            ₹
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ShopCredit Pro</h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            Shop Loan & Payment Tracking Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Shop Owner Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to access the financial portal</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-slate-900 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-slate-900 text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Default Shop Owner:</span>
                <span className="text-[11px] text-slate-500 font-mono">admin / admin123</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Auto Fill
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secure Encrypted Session • MySQL Backend</span>
        </div>
      </div>
    </div>
  );
}
