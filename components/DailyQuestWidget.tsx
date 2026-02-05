
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DAILY_QUEST_TARGETS } from '../constants';
import { Check, Info, ChevronDown, ChevronUp } from 'lucide-react';
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
        <div className="flex items-center justify-between py-2 border-b border-blue-500/30 last:border-0">
            <span className="text-blue-100 font-bold text-sm tracking-wide">{label}</span>
            <div className="flex items-center gap-3">
                <span className={`font-mono text-sm ${isDone ? 'text-green-400' : 'text-blue-300'}`}>
                    [{current} / {target}]
                </span>
                {!isDone && (
                    <button 
                        onClick={() => increment(5)}
                        className="bg-blue-900/50 hover:bg-blue-700/50 border border-blue-500/50 text-blue-200 text-xs px-2 py-1 rounded"
                    >
                        +5
                    </button>
                )}
                {isDone && <Check size={16} className="text-green-400" />}
            </div>
        </div>
    );
  };

  return (
    <div className="relative mx-4 mt-4 mb-6">
        {/* System Window Frame */}
        <div className="bg-black/80 border-2 border-blue-500/50 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.2)] overflow-hidden backdrop-blur-sm">
            
            {/* Header */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-900/40 p-3 flex items-center justify-between cursor-pointer hover:bg-blue-900/60 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Info size={18} className="text-blue-400" />
                    <h3 className="text-blue-400 font-black tracking-[0.1em] uppercase text-sm">QUEST INFO</h3>
                </div>
                {isOpen ? <ChevronUp className="text-blue-400" size={16} /> : <ChevronDown className="text-blue-400" size={16} />}
            </div>

            {isOpen && (
                <div className="p-4 animate-fade-in">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-black text-blue-100 uppercase tracking-widest text-shadow-blue">
                            Strength Training
                        </h2>
                        <p className="text-[10px] text-blue-400 uppercase mt-1">Difficulty: E-Rank</p>
                    </div>

                    {!quest.isCompleted ? (
                        <>
                            <div className="text-xs text-blue-300 mb-4 text-center leading-relaxed">
                                <span className="block mb-2 font-bold text-red-400">WARNING:</span>
                                Failure to complete the daily quest will result in a penalty mission.
                            </div>

                            <div className="space-y-1 bg-black/40 p-2 rounded border border-blue-900/30">
                                {renderRow("PUSH-UPS", 'pushups', DAILY_QUEST_TARGETS.pushups)}
                                {renderRow("SIT-UPS", 'situps', DAILY_QUEST_TARGETS.situps)}
                                {renderRow("SQUATS", 'squats', DAILY_QUEST_TARGETS.squats)}
                                {renderRow("RUN (KM)", 'run', DAILY_QUEST_TARGETS.run)}
                            </div>
                        </>
                    ) : (
                        <div className="py-6 text-center animate-pulse">
                            <h3 className="text-2xl font-black text-green-400 uppercase tracking-widest mb-2">
                                QUEST COMPLETED
                            </h3>
                            <p className="text-xs text-blue-300">
                                Rewards have been delivered.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {/* Decorative corner pieces for "System" feel */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-400"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-400"></div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400"></div>
    </div>
  );
};
