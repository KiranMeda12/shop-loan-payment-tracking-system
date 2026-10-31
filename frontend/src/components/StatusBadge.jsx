import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const isSmall = size === 'sm';
  const px = isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'Paid':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 ${px}`}>
          <CheckCircle2 className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Paid
        </span>
      );
    case 'Partially Paid':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 text-sky-700 ${px}`}>
          <Clock className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Partially Paid
        </span>
      );
    case 'Overdue':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 text-rose-700 ${px}`}>
          <AlertCircle className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Overdue
        </span>
      );
    case 'Pending':
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 text-amber-700 ${px}`}>
          <AlertTriangle className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
          Pending
        </span>
      );
  }
}
