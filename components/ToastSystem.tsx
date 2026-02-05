import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle, AlertCircle, Info, Trophy, X, Medal, Ghost } from 'lucide-react';

export const ToastSystem: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`
            pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-pop
            ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-white' : ''}
            ${toast.type === 'info' ? 'bg-neutral-900/90 border-neutral-700 text-white' : ''}
            ${toast.type === 'level-up' ? 'bg-yellow-900/90 border-yellow-600 text-white' : ''}
            ${toast.type === 'badge' ? 'bg-emerald-900/90 border-emerald-600 text-white' : ''}
            ${toast.type === 'shadow' ? 'bg-purple-900/90 border-purple-600 text-white' : ''}
          `}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle className="text-green-400" size={20} />}
            {toast.type === 'error' && <AlertCircle className="text-red-400" size={20} />}
            {toast.type === 'info' && <Info className="text-blue-400" size={20} />}
            {toast.type === 'level-up' && <Trophy className="text-yellow-400 animate-bounce" size={24} />}
            {toast.type === 'badge' && <Medal className="text-emerald-400 animate-pulse" size={24} />}
            {toast.type === 'shadow' && <Ghost className="text-purple-400 animate-pulse" size={24} />}
            
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-white/50 hover:text-white">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};