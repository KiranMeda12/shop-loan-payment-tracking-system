import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Calendar, Hash, ShieldCheck } from 'lucide-react';
import api, { formatDateTime } from '../api';

export default function AddRecordModal({ isOpen, onClose, onSuccess }) {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountToPay, setAmountToPay] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'pdf', 'webp'].includes(ext)) {
        setError('Only JPG, PNG, WEBP and PDF files are allowed.');
        return;
      }
      setError('');
      setSlipFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setSlipPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setSlipPreview(null);
      }
    }
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setSlipFile(null);
    setSlipPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Please enter Customer Name.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter Phone Number.');
      return;
    }
    if (!amountToPay || Number(amountToPay) <= 0) {
      setError('Please enter a valid Amount to Pay in ₹ (greater than 0).');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('customer_name', customerName.trim());
      formData.append('phone_number', phoneNumber.trim());
      formData.append('amount_to_pay', amountToPay);
      if (slipFile) {
        formData.append('slip', slipFile);
      }

      await api.post('/records', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset
      setCustomerName('');
      setPhoneNumber('');
      setAmountToPay('');
      setSlipFile(null);
      setSlipPreview(null);
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save customer payment entry. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentDateStr = formatDateTime(new Date().toISOString());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
              <h3 className="text-lg font-bold">Add New Customer / Payment Entry</h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">Quick single-step entry form</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto Generated Preview Banner */}
        <div className="bg-blue-50/80 border-b border-blue-100 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 font-medium">
          <div className="flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-blue-600" />
            <span>Record ID: <strong className="text-blue-950 font-mono">REC-AUTO</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Entry: {currentDateStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
              Initial Status: Pending
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Customer Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              1. Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all text-slate-900 font-medium text-sm"
            />
          </div>

          {/* 2. Phone Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all text-slate-900 font-medium text-sm"
            />
          </div>

          {/* 3. Amount to Pay */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              3. Amount to Pay (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 font-bold text-base">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amountToPay}
                onChange={(e) => setAmountToPay(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition-all text-slate-900 font-semibold text-base"
              />
            </div>
          </div>

          {/* 4. Upload Payment Slip */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              4. Upload Payment Slip <span className="text-slate-400 font-normal">(Optional — JPG, PNG, PDF)</span>
            </label>
            <label className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
              slipFile ? 'border-blue-500 bg-blue-50/40' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
            }`}>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                onChange={handleFileChange}
                className="sr-only"
              />
              {slipFile ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {slipPreview ? (
                      <img src={slipPreview} alt="Slip" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{slipFile.name}</div>
                      <div className="text-xs text-slate-500">{(slipFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-1.5" />
                  <span className="text-xs font-medium text-slate-700">Click to upload or drag & drop</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Payment receipt, UPI screenshot, or voucher</p>
                </div>
              )}
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
