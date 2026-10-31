import React, { useState, useEffect } from 'react';
import { Menu, Plus, Clock, Store, Calendar, ArrowLeft } from 'lucide-react';
import { formatDateTime } from '../api';

export default function Navbar({ currentView, onOpenAddModal, onToggleMobile, user, canGoBack, onGoBack }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const titles = {
    dashboard: { title: 'Financial Dashboard', subtitle: 'Overview of customer loans, collections and recovery' },
    records: { title: 'Customer Payment Records', subtitle: 'Manage individual customer credit, partial payments and slips' },
    customers: { title: 'Customer Directory', subtitle: 'Detailed customer account ledgers and previous statements' },
    reports: { title: 'Monthly Reports & Analytics', subtitle: 'Financial performance charts, PDF summaries & Excel export' },
    settings: { title: 'Settings & Database Backup', subtitle: 'Shop profile configuration and 1-click database backup' },
  };

  const currentInfo = titles[currentView] || titles.dashboard;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formattedTime = formatDateTime(time.toISOString());

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle + Back Button + Title */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMobile}
            className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Back Button — always visible when there's history */}
          {canGoBack && (
            <button
              onClick={onGoBack}
              title="Go Back to Previous Page"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-slate-600 font-semibold text-xs transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-snug">
              {currentInfo.title}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Date / Clock & Quick Add Button */}
        <div className="flex items-center gap-3">
          {/* Live Date / Time Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{dayNames[time.getDay()]}, {formattedTime}</span>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onOpenAddModal}
            className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Entry</span>
          </button>
        </div>
      </div>
    </header>
  );
}
