import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Phone, User, Calendar, CreditCard, CheckCircle2, Clock, AlertTriangle, FileText, ArrowUpRight, ArrowLeft } from 'lucide-react';
import api, { formatCurrency, formatDate, formatDateTime, downloadFile } from '../api';
import StatusBadge from './StatusBadge';

export default function CustomerDetailModal({ customerId, isOpen, onClose, onRefreshRequired }) {
  if (!isOpen || !customerId) return null;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' | 'transactions' | 'slips'

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/customers/${customerId}`);
      setCustomer(res.data);
    } catch (err) {
      setError('Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    await downloadFile(`/customers/${customerId}/statement-pdf`, `Statement_${customer?.name || 'Customer'}.pdf`);
  };

  // Collect all transactions across all records
  const allTransactions = [];
  if (customer && customer.records) {
    customer.records.forEach((r) => {
      (r.transactions || []).forEach((t) => {
        allTransactions.push({
          ...t,
          record_id: r.record_id,
        });
      });
    });
  }
  allTransactions.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

  // Collect all slips
  const allSlips = (customer?.records || []).filter((r) => r.slip_url);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white flex items-center justify-between no-print gap-3">
          <div className="flex items-center gap-3">
            {/* Prominent Back Button */}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-white/20 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Customer Account Ledger</h3>
              </div>
              <p className="text-xs text-slate-300">Complete loan, transaction and payment history</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Statement
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Statement
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close ledger"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Loading customer ledger...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">{error}</div>
          ) : customer ? (
            <>
              {/* Profile Card & Aggregated Financials */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                      {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          {customer.phone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Customer since {formatDate(customer.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Credit</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(customer.total_amount_to_pay)}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-emerald-100 p-3 text-center">
                      <span className="text-[11px] font-semibold text-emerald-600 uppercase block">Received</span>
                      <span className="text-sm font-bold text-emerald-700">{formatCurrency(customer.total_amount_paid)}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-rose-100 p-3 text-center">
                      <span className="text-[11px] font-semibold text-rose-600 uppercase block">Balance Due</span>
                      <span className="text-sm font-black text-rose-600">{formatCurrency(customer.remaining_balance)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print">
                <button
                  onClick={() => setActiveTab('entries')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'entries'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Entries ({customer.records?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'transactions'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Payment History ({allTransactions.length})
                </button>
                <button
                  onClick={() => setActiveTab('slips')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'slips'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Uploaded Slips ({allSlips.length})
                </button>
              </div>

              {/* Tab 1: Entries */}
              {activeTab === 'entries' && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Record ID</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Amount to Pay</th>
                        <th className="px-4 py-3 text-right">Paid</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                        <th className="px-4 py-3 text-center">Slip</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {customer.records?.length > 0 ? (
                        customer.records.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-blue-600">{r.record_id}</td>
                            <td className="px-4 py-3 text-slate-600">{formatDate(r.entry_date)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(r.amount_to_pay)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatCurrency(r.amount_paid)}</td>
                            <td className="px-4 py-3 text-right font-black text-rose-600">{formatCurrency(r.remaining_balance)}</td>
                            <td className="px-4 py-3 text-center">
                              {r.slip_url ? (
                                <a
                                  href={r.slip_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  View
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={r.status} size="sm" />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-slate-400">
                            No loan entries recorded for this customer yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Transactions History */}
              {activeTab === 'transactions' && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Receipt #</th>
                        <th className="px-4 py-3">Payment Date</th>
                        <th className="px-4 py-3">Record Ref</th>
                        <th className="px-4 py-3 text-right">Amount Paid</th>
                        <th className="px-4 py-3">Payment Mode</th>
                        <th className="px-4 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {allTransactions.length > 0 ? (
                        allTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-600">TXN-{String(tx.id).padStart(4, '0')}</td>
                            <td className="px-4 py-3 text-slate-600">{formatDateTime(tx.payment_date)}</td>
                            <td className="px-4 py-3 font-mono font-bold text-blue-600">{tx.record_id}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(tx.amount)}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                {tx.payment_method}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{tx.notes || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-slate-400">
                            No payment transactions recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: Slips Gallery */}
              {activeTab === 'slips' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allSlips.length > 0 ? (
                    allSlips.map((r) => (
                      <div key={r.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-3 overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-blue-600 text-xs">{r.record_id}</span>
                            <span className="text-[11px] text-slate-500">{formatDate(r.entry_date)}</span>
                          </div>
                          <div className="h-32 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center mb-2">
                            {r.slip_filename?.toLowerCase().endsWith('.pdf') ? (
                              <div className="text-center p-2">
                                <FileText className="w-10 h-10 text-rose-500 mx-auto mb-1" />
                                <span className="text-xs font-semibold text-slate-700 line-clamp-1">{r.slip_original_name || 'PDF Document'}</span>
                              </div>
                            ) : (
                              <img src={r.slip_url} alt="Slip" className="w-full h-full object-cover" />
                            )}
                          </div>
                        </div>
                        <a
                          href={r.slip_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-1.5 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          View Full Slip
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-10 text-slate-400 text-xs">
                      No payment slips uploaded for this customer.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Bottom Footer with Back Button */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Customer List</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
