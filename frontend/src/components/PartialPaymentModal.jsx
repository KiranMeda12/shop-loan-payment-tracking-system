import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, CreditCard, Banknote, Calendar, Tag } from 'lucide-react';
import api, { formatCurrency } from '../api';

export default function PartialPaymentModal({ record, isOpen, onClose, onSuccess }) {
  if (!isOpen || !record) return null;

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const newBalance = Math.max(0, record.remaining_balance - numAmount);
  const willBeFullyPaid = numAmount >= record.remaining_balance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }
    if (numAmount > record.remaining_balance) {
      setError(`Payment amount cannot exceed remaining balance of ${formatCurrency(record.remaining_balance)}`);
      return;
    }

    try {
      setLoading(true);
      await api.post(`/records/${record.id}/partial-payment`, {
        amount: numAmount,
        payment_date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Record Customer Payment</h3>
            <p className="text-xs text-slate-300">Record ID: {record.record_id}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Balance Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Customer</span>
              <div className="text-sm font-bold text-slate-900">{record.customer_name}</div>
              <div className="text-xs text-slate-500">{record.customer_phone}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Outstanding Balance</span>
              <div className="text-lg font-black text-rose-600">{formatCurrency(record.remaining_balance)}</div>
              <div className="text-xs text-slate-500">Paid: {formatCurrency(record.amount_paid)}</div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Received */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Amount Received (₹) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(record.remaining_balance))}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Pay Full ({formatCurrency(record.remaining_balance)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={record.remaining_balance}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-slate-900 font-bold text-base"
              />
            </div>
          </div>

          {/* Balance calculation preview */}
          {numAmount > 0 && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              willBeFullyPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <span>New Remaining Balance:</span>
              <span className="font-bold text-sm">
                {formatCurrency(newBalance)} {willBeFullyPaid && '(Status: Paid)'}
              </span>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'UPI', 'Bank Transfer'].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    paymentMethod === mode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs font-medium"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Reference / Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. GPay ref #827103, partial installment"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs font-medium"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Save Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
