
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DAILY_QUEST_TARGETS } from '../constants';
import { Check, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { DailyQuestProgress } from '../types';

export const DailyQuestWidget: React.FC = () => {
  const { stats, updateDailyQuest } = useGame();
  const quest = stats.dailyQuest;
  const [isOpen, setIsOpen] = useState(true);

  if (!quest) return null;

  const renderRow = (label: string, key: keyof Omit<DailyQuestProgress, 'isCompleted' | 'lastResetDate'>, target: number) => {
    const current = quest[key];
    const isDone = current >= target;

    const increment = (amount: number) => {
        if (isDone || quest.isCompleted) return;
        updateDailyQuest(key, current + amount);
    };

    return (
        <div className="flex items-center justify-between py-2 border-b border-blue-500/20 last:border-0 group hover:bg-blue-500/5 transition-colors px-2 rounded">
            <span className="text-blue-100 font-bold text-xs tracking-wider uppercase font-mono">{label}</span>
            <div className="flex items-center gap-3">
                <span className={`font-mono text-xs ${isDone ? 'text-green-400 text-glow-green' : 'text-blue-300'}`}>
                    [{current}/{target}]
                </span>
                {!isDone && (
                    <button 
                        onClick={() => increment(5)}
                        className="bg-blue-600/20 hover:bg-blue-500/40 border border-blue-500/50 text-blue-200 text-[10px] px-2 py-1 rounded transition-all active:scale-95"
                    >
                        +5
                    </button>
                )}
                {isDone && <Check size={14} className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" />}
            </div>
        </div>
    );
  };

  return (
    <div className="relative mx-4 mt-4 mb-6 perspective-1000">
        {/* System Window Frame (Glassmorphism + Neon Blue) */}
        <div className={`
            system-window rounded-none transition-all duration-500 overflow-hidden
            ${isOpen ? 'max-h-[400px]' : 'max-h-[50px]'}
        `}>
            
            {/* Header */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gradient-to-r from-blue-900/40 to-transparent p-3 flex items-center justify-between cursor-pointer border-b border-blue-500/30"
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-yellow-500 animate-pulse" />
                    <h3 className="text-white font-black tracking-[0.2em] uppercase text-xs text-glow-blue">QUEST INFO</h3>
                </div>
                {isOpen ? <ChevronUp className="text-blue-400" size={16} /> : <ChevronDown className="text-blue-400" size={16} />}
            </div>

            {/* Content Area */}
            <div className={`p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Quest Title */}
                <div className="text-center mb-4 relative">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest font-sans drop-shadow-md">
                        Strength Training
                    </h2>
                    <p className="text-[9px] text-blue-400 uppercase tracking-[0.3em] mt-1">Difficulty: E-Rank</p>
                    
                    {/* Decorative Lines */}
                    <div className="absolute top-1/2 left-0 w-8 h-px bg-blue-500/50"></div>
                    <div className="absolute top-1/2 right-0 w-8 h-px bg-blue-500/50"></div>
                </div>

                {!quest.isCompleted ? (
                    <>
                        <div className="text-[10px] text-neutral-300 mb-4 text-center font-mono bg-black/30 p-2 rounded border border-white/5">
                            <span className="text-red-500 font-bold block mb-1">[GOAL]</span>
                            Complete the daily workout to recover Player status.
                        </div>

                        <div className="space-y-1">
                            {renderRow("PUSH-UPS", 'pushups', DAILY_QUEST_TARGETS.pushups)}
                            {renderRow("SIT-UPS", 'situps', DAILY_QUEST_TARGETS.situps)}
                            {renderRow("SQUATS", 'squats', DAILY_QUEST_TARGETS.squats)}
                            {renderRow("RUN (KM)", 'run', DAILY_QUEST_TARGETS.run)}
                        </div>
                        
                        <div className="mt-4 pt-2 border-t border-red-900/30 text-center">
                             <p className="text-[9px] text-red-400/80 font-mono uppercase tracking-widest animate-pulse">
                                Failure Penalty: Sent to Penalty Zone
                             </p>
                        </div>
                    </>
                ) : (
                    <div className="py-4 text-center">
                        <div className="inline-block p-3 rounded-full bg-green-500/10 border border-green-500/50 mb-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                            <Check size={32} className="text-green-400" />
                        </div>
                        <h3 className="text-lg font-black text-green-400 uppercase tracking-widest mb-1 text-glow-green">
                            QUEST COMPLETED
                        </h3>
                        <p className="text-[10px] text-blue-300 font-mono">
                            Rewards have been delivered to inventory.
                        </p>
                    </div>
                )}
            </div>
        </div>
        
        {/* Decorative "Hologram" Corners */}
        <div className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-blue-400"></div>
        <div className="absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2 border-blue-400"></div>
        <div className="absolute -bottom-px -left-px w-2 h-2 border-b-2 border-l-2 border-blue-400"></div>
        <div className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-blue-400"></div>
    </div>
  );
};
