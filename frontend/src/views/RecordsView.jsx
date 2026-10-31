import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  Download,
  Calendar,
  X
} from 'lucide-react';
import api, { formatCurrency, formatDate } from '../api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import EditRecordModal from '../components/EditRecordModal';

export default function RecordsView({
  onOpenAddModal,
  onOpenCustomerDetail,
  onOpenPaymentModal,
  onOpenSlipModal,
  refreshTrigger,
  onRecordChanged
}) {
  const currentYear = new Date().getFullYear();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'All') params.status_filter = statusFilter;
      if (selectedYear) params.year = selectedYear;
      if (selectedMonth) params.month = selectedMonth;

      const res = await api.get('/records', { params });
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search, statusFilter, selectedYear, selectedMonth, refreshTrigger]);

  const handleMarkAsPaid = async (record) => {
    try {
      await api.post(`/records/${record.id}/pay-full`, {
        payment_method: 'Cash',
        notes: 'Marked full payment by owner',
      });
      fetchRecords();
      if (onRecordChanged) onRecordChanged();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to mark as paid');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/records/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchRecords();
      if (onRecordChanged) onRecordChanged();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete record');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportExcel = () => {
    let url = '/api/reports/excel?';
    if (statusFilter !== 'All') url += `status_filter=${statusFilter}&`;
    if (selectedYear) url += `year=${selectedYear}&`;
    if (selectedMonth) url += `month=${selectedMonth}&`;
    window.open(url, '_blank');
  };

  const statusTabs = ['All', 'Paid', 'Partially Paid', 'Pending', 'Overdue'];

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone or record ID..."
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export to Excel</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="">All Years</option>
              {[currentYear - 2, currentYear - 1, currentYear].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Records Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Record ID</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Customer Name</th>
                <th className="px-4 py-3.5">Phone Number</th>
                <th className="px-4 py-3.5 text-right">Amount to Pay</th>
                <th className="px-4 py-3.5 text-right">Paid Amount</th>
                <th className="px-4 py-3.5 text-right">Balance Due</th>
                <th className="px-4 py-3.5 text-center">Payment Slip</th>
                <th className="px-4 py-3.5 text-center">Payment Status</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-16">
                    <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-slate-500 font-medium">Loading records...</p>
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    {/* Record ID */}
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {r.record_id}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                      {formatDate(r.entry_date)}
                    </td>

                    {/* Customer Name */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onOpenCustomerDetail(r.customer_id)}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left cursor-pointer"
                      >
                        {r.customer_name}
                      </button>
                    </td>

                    {/* Phone Number */}
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {r.customer_phone}
                    </td>

                    {/* Amount to Pay */}
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(r.amount_to_pay)}
                    </td>

                    {/* Amount Paid */}
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {formatCurrency(r.amount_paid)}
                    </td>

                    {/* Remaining Balance */}
                    <td className="px-4 py-3 text-right font-black text-rose-600">
                      {formatCurrency(r.remaining_balance)}
                    </td>

                    {/* Slip */}
                    <td className="px-4 py-3 text-center">
                      {r.slip_url ? (
                        <button
                          onClick={() => onOpenSlipModal(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          View Slip
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenSlipModal(r)}
                          className="text-slate-400 hover:text-blue-600 text-[11px] hover:underline cursor-pointer"
                        >
                          + Attach
                        </button>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Record Partial Payment */}
                        {r.remaining_balance > 0 && (
                          <button
                            onClick={() => onOpenPaymentModal(r)}
                            title="Record Partial Payment"
                            className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Pay Part
                          </button>
                        )}

                        {/* Mark Fully Paid */}
                        {r.remaining_balance > 0 && (
                          <button
                            onClick={() => handleMarkAsPaid(r)}
                            title="Mark as Fully Paid"
                            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* View Ledger */}
                        <button
                          onClick={() => onOpenCustomerDetail(r.customer_id)}
                          title="Customer Ledger Statement"
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Record */}
                        <button
                          onClick={() => setEditTarget(r)}
                          title="Edit Record"
                          className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Record */}
                        <button
                          onClick={() => setDeleteTarget(r)}
                          title="Delete Record"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-16 text-slate-400">
                    No payment records matched your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Payment Record?"
        message={`Are you sure you want to delete Record ${deleteTarget?.record_id} for ${deleteTarget?.customer_name}? This action cannot be undone.`}
        confirmText="Confirm Delete"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Edit Record Modal */}
      <EditRecordModal
        isOpen={Boolean(editTarget)}
        record={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          fetchRecords();
          if (onRecordChanged) onRecordChanged();
        }}
      />
    </div>
  );
}
