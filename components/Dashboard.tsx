
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { PILLARS } from '../constants';
import { Activity, Flame, Trophy, Zap, Settings, CalendarDays, Bot, Target, CheckCircle2, ArrowRight, PieChart, Plus } from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { PillWidget } from './PillWidget';
import { PillarType, AppTab } from '../types';

interface Props {
  onNavigateToPillar: (pillar: PillarType) => void;
  onOpenSettings: () => void;
  onNavigateToTab: (tab: AppTab) => void;
  onQuickAdd: () => void;
}

export const Dashboard: React.FC<Props> = ({ onNavigateToPillar, onOpenSettings, onNavigateToTab, onQuickAdd }) => {
  const { stats, tasks, playerProfile, setWeeklyChallenge, completeWeeklyChallenge } = useGame();
  const { t } = useSettings();
  
  const [challengeInput, setChallengeInput] = useState('');
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const showChallengeSelector = !stats.weeklyChallenge;

  const handleSetChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if(challengeInput.trim()) {
        setWeeklyChallenge(challengeInput);
        setChallengeInput('');
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-5 pb-24 animate-fade-in bg-game-black">
      
      {/* Welcome & Header */}
      <div className="px-5 pt-4 flex justify-between items-start">
        <div>
            <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest mb-1">{t('welcomeHunter')}</p>
            <h2 className="text-3xl font-black text-white tracking-tighter">{playerProfile?.name || 'Player'}</h2>
        </div>
        <button onClick={onOpenSettings} className="p-2 bg-neutral-900 rounded-full text-neutral-500 hover:text-white border border-neutral-800">
            <Settings size={20} />
        </button>
      </div>

      {/* 1️⃣ Weekly Challenge Section */}
      <div className="px-4">
        {showChallengeSelector && (
            <div className="bg-gradient-to-r from-neutral-900 to-black border border-neutral-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-600/10 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-2 mb-3 text-yellow-500 relative z-10">
                    <Target size={20} />
                    <h3 className="font-bold text-sm uppercase tracking-wider">{t('weeklyChallenge')}</h3>
                </div>
                <p className="text-xs text-neutral-400 mb-4 relative z-10">{t('challengeDesc')} <span className="text-yellow-500 font-bold">+500 XP</span>.</p>
                
                <form onSubmit={handleSetChallenge} className="flex gap-2 relative z-10">
                    <input 
                        type="text"
                        value={challengeInput}
                        onChange={(e) => setChallengeInput(e.target.value)}
                        placeholder={t('challengePlaceholder')}
                        className="flex-1 bg-black/50 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:border-game-red outline-none placeholder:text-neutral-600"
                        maxLength={40}
                    />
                    <button 
                        type="submit"
                        disabled={!challengeInput.trim()}
                        className="bg-game-red text-white px-4 rounded-xl font-bold disabled:opacity-50 hover:bg-red-700 transition-colors"
                    >
                        <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        )}

        {/* Active/Completed Challenge */}
        {stats.weeklyChallenge && (
             <div className={`
                p-4 rounded-2xl flex items-center justify-between shadow-lg border relative overflow-hidden
                ${stats.weeklyChallenge.completed 
                    ? 'bg-green-950/30 border-green-900/50' 
                    : 'bg-neutral-900 border-yellow-900/30'}
             `}>
                <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${stats.weeklyChallenge.completed ? 'text-green-500' : 'text-yellow-500'}`}>
                            {stats.weeklyChallenge.completed ? t('missionComplete') : t('activeMission')}
                        </span>
                    </div>
                    <p className={`font-bold text-sm ${stats.weeklyChallenge.completed ? 'text-neutral-400 line-through' : 'text-white'}`}>
                        {stats.weeklyChallenge.title}
                    </p>
                </div>
                
                {!stats.weeklyChallenge.completed ? (
                    <button 
                        onClick={completeWeeklyChallenge}
                        className="relative z-10 bg-neutral-800 hover:bg-yellow-600 hover:text-black text-neutral-400 p-3 rounded-xl transition-all border border-neutral-700 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                    >
                        <CheckCircle2 size={24} />
                    </button>
                ) : (
                    <div className="bg-green-500/20 p-2 rounded-full text-green-500">
                        <CheckCircle2 size={24} />
                    </div>
                )}
             </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {/* Level Widget (Tall) */}
        <div className="col-span-1 row-span-2">
             <DashboardWidget 
                label={t('level')}
                value={stats.level}
                subValue={t('currentRank')}
                icon={Trophy}
                iconColor="text-yellow-500"
                progress={{
                    current: stats.currentXp,
                    max: stats.maxXp,
                    colorClass: "bg-game-red"
                }}
                variant="circular"
                borderColor="border-game-red/30"
            />
        </div>

        {/* Energy Widget */}
        <DashboardWidget 
            label={t('energy')}
            value={stats.energy}
            subValue={`/ ${stats.maxEnergy}`}
            icon={Zap}
            iconColor="text-blue-400"
            progress={{
                current: stats.energy,
                max: stats.maxEnergy,
                colorClass: "bg-blue-500"
            }}
        />

        {/* Mini Widgets */}
        <div className="grid grid-cols-2 gap-3">
            <DashboardWidget 
                label={t('streak')}
                value={stats.streak}
                icon={Flame}
                iconColor="text-orange-500"
            />
             <DashboardWidget 
                label={t('done')}
                value={completedTasksCount}
                icon={Activity}
                iconColor="text-emerald-500"
            />
        </div>
      </div>

      {/* Quick Nav */}
      <div className="px-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-1 flex">
             <button onClick={() => onNavigateToTab(AppTab.PLANNER)} className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-neutral-800 rounded-xl transition-colors">
                <CalendarDays size={20} className="text-neutral-400" />
                <span className="text-[10px] font-bold text-neutral-500">{t('planner')}</span>
             </button>
             <div className="w-px bg-neutral-800 my-2"></div>
             <button onClick={() => onNavigateToTab(AppTab.COACH)} className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-neutral-800 rounded-xl transition-colors">
                <Bot size={20} className="text-blue-400" />
                <span className="text-[10px] font-bold text-neutral-500">{t('coach')}</span>
             </button>
             <div className="w-px bg-neutral-800 my-2"></div>
             <button onClick={() => onNavigateToTab(AppTab.STATS)} className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-neutral-800 rounded-xl transition-colors">
                <PieChart size={20} className="text-purple-400" />
                <span className="text-[10px] font-bold text-neutral-500">{t('statistics')}</span>
             </button>
          </div>
      </div>

      {/* Pillars Preview List (Compact) */}
      <div className="px-4 pb-4 space-y-3">
         <div className="flex justify-between items-end border-b border-neutral-800 pb-2 mb-2">
            <h3 className="text-sm font-black text-neutral-300 uppercase tracking-widest">{t('lifePillars')}</h3>
            <button onClick={() => onNavigateToTab(AppTab.PILLARS)} className="text-xs text-game-red font-bold hover:underline">{t('viewAll')}</button>
         </div>
         
         <div className="grid grid-cols-1 gap-3">
            {/* Show only top 3 active or prioritized pillars to save space? Or all compacted. */}
            {PILLARS.slice(0, 3).map((pillar) => {
                const count = tasks.filter(t => t.pillar === pillar.id && !t.completed).length;
                return (
                    <PillWidget 
                        key={pillar.id}
                        pillarId={pillar.id} 
                        taskCount={count}
                        onClick={() => onNavigateToPillar(pillar.id)}
                        variant="card"
                    />
                );
            })}
         </div>
      </div>

      {/* Quick Add FAB */}
      <button 
        onClick={onQuickAdd}
        className="fixed bottom-24 left-6 w-14 h-14 bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 border-4 border-neutral-200"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

    </div>
  );
};
