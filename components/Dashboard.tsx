
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { PILLARS } from '../constants';
import { Activity, Flame, Trophy, Zap, Settings, CalendarDays, Bot, Target, CheckCircle2, ArrowRight, PieChart, Plus } from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { PillWidget } from './PillWidget';
import { PillarType, AppTab } from '../types';
import { AudioService } from '../services/audioService';

interface Props {
  onNavigateToPillar: (pillar: PillarType) => void;
  onOpenSettings: () => void;
  onNavigateToTab: (tab: AppTab) => void;
  onQuickAdd: () => void;
}

export const Dashboard: React.FC<Props> = ({ onNavigateToPillar, onOpenSettings, onNavigateToTab, onQuickAdd }) => {
  const { stats, tasks, playerProfile, setWeeklyChallenge, completeWeeklyChallenge } = useGame();
  const { t, soundEnabled } = useSettings();
  
  const [challengeInput, setChallengeInput] = useState('');
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const showChallengeSelector = !stats.weeklyChallenge;

  const handleSetChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if(challengeInput.trim()) {
        if(soundEnabled) AudioService.playClick();
        setWeeklyChallenge(challengeInput);
        setChallengeInput('');
    }
  };

  const handleQuickAdd = () => {
      if(soundEnabled) AudioService.playClick();
      onQuickAdd();
  }

  const handleNavigatePillar = (id: PillarType) => {
      if(soundEnabled) AudioService.playTabSwitch();
      onNavigateToPillar(id);
  }

  return (
    // Replaced bg-game-black with bg-game-bg and text-white with text-game-text
    <div className="h-full overflow-y-auto no-scrollbar space-y-6 pb-32 animate-fade-in bg-game-bg text-game-text relative transition-colors duration-300">
      
      {/* Background Particles - Updated opacity for theme blend */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-1 h-1 bg-game-primary rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-game-accent rounded-full opacity-30 animate-pulse delay-700"></div>
          <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-game-primary rounded-full opacity-40 animate-pulse delay-1000"></div>
      </div>

      {/* Welcome & Header */}
      <div className="px-5 pt-6 flex justify-between items-start relative z-10">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                <p className="text-game-primary text-[10px] font-mono uppercase tracking-[0.2em]">{t('systemActive')}</p>
            </div>
            <h2 className="text-3xl font-black text-game-text tracking-tighter uppercase drop-shadow-md">
                {t('welcomeHunter')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-game-primary to-game-accent">{playerProfile?.name || 'Player'}</span>
            </h2>
        </div>
        <button onClick={onOpenSettings} className="p-2 bg-game-surface/80 backdrop-blur-md rounded-lg text-game-text-muted hover:text-game-text border border-game-border hover:border-game-primary transition-colors">
            <Settings size={20} />
        </button>
      </div>

      {/* 1️⃣ Weekly Challenge Section */}
      <div className="px-4 relative z-10">
        {showChallengeSelector && (
            <div className="bg-gradient-to-r from-game-surface-highlight to-game-surface border border-game-border p-5 rounded-lg shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-game-primary/10 rounded-full blur-[50px] group-hover:bg-game-primary/20 transition-colors"></div>
                
                <div className="flex items-center gap-2 mb-3 text-game-primary relative z-10">
                    <Target size={18} />
                    <h3 className="font-bold text-xs uppercase tracking-[0.15em]">{t('weeklyChallenge')}</h3>
                </div>
                <p className="text-xs text-game-text-muted mb-4 relative z-10 font-mono">{t('challengeDesc')} <span className="text-yellow-400 font-bold text-glow-gold">+500 XP</span>.</p>
                
                <form onSubmit={handleSetChallenge} className="flex gap-2 relative z-10">
                    <input 
                        type="text"
                        value={challengeInput}
                        onChange={(e) => setChallengeInput(e.target.value)}
                        placeholder={t('challengePlaceholder')}
                        className="flex-1 bg-game-bg/60 border border-game-border rounded-md px-4 py-3 text-sm text-game-text focus:border-game-primary outline-none placeholder:text-game-text-muted font-bold w-full"
                        maxLength={40}
                    />
                    <button 
                        type="submit"
                        disabled={!challengeInput.trim()}
                        className="bg-game-primary text-white px-4 rounded-md font-bold disabled:opacity-50 hover:bg-game-primary-dim transition-all"
                    >
                        <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        )}

        {/* Active/Completed Challenge */}
        {stats.weeklyChallenge && (
             <div className={`
                p-5 rounded-lg flex items-center justify-between shadow-lg border relative overflow-hidden transition-all
                ${stats.weeklyChallenge.completed 
                    ? 'bg-green-950/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                    : 'bg-game-surface/80 border-game-border'}
             `}>
                <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm border ${stats.weeklyChallenge.completed ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'}`}>
                            {stats.weeklyChallenge.completed ? t('missionComplete') : t('activeMission')}
                        </span>
                    </div>
                    <p className={`font-bold text-sm ${stats.weeklyChallenge.completed ? 'text-game-text-muted line-through' : 'text-game-text'}`}>
                        {stats.weeklyChallenge.title}
                    </p>
                </div>
                
                {!stats.weeklyChallenge.completed ? (
                    <button 
                        onClick={() => {
                            if(soundEnabled) AudioService.playClick();
                            completeWeeklyChallenge();
                        }}
                        className="relative z-10 bg-game-bg hover:bg-yellow-600 hover:text-black text-game-text-muted p-3 rounded-md transition-all border border-game-border hover:border-yellow-400"
                    >
                        <CheckCircle2 size={24} />
                    </button>
                ) : (
                    <div className="bg-green-500/10 border border-green-500/30 p-2 rounded-full text-green-500">
                        <CheckCircle2 size={24} />
                    </div>
                )}
             </div>
        )}
      </div>

      {/* Stats Grid - Responsive grid-cols */}
      <div className="px-4 grid grid-cols-2 gap-3 relative z-10">
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
                    colorClass: "bg-gradient-to-r from-yellow-600 to-yellow-400"
                }}
                variant="circular"
                borderColor="border-game-border"
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
                colorClass: "bg-gradient-to-r from-blue-600 to-blue-400"
            }}
            borderColor="border-game-border"
        />

        {/* Mini Widgets - Force col-span-1 on small screens if needed, but flex wrap helps */}
        <div className="col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
            <DashboardWidget 
                label={t('streak')}
                value={stats.streak}
                icon={Flame}
                iconColor="text-orange-500"
                borderColor="border-game-border"
            />
             <DashboardWidget 
                label={t('done')}
                value={completedTasksCount}
                icon={Activity}
                iconColor="text-emerald-500"
                borderColor="border-game-border"
            />
        </div>
      </div>

      {/* Quick Nav (The Dock) - Updated to use game-surface/bg */}
      <div className="px-4 relative z-10">
          <div className="bg-game-surface/60 backdrop-blur-md border border-game-border rounded-xl p-1 flex shadow-lg">
             <button onClick={() => onNavigateToTab(AppTab.PLANNER)} className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-game-bg/50 rounded-lg transition-colors group">
                <CalendarDays size={20} className="text-game-text-muted group-hover:text-game-primary transition-colors" />
                <span className="text-[9px] font-bold text-game-text-muted group-hover:text-game-text uppercase tracking-wider">{t('planner')}</span>
             </button>
             <div className="w-px bg-game-border my-2"></div>
             <button onClick={() => onNavigateToTab(AppTab.COACH)} className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-game-bg/50 rounded-lg transition-colors group">
                <Bot size={20} className="text-game-text-muted group-hover:text-purple-400 transition-colors" />
                <span className="text-[9px] font-bold text-game-text-muted group-hover:text-game-text uppercase tracking-wider">{t('coach')}</span>
             </button>
             <div className="w-px bg-game-border my-2"></div>
             <button onClick={() => onNavigateToTab(AppTab.STATS)} className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-game-bg/50 rounded-lg transition-colors group">
                <PieChart size={20} className="text-game-text-muted group-hover:text-green-400 transition-colors" />
                <span className="text-[9px] font-bold text-game-text-muted group-hover:text-game-text uppercase tracking-wider">{t('statistics')}</span>
             </button>
          </div>
      </div>

      {/* Pillars Preview List (Compact) */}
      <div className="px-4 pb-4 space-y-3 relative z-10 pb-safe">
         <div className="flex justify-between items-end border-b border-game-border pb-2 mb-2">
            <h3 className="text-xs font-black text-game-text-muted uppercase tracking-[0.2em]">{t('lifePillars')}</h3>
            <button onClick={() => onNavigateToTab(AppTab.PILLARS)} className="text-[10px] text-game-primary font-bold hover:text-game-accent uppercase tracking-widest">{t('viewAll')}</button>
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
                        onClick={() => handleNavigatePillar(pillar.id)}
                        variant="card"
                    />
                );
            })}
         </div>
      </div>

      {/* Quick Add FAB (Floating Action Button) - Safe Area Aware */}
      <button 
        onClick={handleQuickAdd}
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-6 w-14 h-14 bg-game-text text-game-bg rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 border-4 border-game-surface group"
      >
        <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

    </div>
  );
};
