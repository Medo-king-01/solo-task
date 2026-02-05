
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { User, Activity, Brain, TrendingUp, History, Shield, Sword, Eye, Wind, ChevronDown, ChevronUp, Calendar, Trophy, Award, Zap, Target } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { WeeklyRating, MonthlyRating } from '../types';

export const StatisticsScreen: React.FC = () => {
  const { stats, playerProfile, weeklyHistory, monthlyHistory, weeklyReports, monthlyReports } = useGame();
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState<'STATUS' | 'HISTORY'>('STATUS');
  const [historyView, setHistoryView] = useState<'WEEKS' | 'MONTHS'>('WEEKS');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // --- Data Preparation for Charts ---
  const weeklyChartData = useMemo(() => {
    return weeklyHistory.map(w => ({
        name: `W${w.weekIndexInMonth}`, // Short name for axis
        xp: w.totalXP,
        tasks: w.tasksCompleted,
        fullDate: w.startDate
    })).slice(-8); // Last 8 weeks
  }, [weeklyHistory]);

  const monthlyChartData = useMemo(() => {
    return monthlyHistory.map(m => ({
        name: m.monthId.split('-')[1], // Month number
        xp: m.totalXP,
        consistency: m.consistencyRate
    })).slice(-6); // Last 6 months
  }, [monthlyHistory]);

  // --- Helper for Hunter Stats Radar ---
  // Memoized to prevent re-animation on every render
  const hunterData = useMemo(() => [
    { subject: t('str'), A: stats.hunterAttributes.strength, fullMark: 100 },
    { subject: t('vit'), A: stats.hunterAttributes.vitality, fullMark: 100 },
    { subject: t('agi'), A: stats.hunterAttributes.agility, fullMark: 100 },
    { subject: t('int'), A: stats.hunterAttributes.intelligence, fullMark: 100 },
    { subject: t('sense'), A: stats.hunterAttributes.sense, fullMark: 100 },
  ], [stats.hunterAttributes, t]);

  const getRankTitle = (level: number) => {
      if (level >= 100) return t('rank_ss');
      if (level >= 80) return t('rank_s');
      if (level >= 60) return t('rank_a');
      if (level >= 40) return t('rank_b');
      if (level >= 20) return t('rank_c');
      if (level >= 10) return t('rank_d');
      return t('rank_e');
  };

  const getRatingColor = (rating: WeeklyRating | MonthlyRating) => {
      switch(rating) {
          case 'Excellent': case 'Legend': return 'text-yellow-500 border-yellow-500/50 bg-yellow-900/10';
          case 'Consistent': case 'Grinder': return 'text-emerald-500 border-emerald-500/50 bg-emerald-900/10';
          case 'Unstable': case 'Survivor': return 'text-orange-500 border-orange-500/50 bg-orange-900/10';
          default: return 'text-neutral-500 border-neutral-700 bg-neutral-900';
      }
  };

  // --- Render Functions ---

  const renderStatusTab = () => (
    <div className="space-y-4 animate-slide-up pb-6">
        {/* Hunter ID Card */}
        <div className="bg-neutral-900 border-2 border-neutral-700 rounded-xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 bg-blue-600/20 px-3 py-1 rounded-bl-xl border-b border-l border-blue-500/30">
                <span className="text-[10px] font-mono text-blue-400">HUNTER ASSOCIATION</span>
            </div>

            <div className="p-6 flex flex-col items-center border-b border-neutral-800 relative z-10">
                <div className="w-24 h-24 bg-neutral-800 rounded-full border-2 border-game-red flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(220,38,38,0.4)] relative">
                    <User size={40} className="text-game-red" />
                    {/* Level Badge */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-neutral-900 rounded-full border border-game-red flex items-center justify-center">
                        <span className="text-xs font-black text-white">{stats.level}</span>
                    </div>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{playerProfile?.name}</h2>
                <span className="text-xs text-game-red font-bold uppercase tracking-[0.2em]">{t('jobTitle')}</span>
                <div className="mt-2 px-3 py-1 bg-neutral-800 rounded text-xs font-bold text-neutral-400 border border-neutral-700">
                    {getRankTitle(stats.level)}
                </div>
            </div>
             
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-game-red via-transparent to-transparent" />

            <div className="p-4 grid grid-cols-2 gap-4 text-sm bg-black/20">
                 <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">{t('level')}</span>
                    <span className="font-mono text-xl text-white font-black">{stats.level}</span>
                 </div>
                 <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">{t('job')}</span>
                    <span className="font-mono text-sm text-white font-bold">Necromancer</span>
                 </div>
                 <div className="col-span-2">
                    <ProgressBar 
                        current={stats.currentXp} 
                        max={stats.maxXp} 
                        colorClass="bg-game-red" 
                        label="XP PROGRESS" 
                        height="h-3"
                    />
                 </div>
                 <div className="col-span-2">
                    <ProgressBar 
                        current={stats.energy} 
                        max={stats.maxEnergy} 
                        colorClass="bg-blue-500" 
                        label="HP (ENERGY)" 
                        height="h-3"
                    />
                 </div>
            </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 relative overflow-hidden shadow-lg">
             <div className="flex items-center gap-2 mb-4 text-purple-500">
                <Brain size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('hunterStats')}</h3>
            </div>
            
            <div className="h-64 w-full flex items-center justify-center -ml-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={hunterData}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Stats"
                        dataKey="A"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fill="#8b5cf6"
                        fillOpacity={0.4}
                    />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

             {/* Stat Details Grid */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                    { label: t('str'), icon: Sword, color: 'text-red-400', val: stats.hunterAttributes.strength },
                    { label: t('vit'), icon: Shield, color: 'text-yellow-400', val: stats.hunterAttributes.vitality },
                    { label: t('agi'), icon: Wind, color: 'text-green-400', val: stats.hunterAttributes.agility },
                    { label: t('int'), icon: Brain, color: 'text-blue-400', val: stats.hunterAttributes.intelligence },
                    { label: t('sense'), icon: Eye, color: 'text-purple-400', val: stats.hunterAttributes.sense, full: true }
                ].map((s, i) => (
                    <div key={i} className={`bg-black/40 p-2 rounded flex items-center justify-between border border-neutral-800 ${s.full ? 'col-span-2' : ''}`}>
                        <div className="flex items-center gap-2">
                            <s.icon size={12} className={s.color}/>
                            <span className="text-xs text-neutral-400 font-bold">{s.label}</span>
                        </div>
                        <span className="font-mono font-bold text-white">{Math.floor(s.val)}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6 animate-slide-up pb-6">
        
        {/* 1. Career Summary Header */}
        <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 flex justify-between items-center shadow-lg">
            <div className="text-center flex-1 border-l border-neutral-800 first:border-0">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Total XP</span>
                <span className="text-lg font-black text-white">{stats.currentXp + (weeklyHistory.reduce((acc, w) => acc + w.totalXP, 0))}</span>
            </div>
            <div className="text-center flex-1 border-l border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Total Tasks</span>
                <span className="text-lg font-black text-white">{(weeklyHistory.reduce((acc, w) => acc + w.tasksCompleted, 0)) + stats.weeklyTasksCompleted}</span>
            </div>
            <div className="text-center flex-1 border-l border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1">Max Streak</span>
                <span className="text-lg font-black text-game-red">{Math.max(stats.streak, ...weeklyHistory.map(w => w.streakMax))}</span>
            </div>
        </div>

        {/* 2. Charts Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 overflow-hidden">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-game-red">
                    <TrendingUp size={18} />
                    <h3 className="font-bold text-sm uppercase tracking-widest">{t('trend')}</h3>
                </div>
                {/* View Toggle */}
                <div className="flex bg-black rounded-lg p-0.5 border border-neutral-800">
                    <button 
                        onClick={() => setHistoryView('WEEKS')}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${historyView === 'WEEKS' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}
                    >
                        Weeks
                    </button>
                    <button 
                        onClick={() => setHistoryView('MONTHS')}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${historyView === 'MONTHS' ? 'bg-neutral-700 text-white' : 'text-neutral-500'}`}
                    >
                        Months
                    </button>
                </div>
            </div>

            <div className="h-48 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                    {historyView === 'WEEKS' ? (
                        weeklyChartData.length > 0 ? (
                            <AreaChart data={weeklyChartData}>
                                <defs>
                                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="xp" stroke="#dc2626" fillOpacity={1} fill="url(#colorXp)" strokeWidth={2} />
                            </AreaChart>
                        ) : (
                             <div className="flex items-center justify-center h-full text-neutral-600 text-xs">Not enough data yet</div>
                        )
                    ) : (
                        monthlyChartData.length > 0 ? (
                            <BarChart data={monthlyChartData}>
                                <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                <Bar dataKey="xp" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-600 text-xs">Not enough data yet</div>
                        )
                    )}
                </ResponsiveContainer>
            </div>
        </div>

        {/* 3. Archives List */}
        <div>
            <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-3 px-1">
                {historyView === 'WEEKS' ? t('weeklyReport') : t('monthlyReport')} Archives
            </h3>
            
            <div className="space-y-3">
                {historyView === 'WEEKS' ? (
                    weeklyReports.length === 0 ? (
                         <div className="text-center py-8 opacity-50 border-2 border-dashed border-neutral-800 rounded-xl">
                            <History size={32} className="mx-auto mb-2 text-neutral-600" />
                            <p className="text-sm text-neutral-500">Complete your first week to generate a report.</p>
                        </div>
                    ) : (
                        weeklyReports.slice().reverse().map(report => {
                            const style = getRatingColor(report.rating);
                            const isExpanded = expandedReportId === report.weekId;
                            
                            return (
                                <div key={report.weekId} className={`rounded-xl overflow-hidden border transition-all duration-300 ${style}`}>
                                    <div 
                                        onClick={() => setExpandedReportId(isExpanded ? null : report.weekId)}
                                        className="p-4 flex items-center justify-between cursor-pointer active:bg-black/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center w-12">
                                                 <span className="text-[10px] font-bold text-neutral-400 uppercase">Week</span>
                                                 {/* Extract week number from ID or index if available, else standard icon */}
                                                 <span className="text-xl font-black">{new Date(report.createdAt).getDate()}</span>
                                            </div>
                                            
                                            <div className="h-8 w-px bg-neutral-700/50"></div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm uppercase tracking-wider">{t(report.rating.toLowerCase() as any)}</h4>
                                                    {report.rating === 'Excellent' && <Trophy size={12} className="text-yellow-500"/>}
                                                </div>
                                                <p className="text-[10px] opacity-70 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 pt-0 border-t border-black/10 bg-black/20">
                                            <div className="py-3">
                                                <p className="text-xs leading-relaxed opacity-90 font-medium">
                                                    "{report.summaryText}"
                                                </p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div className="bg-black/30 p-2 rounded flex items-center gap-2">
                                                    <Target size={14} className="text-blue-400" />
                                                    <div>
                                                        <span className="text-[9px] block opacity-50 uppercase">Focus</span>
                                                        <span className="text-xs font-bold">{t(report.bestPillar.toLowerCase() as any)}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-black/30 p-2 rounded flex items-center gap-2">
                                                    <Zap size={14} className="text-yellow-400" />
                                                    <div>
                                                        <span className="text-[9px] block opacity-50 uppercase">Total XP</span>
                                                        <span className="text-xs font-bold">
                                                            {/* Check against null specifically, as 0 is falsey */}
                                                            {report.comparison.xpChangePercent !== null 
                                                                ? `${report.comparison.xpChangePercent > 0 ? '+' : ''}${report.comparison.xpChangePercent}%` 
                                                                : 'N/A'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )
                ) : (
                    // Monthly View Logic (Simplified for brevity, follows same pattern)
                    monthlyReports.length === 0 ? (
                         <div className="text-center py-8 opacity-50 border-2 border-dashed border-neutral-800 rounded-xl">
                            <Award size={32} className="mx-auto mb-2 text-neutral-600" />
                            <p className="text-sm text-neutral-500">Complete your first month.</p>
                        </div>
                    ) : (
                        monthlyReports.slice().reverse().map(report => (
                            <div key={report.monthId} className={`p-4 rounded-xl border mb-2 ${getRatingColor(report.monthRating)}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-bold block opacity-60">{report.monthId}</span>
                                        <span className="font-black text-lg uppercase">{t(report.monthRating.toLowerCase() as any)}</span>
                                    </div>
                                    <Award size={24} />
                                </div>
                                <p className="text-xs mt-2 opacity-80">{report.summaryText}</p>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 animate-fade-in bg-game-black">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-game-black/90 backdrop-blur-md p-4 border-b border-neutral-800">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-game-red" size={24} />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t('statistics')}</h2>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-neutral-900 p-1 rounded-xl shadow-inner">
             <button 
                onClick={() => setActiveTab('STATUS')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'STATUS' ? 'bg-neutral-800 text-white shadow ring-1 ring-white/10' : 'text-neutral-500 hover:text-white'}`}
             >
                {t('tabStatus')}
             </button>
             <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-neutral-800 text-white shadow ring-1 ring-white/10' : 'text-neutral-500 hover:text-white'}`}
             >
                {t('tabHistory')}
             </button>
          </div>
      </div>

      <div className="p-4">
        {activeTab === 'STATUS' ? renderStatusTab() : renderHistoryTab()}
      </div>
    </div>
  );
};
