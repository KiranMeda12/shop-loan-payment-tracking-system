import React, { useState, useEffect } from 'react';
import {
  Users,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ReceiptText,
  Filter,
  FileText,
  CreditCard,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import api, { formatCurrency, formatDate } from '../api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function DashboardView({
  onOpenAddModal,
  onOpenCustomerDetail,
  onOpenPaymentModal,
  onOpenSlipModal,
  refreshTrigger
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(''); // '' means full year
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const months = [
    { value: '', label: 'Full Year' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 16 }, (_, i) => currentYear - 10 + i); // 10 past + current + 5 future

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const params = { year: selectedYear };
      if (selectedMonth) params.month = selectedMonth;

      const res = await api.get('/reports/dashboard-stats', { params });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedMonth, refreshTrigger]);

  // Chart data preparation
  const statusColors = {
    'Paid': '#16a34a',
    'Partially Paid': '#0284c7',
    'Pending': '#ea580c',
    'Overdue': '#dc2626',
  };

  const doughnutData = (stats?.status_counts || []).map((sc) => ({
    name: sc.status,
    value: sc.count,
    amount: sc.total_amount,
    color: statusColors[sc.status] || '#64748b',
    percentage: sc.percentage,
  }));

  const hasStatusData = doughnutData.some((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dashboard Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            title="Refresh figures"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Customers */}
        <StatCard
          title="Total Customers"
          value={stats ? stats.total_customers : '0'}
          subtitle="Registered accounts"
          icon={Users}
          color="navy"
        />

        {/* 2. Total Amount to Pay */}
        <StatCard
          title="Total Credit Given"
          value={stats ? formatCurrency(stats.total_amount_to_pay) : '₹0.00'}
          subtitle="Loan/Credit disbursed"
          icon={Wallet}
          color="blue"
        />

        {/* 3. Total Amount Received */}
        <StatCard
          title="Total Collected"
          value={stats ? formatCurrency(stats.total_amount_received) : '₹0.00'}
          subtitle="Payments verified"
          icon={CheckCircle2}
          color="green"
        />

        {/* 4. Total Pending Amount */}
        <StatCard
          title="Pending Amount"
          value={stats ? formatCurrency(stats.total_pending_amount) : '₹0.00'}
          subtitle="Outstanding to collect"
          icon={AlertTriangle}
          color="orange"
        />

        {/* 5. Paid Payments % */}
        <StatCard
          title="Recovery Rate"
          value={stats ? `${stats.paid_percentage}%` : '0%'}
          subtitle="Of total loan collected"
          icon={TrendingUp}
          color="green"
        />

        {/* 6. Pending Payments % */}
        <StatCard
          title="Pending Rate"
          value={stats ? `${stats.pending_percentage}%` : '0%'}
          subtitle="Of total loan due"
          icon={Percent}
          color="red"
        />
      </div>

      {/* Charts Section: Doughnut + Monthly Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Overall Payment Status Doughnut (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Payment Status Breakdown</h3>
              <span className="text-[11px] font-semibold text-slate-400">By Record Count & Amount</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Distribution of all active credit records</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {hasStatusData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={doughnutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {doughnutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val} records (${item.payload.percentage}%) - ${formatCurrency(item.payload.amount)}`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                No payment record data available for selected period.
              </div>
            )}
          </div>

          {/* Status Legends */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
            {doughnutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span className="text-xs font-semibold text-slate-700">{d.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {d.value} <span className="text-[10px] text-slate-400 font-normal">({d.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Monthly Collection Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Collections & Loans ({selectedYear})</h3>
              <p className="text-xs text-slate-500">Collected repayments vs credit given per month (₹)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                Collected
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-blue-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                Loan Given
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.monthly_collections || []}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="loan_given" name="Loan Given" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Paid vs Pending visual bar comparison */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-700">Received: {stats?.paid_percentage || 0}%</span>
              <span className="text-rose-700">Outstanding: {stats?.pending_percentage || 0}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                style={{ width: `${stats?.paid_percentage || 0}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
              />
              <div
                style={{ width: `${stats?.pending_percentage || 0}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Customer Payment Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Payment Records</h3>
            <p className="text-xs text-slate-500">Latest credit entries and real-time status</p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            <span>+ Add New Entry</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Record ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Amount to Pay</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Slip Proof</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {stats?.recent_records?.length > 0 ? (
                stats.recent_records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {r.record_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(r.entry_date)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onOpenCustomerDetail(r.customer_id)}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left cursor-pointer"
                      >
                        {r.customer_name}
                      </button>
                      <div className="text-[11px] text-slate-500">{r.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(r.amount_to_pay)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                      {formatCurrency(r.amount_paid)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600">
                      {formatCurrency(r.remaining_balance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.slip_url ? (
                        <button
                          onClick={() => onOpenSlipModal(r)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          View Slip
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">No Slip</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {r.remaining_balance > 0 && (
                          <button
                            onClick={() => onOpenPaymentModal(r)}
                            title="Record Payment"
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => onOpenCustomerDetail(r.customer_id)}
                          title="View Ledger History"
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400">
                    No payment records found for this period. Click "+ Add Entry" to create your first customer credit record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
