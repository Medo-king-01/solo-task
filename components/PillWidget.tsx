
import React from 'react';
import { PILLARS } from '../constants';
import { PillarType } from '../types';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';

interface Props {
  pillarId: PillarType;
  taskCount: number;
  onClick?: () => void;
  variant?: 'card' | 'header'; 
}

export const PillWidget: React.FC<Props> = ({ pillarId, taskCount, onClick, variant = 'card' }) => {
  const pillar = PILLARS.find(p => p.id === pillarId);
  const { t, language } = useSettings();
  const { tasks } = useGame();

  if (!pillar) return null;

  const isCard = variant === 'card';
  const colorName = pillar.color.split('-')[1]; // e.g., 'blue', 'green'
  
  // Dynamic Backgrounds based on variant
  const cardClasses = `
    relative overflow-hidden w-full text-right transition-all duration-300 group
    bg-gradient-to-br from-neutral-900 via-black to-black
    border border-neutral-800 rounded-2xl p-5
    hover:border-${colorName}-500/50 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-[1.01] active:scale-[0.99]
  `;

  const headerClasses = `
    relative w-full bg-gradient-to-b from-neutral-900 to-game-black
    border-b border-neutral-800 p-6 pb-12 pt-16
  `;

  // Calculate stats for this pillar
  const pillarTasks = tasks.filter(t => t.pillar === pillarId);
  const totalTasks = pillarTasks.length;
  const completedTasks = pillarTasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Translation key based on ID
  const translatedLabel = t(pillar.id.toLowerCase() as any);

  return (
    <button 
      onClick={onClick}
      disabled={!onClick}
      className={isCard ? cardClasses : headerClasses}
    >
      {/* Decorative Background Blob */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${colorName}-600/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2`} />

      {/* Giant Icon Watermark */}
      <div className={`absolute ${isCard ? '-left-4 -bottom-4 opacity-5 rotate-12 group-hover:opacity-10' : 'left-4 top-1/2 -translate-y-1/2 opacity-5 scale-150'} transition-all duration-500`}>
        <pillar.icon size={isCard ? 100 : 140} />
      </div>

      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-4 w-full">
            {/* Icon Container */}
            <div className={`
                flex items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:rotate-6
                ${isCard ? 'p-3 w-14 h-14' : 'p-4 w-16 h-16'}
                bg-neutral-900/50 backdrop-blur-md border border-neutral-700/50 ${pillar.color}
                shadow-[0_4px_20px_rgba(0,0,0,0.3)]
            `}>
                <pillar.icon size={isCard ? 28 : 32} />
            </div>
            
            {/* Text & Stats */}
            <div className="flex-1">
                <h3 className={`font-black text-white leading-tight uppercase tracking-tight ${isCard ? 'text-xl' : 'text-3xl mb-1'}`}>
                    {translatedLabel}
                </h3>
                
                {isCard && (
                    <div className="flex items-center gap-3 mt-1">
                        {taskCount > 0 ? (
                            <span className="text-xs font-bold text-white bg-red-600/20 text-red-400 px-2 py-0.5 rounded border border-red-900/30">
                                {taskCount} {t('active')}
                            </span>
                        ) : (
                            <span className="text-xs font-medium text-neutral-500">{t('noTasks')}</span>
                        )}
                        {totalTasks > 0 && (
                            <span className="text-[10px] text-neutral-600 font-mono">
                                {t('total')}: {totalTasks}
                            </span>
                        )}
                    </div>
                )}
                
                {!isCard && (
                    <div className="flex items-center gap-2 text-neutral-400 text-sm font-medium">
                        <span>{t('lvl')} {Math.floor(completedTasks / 10) + 1}</span>
                        <span className="w-1 h-1 bg-neutral-600 rounded-full"></span>
                        <span>{progress.toFixed(0)}% {t('completed')}</span>
                    </div>
                )}
            </div>
        </div>
        
        {/* Navigation Arrow (Card Only) */}
        {isCard && (
            <div className={`
                p-2 rounded-full border border-neutral-800 bg-neutral-900/50 text-neutral-500
                group-hover:bg-neutral-800 group-hover:text-white group-hover:border-neutral-600 transition-all
                ${language === 'en' ? 'rotate-180' : ''}
            `}>
                <ChevronLeft size={20} />
            </div>
        )}
      </div>

      {/* Progress Bar (Visual Flair) */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-800/50">
        <div 
            className={`h-full bg-${colorName}-500 transition-all duration-700 ease-out`} 
            style={{ width: `${progress}%` }} 
        />
      </div>
    </button>
  );
};
