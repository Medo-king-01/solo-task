
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { CheckCircle, AlertCircle, Info, Trophy, X, Medal, Ghost } from 'lucide-react';
import { ToastMessage, NotificationDuration } from '../types';

// Helper to get duration in ms
const getDuration = (setting: NotificationDuration): number => {
    switch (setting) {
        case 'short': return 3000;
        case 'medium': return 5000;
        case 'long': return 8000;
        case 'persistent': return 15000; // Very long but eventually dismisses if not critical
        default: return 5000;
    }
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void; durationSetting: NotificationDuration }> = ({ toast, onRemove, durationSetting }) => {
    const [isExiting, setIsExiting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const duration = getDuration(durationSetting);
    
    // Critical toasts do not respect the timer setting unless explicitly dismissed
    const isManual = toast.manualDismiss || durationSetting === 'persistent';

    const startTimer = () => {
        if (isManual) return; // Don't auto-dismiss critical or strictly persistent setting

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            triggerExit();
        }, duration);
    };

    const triggerExit = () => {
        setIsExiting(true);
        setTimeout(() => {
            onRemove(toast.id);
        }, 400); // Match animation duration
    };

    const handleMouseEnter = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        if (!isExiting) {
            startTimer();
        }
    };

    useEffect(() => {
        startTimer();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseEnter} // Pause on touch
            onTouchEnd={handleMouseLeave}
            className={`
                pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-500 transform
                ${isExiting ? 'opacity-0 translate-x-10 scale-95' : 'opacity-100 translate-x-0 scale-100 animate-slide-up'}
                ${toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-white' : ''}
                ${toast.type === 'hard-success' ? 'bg-emerald-900/90 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}
                ${toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : ''}
                ${toast.type === 'info' ? 'bg-neutral-900/90 border-neutral-700 text-white' : ''}
                ${toast.type === 'level-up' ? 'bg-yellow-900/90 border-yellow-600 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]' : ''}
                ${toast.type === 'badge' ? 'bg-emerald-900/90 border-emerald-600 text-white' : ''}
                ${toast.type === 'shadow' ? 'bg-purple-900/90 border-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : ''}
            `}
        >
            <div className="flex items-center gap-3">
                {toast.type === 'success' && <CheckCircle className="text-green-400" size={20} />}
                {toast.type === 'hard-success' && <CheckCircle className="text-emerald-300 animate-pulse" size={20} />}
                {toast.type === 'error' && <AlertCircle className="text-red-400 animate-pulse" size={20} />}
                {toast.type === 'info' && <Info className="text-blue-400" size={20} />}
                {toast.type === 'level-up' && <Trophy className="text-yellow-400 animate-bounce" size={24} />}
                {toast.type === 'badge' && <Medal className="text-emerald-400 animate-pulse" size={24} />}
                {toast.type === 'shadow' && <Ghost className="text-purple-400 animate-pulse" size={24} />}
                
                <p className="font-bold text-sm leading-tight">{toast.message}</p>
            </div>
            
            <button 
                onClick={triggerExit} 
                className={`ml-3 p-1 rounded-full transition-colors ${toast.type === 'error' || toast.type === 'level-up' ? 'bg-white/10 hover:bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
            >
                <X size={18} />
            </button>
        </div>
    );
};

export const ToastSystem: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const { notificationDuration } = useSettings();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem 
            key={toast.id} 
            toast={toast} 
            onRemove={removeToast} 
            durationSetting={notificationDuration}
        />
      ))}
    </div>
  );
};
