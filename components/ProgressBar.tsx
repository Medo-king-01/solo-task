import React from 'react';

interface Props {
  current: number;
  max: number;
  colorClass: string;
  label?: string;
  height?: string;
  showText?: boolean;
}

export const ProgressBar: React.FC<Props> = ({ current, max, colorClass, label, height = 'h-4', showText = true }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className="w-full my-1">
      {label && (
        <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-widest text-neutral-400">
          <span>{label}</span>
          {showText && <span>{current} / {max}</span>}
        </div>
      )}
      <div className={`w-full bg-neutral-800 rounded-full overflow-hidden ${height} border border-neutral-700`}>
        <div
          className={`${height} ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};