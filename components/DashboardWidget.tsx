import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { CircularProgress } from './CircularProgress';

interface DashboardWidgetProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  iconColor: string;
  progress?: {
    current: number;
    max: number;
    colorClass: string;
  };
  variant?: 'linear' | 'circular';
  borderColor?: string;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor,
  progress,
  variant = 'linear',
  borderColor = 'border-neutral-800'
}) => {
  return (
    <div className={`bg-neutral-900 border ${borderColor} p-4 rounded-xl shadow-lg flex flex-col justify-between h-full relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
      {/* Background Icon */}
      <div className="absolute -top-2 -right-2 p-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <Icon size={80} />
      </div>
      
      <div className="flex items-center justify-between mb-2 z-10">
        <span className="text-neutral-400 text-xs font-black uppercase tracking-widest">{label}</span>
        <Icon className={iconColor} size={18} />
      </div>

      <div className="z-10 flex-1 flex flex-col justify-end">
        {variant === 'circular' && progress ? (
            <div className="flex justify-center py-2">
                <CircularProgress 
                    size={100} 
                    strokeWidth={8} 
                    percentage={(progress.current / progress.max) * 100} 
                    color={progress.colorClass.replace('bg-', 'text-')}
                >
                    <div className="text-center">
                        <p className="text-3xl font-black text-white leading-none">{value}</p>
                        {subValue && <span className="text-[10px] text-neutral-500 font-bold uppercase">{subValue}</span>}
                    </div>
                </CircularProgress>
                <div className="absolute bottom-2 right-4 text-[10px] text-neutral-500 font-mono">
                    {progress.current} / {progress.max} XP
                </div>
            </div>
        ) : (
            <>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-white">{value}</p>
                    {subValue && <span className="text-sm font-medium text-neutral-500">{subValue}</span>}
                </div>
                
                {progress && (
                    <div className="mt-3">
                        <ProgressBar 
                            current={progress.current} 
                            max={progress.max} 
                            colorClass={progress.colorClass} 
                            height="h-2" 
                            showText={false} 
                        />
                        <p className="text-[10px] text-right mt-1 text-neutral-500 font-mono">
                            {progress.current} / {progress.max}
                        </p>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};