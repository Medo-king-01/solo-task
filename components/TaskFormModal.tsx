
import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Zap, Trophy, Target, Calendar, Scroll, CheckCircle2, LayoutGrid, Clock, BarChart3 } from 'lucide-react';
import { PillarType, Task, DayOfWeek, TaskDifficulty } from '../types';
import { PILLARS, HOME_EXERCISES, DAYS_OF_WEEK, PILLAR_BASE_RATES, DIFFICULTY_CONFIG, ENERGY_PER_QURAN_PAGE } from '../constants';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => void;
  initialData?: Task | null;
  defaultPillar?: PillarType;
  defaultDay?: DayOfWeek;
}

export const TaskFormModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData, defaultPillar, defaultDay }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pillar, setPillar] = useState<PillarType>('Learning');
  const [day, setDay] = useState<DayOfWeek>('Saturday');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('D'); // Default D-Rank
  const [dueDate, setDueDate] = useState('');
  const [pages, setPages] = useState<number>(1); // For Quran
  
  const { t } = useSettings();

  // Dynamic Calculation
  const baseRates = PILLAR_BASE_RATES[pillar];
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;
  
  // Calculate final costs
  // Fix: For Quran, use the specific constant for energy gain calculation to match GameContext
  const calculatedEnergy = pillar === 'Quran' 
    ? -(pages * ENERGY_PER_QURAN_PAGE) 
    : Math.ceil(baseRates.energy * multiplier);

  const calculatedXp = Math.ceil(baseRates.xp * multiplier);

  // Get current real day for visual comparison
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setPillar(initialData.pillar);
        setDay(initialData.day || 'Saturday');
        setDifficulty(initialData.difficulty || 'D');
        setDueDate(initialData.dueDate || '');
        setPages(initialData.pages || 1);
      } else {
        setTitle('');
        setDescription('');
        setPillar(defaultPillar || 'Learning');
        setDay(defaultDay || todayName);
        setDifficulty('D');
        setDueDate('');
        setPages(1);
      }
    }
  }, [isOpen, initialData, defaultPillar, defaultDay, todayName]);

  const handleExerciseSelect = (ex: typeof HOME_EXERCISES[0]) => {
    setTitle(ex.name);
    setPillar('Exercise');
    setDescription(`Goal: ${ex.reps || ex.duration}`);
    setDifficulty(ex.difficulty);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For Quran, title can be auto-generated if empty
    let finalTitle = title;
    if (pillar === 'Quran' && !finalTitle.trim()) {
        finalTitle = `${t('quran')} - ${pages} ${t('pagesToRead')}`; // Simplified title generation
    }

    if (!finalTitle.trim()) return;
    
    if (day === 'Friday' && pillar !== 'Quran') {
        alert(t('fridayRestWarning'));
        return;
    }

    onSubmit({
      title: finalTitle,
      description,
      pillar,
      day,
      difficulty,
      dueDate,
      pages: pillar === 'Quran' ? Number(pages) : undefined
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-3xl p-0 relative shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900 flex justify-between items-center sticky top-0 z-10">
             <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                {initialData ? <><CheckCircle2 size={20} className="text-blue-500"/> {t('editTask')}</> : <><LayoutGrid size={20} className="text-game-red"/> {t('newTask')}</>}
            </h3>
            <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                <X size={20} />
            </button>
        </div>
        
        <div className="overflow-y-auto p-6 space-y-6 no-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Pillar Selector (Grid) */}
                <div>
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 block">{t('selectPillar')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {PILLARS.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setPillar(p.id)}
                                className={`
                                    flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all
                                    ${pillar === p.id 
                                        ? `bg-${p.color.split('-')[1]}-900/20 border-${p.color.split('-')[1]}-500 text-white shadow-lg shadow-${p.color.split('-')[1]}-500/10` 
                                        : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-900'}
                                `}
                            >
                                <p.icon size={20} className={pillar === p.id ? p.color : 'text-neutral-600'} />
                                <span className="text-[10px] font-bold">{t(p.id.toLowerCase() as any)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Day Selector */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12} /> {t('timing')}
                        </label>
                        <div className="flex items-center gap-1 text-[10px] text-game-red font-bold animate-pulse">
                            <Clock size={10} />
                            <span>{t('today')}: {todayName}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {DAYS_OF_WEEK.map(d => {
                            const isToday = d.id === todayName;
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => setDay(d.id)}
                                    className={`
                                        relative flex items-center justify-center px-3 py-2 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap
                                        ${d.id === 'Friday' && pillar !== 'Quran' ? 'opacity-40 border-dashed border-neutral-800 cursor-not-allowed' : ''}
                                        ${day === d.id 
                                            ? 'bg-white text-black border-white shadow-lg scale-105' 
                                            : isToday ? 'bg-neutral-800 border-game-red text-white' : 'bg-black text-neutral-500 border-neutral-800 hover:border-neutral-600'}
                                    `}
                                    disabled={d.id === 'Friday' && pillar !== 'Quran'}
                                >
                                    {d.label}
                                    {isToday && day !== d.id && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-game-red rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Inputs Area */}
                <div className="bg-neutral-950/50 p-4 rounded-2xl border border-neutral-800/50 space-y-4">
                    {pillar === 'Quran' ? (
                        <div className="bg-emerald-900/10 border border-emerald-900/50 p-4 rounded-xl text-center">
                            <label className="block text-xs text-emerald-400 mb-3 font-bold flex items-center justify-center gap-2">
                                <Scroll size={16} /> {t('pagesToRead')}
                            </label>
                            <div className="flex items-center justify-center gap-4">
                                <button type="button" onClick={() => setPages(p => Math.max(1, p - 1))} className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xl transition-colors">-</button>
                                <span className="text-3xl font-black text-white w-16 text-center">{pages}</span>
                                <button type="button" onClick={() => setPages(p => p + 1)} className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xl transition-colors">+</button>
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-3">{t('pageEnergy')}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-[10px] text-neutral-500 font-bold mb-1 uppercase">{t('taskTitle')}</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black border border-neutral-800 rounded-xl p-4 text-white placeholder:text-neutral-700 focus:border-game-red focus:ring-1 focus:ring-game-red outline-none transition-all font-bold"
                                    placeholder={pillar === 'Exercise' ? "..." : t('taskPlaceholder')}
                                />
                            </div>

                            {/* Difficulty Selector */}
                            <div>
                                <label className="text-[10px] text-neutral-500 font-bold mb-2 uppercase flex items-center gap-2">
                                    <BarChart3 size={12} /> {t('difficultyLevel')}
                                </label>
                                <div className="grid grid-cols-6 gap-1">
                                    {(Object.keys(DIFFICULTY_CONFIG) as TaskDifficulty[]).map(key => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setDifficulty(key)}
                                            className={`
                                                flex flex-col items-center justify-center py-2 rounded-lg border transition-all
                                                ${difficulty === key 
                                                    ? `bg-neutral-800 border-white text-white` 
                                                    : 'bg-black border-neutral-800 text-neutral-600 hover:border-neutral-600'}
                                            `}
                                        >
                                            <span className={`text-xs font-black ${DIFFICULTY_CONFIG[key].color}`}>{key}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center mt-2 text-[10px] text-neutral-500 font-mono uppercase">
                                    {DIFFICULTY_CONFIG[difficulty].label} • x{DIFFICULTY_CONFIG[difficulty].multiplier} Rewards
                                </div>
                            </div>

                            {/* Exercise Quick Presets */}
                            {pillar === 'Exercise' && (
                                <div>
                                    <label className="block text-[10px] text-green-500 font-bold mb-2 uppercase tracking-wide">{t('suggestedExercises')}</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                        {HOME_EXERCISES.slice(0, 5).map(ex => (
                                            <button
                                                key={ex.id}
                                                type="button"
                                                onClick={() => handleExerciseSelect(ex)}
                                                className="bg-neutral-900 border border-neutral-800 hover:border-green-500/50 hover:bg-green-900/10 rounded-lg px-3 py-2 whitespace-nowrap transition-colors"
                                            >
                                                <span className="text-xs text-white font-bold">{ex.name.split('/')[1] || ex.name}</span>
                                                <span className="block text-[9px] text-neutral-500">{ex.reps || ex.duration} • Rank {ex.difficulty}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] text-neutral-500 font-bold mb-1 uppercase">{t('additionalNotes')}</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white placeholder:text-neutral-700 focus:border-game-red outline-none h-20 text-sm resize-none"
                                    placeholder={t('detailsPlaceholder')}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Stats Preview */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-black p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
                        <div className="bg-yellow-900/20 p-2 rounded-lg text-yellow-500"><Zap size={18} /></div>
                        <div>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase">{t('energy')}</p>
                            <p className={`text-lg font-black ${calculatedEnergy < 0 ? 'text-green-500' : 'text-white'}`}>
                                {calculatedEnergy > 0 ? `-${calculatedEnergy}` : `+${Math.abs(calculatedEnergy)}`}
                            </p>
                        </div>
                    </div>
                    {pillar !== 'Quran' && (
                        <div className="flex-1 bg-black p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
                            <div className="bg-red-900/20 p-2 rounded-lg text-game-red"><Trophy size={18} /></div>
                            <div>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase">{t('energyReward')}</p>
                                <p className="text-lg font-black text-white">{calculatedXp} XP</p>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={day === 'Friday' && pillar !== 'Quran'}
                    className={`
                        w-full font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2
                        ${day === 'Friday' && pillar !== 'Quran' 
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                            : 'bg-white text-black hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98]'}
                    `}
                >
                    {initialData ? t('saveChanges') : t('addToSchedule')}
                </button>

            </form>
        </div>
      </div>
    </div>
  );
};
