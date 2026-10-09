import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAuditStore } from '../store/useAuditStore';

export const Toast: React.FC = () => {
  const { toast, setToast } = useAuditStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'error':
        return 'bg-rose-950/90 text-rose-200 border-rose-800 shadow-rose-950/50';
      case 'success':
        return 'bg-emerald-950/90 text-emerald-200 border-emerald-800 shadow-emerald-950/50';
      default:
        return 'bg-sky-950/90 text-sky-200 border-sky-800 shadow-sky-950/50';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-xs max-w-md ${getStyle()}`}
      >
        {getIcon()}
        <span className="flex-1 font-medium">{toast.text}</span>
        <button
          onClick={() => setToast(null)}
          className="p-1 hover:opacity-75 rounded transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
