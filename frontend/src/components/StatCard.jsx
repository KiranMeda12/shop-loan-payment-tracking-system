import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      glow: 'group-hover:border-blue-300'
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      glow: 'group-hover:border-emerald-300'
    },
    orange: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      glow: 'group-hover:border-amber-300'
    },
    red: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      glow: 'group-hover:border-rose-300'
    },
    navy: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-200',
      glow: 'group-hover:border-slate-400'
    }
  }[color] || {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    glow: 'group-hover:border-blue-300'
  };

  return (
    <div className={`group relative bg-white rounded-2xl border ${colorStyles.border} p-5 shadow-xs transition-all duration-200 hover:shadow-md ${colorStyles.glow}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`w-10 h-10 rounded-xl ${colorStyles.bg} ${colorStyles.text} flex items-center justify-center transition-transform group-hover:scale-105`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {subtitle && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            {trend && <span className="font-semibold">{trend}</span>}
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
