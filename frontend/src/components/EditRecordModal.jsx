import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api';

export default function EditRecordModal({ record, isOpen, onClose, onSuccess }) {
  if (!isOpen || !record) return null;

  const [customerName, setCustomerName] = useState(record.customer_name || '');
  const [phoneNumber, setPhoneNumber] = useState(record.customer_phone || '');
  const [amountToPay, setAmountToPay] = useState(record.amount_to_pay || '');
  const [notes, setNotes] = useState(record.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setCustomerName(record.customer_name || '');
      setPhoneNumber(record.customer_phone || '');
      setAmountToPay(record.amount_to_pay || '');
      setNotes(record.notes || '');
    }
  }, [record]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || !phoneNumber.trim()) {
      setError('Customer name and phone number are required.');
      return;
    }
    if (Number(amountToPay) <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/records/${record.id}`, {
        customer_name: customerName.trim(),
        customer_phone: phoneNumber.trim(),
        amount_to_pay: Number(amountToPay),
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Edit Customer Record</h3>
            <p className="text-xs text-slate-300">ID: {record.record_id}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Customer Name
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Amount to Pay (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={amountToPay}
              onChange={(e) => setAmountToPay(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
