
import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Zap, Trophy, Target, Calendar, Scroll, CheckCircle2, LayoutGrid, Clock, BarChart3, Lock, Heart, PersonStanding, Flame } from 'lucide-react';
import { PillarType, Task, DayOfWeek, TaskDifficulty, ExerciseCategory, ExerciseLevel } from '../types';
import { PILLARS, EXERCISE_DB, EXERCISE_PRESETS, DAYS_OF_WEEK, PILLAR_BASE_RATES, DIFFICULTY_CONFIG, ENERGY_PER_QURAN_PAGE } from '../constants';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { AudioService } from '../services/audioService';

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
  
  // Exercise Specific States
  const [exerciseCategory, setExerciseCategory] = useState<ExerciseCategory>('Cardio');
  const [exerciseLevel, setExerciseLevel] = useState<ExerciseLevel>('Beginner');

  const { t, soundEnabled } = useSettings();

  // Calculate Today's App Index (0 = Saturday, ... 6 = Friday)
  const todayIndex = (new Date().getDay() + 1) % 7;

  // Dynamic Calculation
  const baseRates = PILLAR_BASE_RATES[pillar];
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;
  
  // Calculate final costs
  const calculatedEnergy = pillar === 'Quran' 
    ? -(pages * ENERGY_PER_QURAN_PAGE) 
    : Math.ceil(baseRates.energy * multiplier);

  const calculatedXp = Math.ceil(baseRates.xp * multiplier);

  // Get current real day for visual comparison
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];

  useEffect(() => {
    if (isOpen) {
      if(soundEnabled) AudioService.playPop();

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
        // If defaultDay is provided and it's in the past relative to today (App Index), default to Today instead
        const defaultDayIndex = DAYS_OF_WEEK.findIndex(d => d.id === defaultDay);
        // Ensure strictly future or current days when adding from Planner
        const effectiveDay = (defaultDay && defaultDayIndex >= todayIndex) ? defaultDay : todayName;
        
        setDay(effectiveDay);
        setDifficulty('D');
        setDueDate('');
        setPages(1);
        
        // Reset Exercise Defaults
        setExerciseCategory('Cardio');
        setExerciseLevel('Beginner');
      }
    }
  }, [isOpen, initialData, defaultPillar, defaultDay, todayName, todayIndex, soundEnabled]);

  const handleExerciseSelect = (ex: typeof EXERCISE_DB[0]) => {
    if(soundEnabled) AudioService.playClick();
    
    const preset = EXERCISE_PRESETS[ex.category][exerciseLevel];
    // Need to use t() for units, but EXERCISE_DB has hardcoded 'Reps'/'Time'. Mapping here:
    const unitLabel = ex.unit === 'Time' ? t('unitSec') : t('unitReps');
    
    setTitle(`${ex.nameEn} / ${ex.nameAr}`);
    setPillar('Exercise');
    
    // Auto-generate detailed description
    const desc = `${exerciseLevel} Level:\n• ${preset.sets} ${t('sets')}\n• ${preset.value} ${unitLabel} per Set\n• ${preset.rest} ${t('unitSec')} Rest`;
    setDescription(desc);
    
    // Auto-set system difficulty based on preset rank
    setDifficulty(preset.rank);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(soundEnabled) AudioService.playClick();
    
    // For Quran, title can be auto-generated if empty
    let finalTitle = title;
    if (pillar === 'Quran' && !finalTitle.trim()) {
        finalTitle = `${t('quran')} - ${pages} ${t('pagesToRead')}`;
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

  const handlePillarChange = (p: PillarType) => {
      if(soundEnabled) AudioService.playClick();
      setPillar(p);
  }

  const handleDayChange = (d: DayOfWeek) => {
      if(soundEnabled) AudioService.playClick();
      setDay(d);
  }

  const handleDifficultyChange = (d: TaskDifficulty) => {
      if(soundEnabled) AudioService.playClick();
      setDifficulty(d);
  }

  // Filter exercises based on selected category
  const filteredExercises = EXERCISE_DB.filter(ex => ex.category === exerciseCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md pb-safe sm:pb-0 sm:p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-0 relative shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-900 flex justify-between items-center sticky top-0 z-10 shrink-0">
             <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                {initialData ? <><CheckCircle2 size={20} className="text-blue-500"/> {t('editTask')}</> : <><LayoutGrid size={20} className="text-game-red"/> {t('newTask')}</>}
            </h3>
            <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors">
                <X size={20} />
            </button>
        </div>
        
        <div className="overflow-y-auto p-6 space-y-6 no-scrollbar flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Pillar Selector (Grid) */}
                <div>
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 block">{t('selectPillar')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {PILLARS.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handlePillarChange(p.id)}
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
                        {DAYS_OF_WEEK.map((d, index) => {
                            const isToday = d.id === todayName;
                            // Strict check using App Index logic (0=Sat)
                            const isPast = index < todayIndex;
                            const isDisabled = isPast || (d.id === 'Friday' && pillar !== 'Quran');

                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => !isDisabled && handleDayChange(d.id)}
                                    className={`
                                        relative flex items-center justify-center px-3 py-2 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap
                                        ${isDisabled ? 'opacity-40 border-dashed border-neutral-800 cursor-not-allowed bg-black/50 text-neutral-600' : ''}
                                        ${day === d.id 
                                            ? 'bg-white text-black border-white shadow-lg scale-105' 
                                            : !isDisabled && isToday ? 'bg-neutral-800 border-game-red text-white' : 'bg-black text-neutral-500 border-neutral-800 hover:border-neutral-600'}
                                    `}
                                    disabled={isDisabled}
                                >
                                    {isPast && <Lock size={8} className="absolute -top-1 -left-1 text-neutral-500" />}
                                    {d.label}
                                    {isToday && day !== d.id && !isDisabled && (
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
                    ) : pillar === 'Exercise' ? (
                        /* --- 🏋️‍♂️ EXERCISE SPECIALIZED UI --- */
                        <div className="space-y-4 animate-slide-up">
                            
                            {/* 1. Category Tabs */}
                            <div>
                                <label className="text-[10px] text-green-500 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Target size={12} /> {t('workoutCategory')}
                                </label>
                                <div className="flex bg-black rounded-lg p-1 border border-neutral-800">
                                    {(['Cardio', 'Strength', 'Flexibility'] as ExerciseCategory[]).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setExerciseCategory(cat)}
                                            className={`flex-1 py-2 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${exerciseCategory === cat ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-white'}`}
                                        >
                                            {cat === 'Cardio' && <Heart size={12} />}
                                            {cat === 'Strength' && <Dumbbell size={12} />}
                                            {cat === 'Flexibility' && <PersonStanding size={12} />}
                                            {/* Translate Category Labels if needed, or leave as technical terms */}
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Difficulty Level */}
                            <div>
                                <label className="text-[10px] text-neutral-500 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Flame size={12} /> {t('intensityLevel')}
                                </label>
                                <div className="flex gap-2">
                                    {(['Beginner', 'Intermediate', 'Advanced'] as ExerciseLevel[]).map(lvl => (
                                        <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => setExerciseLevel(lvl)}
                                            className={`
                                                flex-1 py-2 px-2 rounded-lg text-[10px] font-black uppercase border transition-all
                                                ${exerciseLevel === lvl 
                                                    ? (lvl === 'Beginner' ? 'bg-green-900/30 border-green-500 text-green-400' 
                                                      : lvl === 'Intermediate' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400' 
                                                      : 'bg-red-900/30 border-red-500 text-red-400')
                                                    : 'bg-black border-neutral-800 text-neutral-600 hover:border-neutral-600'}
                                            `}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Exercise Selection Grid */}
                            <div>
                                <label className="text-[10px] text-neutral-500 font-bold mb-2 uppercase tracking-wide block">
                                    {t('selectExercise')}
                                </label>
                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {filteredExercises.map(ex => (
                                        <button
                                            key={ex.id}
                                            type="button"
                                            onClick={() => handleExerciseSelect(ex)}
                                            className="bg-neutral-900 border border-neutral-800 hover:border-green-500/30 hover:bg-green-900/10 rounded-lg p-3 flex justify-between items-center transition-all group text-left"
                                        >
                                            <div>
                                                <span className="block text-xs text-white font-bold">{ex.nameEn}</span>
                                                <span className="block text-[10px] text-neutral-500 font-cairo">{ex.nameAr}</span>
                                            </div>
                                            <div className="bg-black/50 text-[9px] text-neutral-400 px-2 py-1 rounded font-mono border border-neutral-800">
                                                {ex.unit}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auto-Filled Details Preview */}
                            <div className="bg-black/60 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2">
                                <div>
                                    <label className="text-[9px] text-neutral-600 font-bold uppercase">{t('autoTitle')}</label>
                                    <input 
                                        type="text" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        className="w-full bg-transparent border-b border-neutral-800 text-sm font-bold text-white py-1 outline-none focus:border-green-500"
                                        placeholder={t('selectExercisePlaceholder')}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-neutral-600 font-bold uppercase">{t('planDetails')}</label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-transparent text-xs text-neutral-400 font-mono h-16 outline-none resize-none"
                                        placeholder={t('planDetailsPlaceholder')}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* --- STANDARD UI FOR OTHER PILLARS --- */
                        <>
                            <div>
                                <label className="block text-[10px] text-neutral-500 font-bold mb-1 uppercase">{t('taskTitle')}</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black border border-neutral-800 rounded-xl p-4 text-white placeholder:text-neutral-700 focus:border-game-red focus:ring-1 focus:ring-game-red outline-none transition-all font-bold"
                                    placeholder={t('taskPlaceholder')}
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
                                            onClick={() => handleDifficultyChange(key)}
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
                        w-full font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0
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
