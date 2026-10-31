import React, { useState, useEffect } from 'react';
import { Search, Users, Phone, Calendar, ArrowUpRight, Download, FileText, ChevronRight, X, Trash2 } from 'lucide-react';
import api, { formatCurrency, formatDate, downloadFile } from '../api';
import ConfirmModal from '../components/ConfirmModal';

export default function CustomersView({ onOpenCustomerDetail, refreshTrigger }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/customers', { params });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, refreshTrigger]);

  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/customers/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete customer.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadPdf = async (customer) => {
    await downloadFile(`/customers/${customer.id}/statement-pdf`, `Statement_${customer.name.replace(/\s+/g, '_')}.pdf`);
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.remaining_balance || 0), 0);
  const totalCredit = customers.reduce((sum, c) => sum + (c.total_amount_to_pay || 0), 0);
  const totalCollected = customers.reduce((sum, c) => sum + (c.total_amount_paid || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Active Customers</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Total Recovered</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totalCollected)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-rose-100 p-4 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 uppercase">Total Outstanding Balance</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(totalOutstanding)}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by name or phone number..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-xs text-slate-900 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Phone Number</th>
                <th className="px-5 py-3.5 text-center">Entries</th>
                <th className="px-5 py-3.5 text-right">Total Credit Given</th>
                <th className="px-5 py-3.5 text-right">Total Received</th>
                <th className="px-5 py-3.5 text-right">Balance Due</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-slate-500 font-medium">Loading customers...</p>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                          {c.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <button
                            onClick={() => onOpenCustomerDetail(c.id)}
                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left cursor-pointer"
                          >
                            {c.name}
                          </button>
                          <div className="text-[11px] text-slate-500">Since {formatDate(c.created_at)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {c.phone}
                    </td>

                    <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                      {c.records_count}
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(c.total_amount_to_pay)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                      {formatCurrency(c.total_amount_paid)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-black text-rose-600">
                      {formatCurrency(c.remaining_balance)}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Download Statement PDF */}
                        <button
                          onClick={() => handleDownloadPdf(c)}
                          title="Download PDF Statement"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* View Ledger */}
                        <button
                          onClick={() => onOpenCustomerDetail(c.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Ledger</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Customer Button */}
                        <button
                          onClick={() => setDeleteTarget(c)}
                          title="Delete Customer"
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400">
                    No customers found. When you add a payment entry, customers will automatically appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Customer Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Customer Account?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently delete this customer along with all their previous loan records and payment history. Please confirm by pressing Yes.`}
        confirmText="Yes, Delete Customer"
        loading={deleteLoading}
        onConfirm={handleDeleteCustomer}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
