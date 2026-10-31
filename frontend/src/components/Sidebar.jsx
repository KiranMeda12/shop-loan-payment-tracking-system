import React from 'react';
import { LayoutDashboard, ReceiptText, Users, BarChart3, Settings, Plus, LogOut, ShieldCheck, Store, X } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, onOpenAddModal, user, onLogout, isMobileOpen, setIsMobileOpen }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'records', label: 'Payment Records', icon: ReceiptText },
    { id: 'customers', label: 'Customer Directory', icon: Users },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  const handleNavClick = (id) => {
    setCurrentView(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 font-black text-xl">
            ₹
          </div>
          <div>
            <div className="text-white font-extrabold text-base tracking-tight leading-none flex items-center gap-1.5">
              <span>ShopCredit</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">PRO</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium truncate max-w-[150px]">
              {user?.shop_name || 'Loan & Payment Tracking'}
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {setIsMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Action Button */}
      <div className="p-4">
        <button
          onClick={() => {
            onOpenAddModal();
            if (setIsMobileOpen) setIsMobileOpen(false);
          }}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Customer Entry</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Shop Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center shrink-0 border border-slate-700">
              <Store className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user?.username || 'Admin'}</div>
              <div className="text-[10px] text-slate-400 truncate">Shop Owner</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/90 bg-emerald-950/30 border border-emerald-800/30 rounded-lg px-2 py-1">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Connected to MySQL Database</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
