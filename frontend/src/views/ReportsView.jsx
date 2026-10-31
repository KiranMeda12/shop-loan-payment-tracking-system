import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Users,
  Wallet,
  ArrowRight,
  Filter,
  BarChart3
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
import api, { formatCurrency, downloadFile } from '../api';
import StatCard from '../components/StatCard';

export default function ReportsView() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [filterMode, setFilterMode] = useState('month'); // 'month' | 'custom'
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 16 }, (_, i) => currentYear - 10 + i); // 10 past + current + 5 future

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterMode === 'month') {
        params.year = selectedYear;
        if (selectedMonth) params.month = selectedMonth;
      } else {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }

      const res = await api.get('/reports/monthly-analytics', { params });
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load report analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filterMode, selectedYear, selectedMonth, startDate, endDate]);

  const handleDownloadPdf = async () => {
    let url = `/reports/monthly-pdf?year=${selectedYear}`;
    if (selectedMonth) url += `&month=${selectedMonth}`;
    await downloadFile(url, `Financial_Report_${selectedYear}.pdf`);
  };

  const handleExportExcel = async () => {
    let url = `/reports/excel?year=${selectedYear}`;
    if (selectedMonth) url += `&month=${selectedMonth}`;
    await downloadFile(url, `Shop_Credit_Records_${selectedYear}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  // 4. Payment Percentage Data (Radial/bar format)
  const percentageData = [
    { name: 'Collected', value: report?.collection_percentage || 0, color: '#10b981' },
    { name: 'Outstanding', value: report?.outstanding_percentage || 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'month' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month & Year
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'custom' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Range
            </button>
          </div>

          {filterMode === 'month' ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-800 font-semibold"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-800 font-semibold"
              />
            </div>
          )}
        </div>

        {/* Action Buttons: PDF, Excel, Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 Required Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Total Amount Due */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">1. Total Due</span>
          <div className="text-base font-bold text-slate-900 mt-1">{report ? formatCurrency(report.total_due) : '₹0'}</div>
        </div>

        {/* 2. Total Collected */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase block">2. Collected</span>
          <div className="text-base font-bold text-emerald-700 mt-1">{report ? formatCurrency(report.total_collected) : '₹0'}</div>
        </div>

        {/* 3. Total Pending */}
        <div className="bg-white rounded-2xl border border-amber-100 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase block">3. Pending</span>
          <div className="text-base font-bold text-amber-700 mt-1">{report ? formatCurrency(report.total_pending) : '₹0'}</div>
        </div>

        {/* 4. Number of Customers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block">4. Customers</span>
          <div className="text-base font-bold text-slate-900 mt-1">{report ? report.total_customers : 0}</div>
        </div>

        {/* 5. Fully Paid Records */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase block">5. Fully Paid</span>
          <div className="text-base font-bold text-emerald-700 mt-1">{report ? report.fully_paid_count : 0}</div>
        </div>

        {/* 6. Partially Paid Records */}
        <div className="bg-white rounded-2xl border border-sky-100 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-sky-600 uppercase block">6. Partial Paid</span>
          <div className="text-base font-bold text-sky-700 mt-1">{report ? report.partially_paid_count : 0}</div>
        </div>

        {/* 7. Pending Records */}
        <div className="bg-white rounded-2xl border border-amber-100 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase block">7. Pending</span>
          <div className="text-base font-bold text-amber-700 mt-1">{report ? report.pending_count : 0}</div>
        </div>

        {/* 8. Overdue Records */}
        <div className="bg-white rounded-2xl border border-rose-100 p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase block">8. Overdue</span>
          <div className="text-base font-bold text-rose-600 mt-1">{report ? report.overdue_count : 0}</div>
        </div>
      </div>

      {/* 5 Required Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Payment Status Doughnut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">1. Payment Status Doughnut</h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Chart 1</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Paid vs Pending vs Partially Paid vs Overdue</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report?.payment_status_doughnut || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(report?.payment_status_doughnut || []).map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, item) => [
                    `${val} records (${item.payload.percentage}%) - ${formatCurrency(item.payload.amount)}`,
                    name
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            {(report?.payment_status_doughnut || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="font-semibold text-slate-700 text-[11px]">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 text-[11px]">
                  {item.value} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Monthly Collection Bar Chart (January to December) (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">2. Monthly Collection Bar Chart</h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Chart 2</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">January to December collections for {selectedYear} (₹)</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report?.monthly_collection_chart || []}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
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
                  formatter={(val) => [formatCurrency(val), 'Collected']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Annual Trend Overview</span>
            <span className="text-emerald-600 font-bold">12 Months Verified Activity</span>
          </div>
        </div>
      </div>

      {/* Row 2 of Charts: Charts 3, 4, 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 3: Yearly Collection Comparison Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">3. Yearly Collection Comparison</h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Chart 3</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Compare collected vs due across years</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report?.yearly_collection_chart || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="due" name="Total Due" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Multi-year financial comparison
          </div>
        </div>

        {/* Chart 4: Payment Percentage Chart (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">4. Recovery %</h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Chart 4</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Collection % vs Outstanding %</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={percentageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-emerald-600">{report?.collection_percentage || 0}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Recovered</span>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Collection:
              </span>
              <span className="font-bold text-slate-900">{report?.collection_percentage || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Outstanding:
              </span>
              <span className="font-bold text-slate-900">{report?.outstanding_percentage || 0}%</span>
            </div>
          </div>
        </div>

        {/* Chart 5: Customer Payment Chart (Compare Customer Payments) (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">5. Customer Payment Comparison</h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Chart 5</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Paid vs Pending for top customer loans</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(report?.top_customer_payments || []).slice(0, 6)}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
                />
                <YAxis
                  dataKey="customer_name"
                  type="category"
                  tick={{ fontSize: 10, fill: '#1e293b' }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="amount_paid" name="Paid (₹)" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="remaining_balance" name="Balance Due (₹)" fill="#f97316" stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            Top customer credit accounts comparison
          </div>
        </div>
      </div>
    </div>
  );
}
