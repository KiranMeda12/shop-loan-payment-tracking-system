import React from 'react';
import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  onConfirm,
  onCancel,
  loading,
  confirmColor = "rose",
  icon: CustomIcon
}) {
  if (!isOpen) return null;

  const isGreen = confirmColor === 'emerald';
  const IconComponent = CustomIcon || (isGreen ? CheckCircle2 : AlertTriangle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
          isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
              isGreen
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-500/20'
            }`}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                {isGreen ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
