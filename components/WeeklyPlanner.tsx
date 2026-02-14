
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { DAYS_OF_WEEK } from '../constants';
import { TaskItem } from './TaskItem';
import { DayOfWeek, Task } from '../types';
import { Calendar, CheckCircle2, Coffee, Plus, Lock, AlertCircle } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { useToast } from '../context/ToastContext';

interface Props {
  onAddTask: (day: DayOfWeek) => void;
  onEditTask: (task: Task) => void;
}

export const WeeklyPlanner: React.FC<Props> = ({ onAddTask, onEditTask }) => {
  const { tasks, completeTask, deleteTask, stats } = useGame();
  const { t } = useSettings();
  const { addToast } = useToast();
  
  // State to track expanded days (default to today or Saturday)
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>('Saturday');

  // Calculate Today's Index (0 = Saturday, ... 6 = Friday)
  const todayIndex = (new Date().getDay() + 1) % 7;

  // Optimize: Group tasks by day once using useMemo instead of filtering 7 times inside map
  const tasksByDay = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    DAYS_OF_WEEK.forEach(d => grouped[d.id] = []);
    
    tasks.forEach(task => {
        if (task.day && grouped[task.day]) {
            grouped[task.day].push(task);
        }
    });
    return grouped;
  }, [tasks]);

  const handleAddClick = (dayIndex: number, dayId: DayOfWeek) => {
      if (dayIndex < todayIndex) {
          addToast(t('dayLockedMsg') || "هذا اليوم قد مضى. لا يمكن إضافة مهام جديدة.", 'error');
          return;
      }
      onAddTask(dayId);
  };

  return (
    <div className="h-full overflow-y-auto pb-24 animate-fade-in p-4 space-y-4 no-scrollbar">
        <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-game-red" size={24} />
            <h2 className="text-2xl font-black text-white">{t('weeklyPlanner')}</h2>
        </div>

        {DAYS_OF_WEEK.map((day, index) => {
            const isRestDay = day.id === 'Friday';
            const isPast = index < todayIndex;
            const isToday = index === todayIndex;
            
            const dayTasks = tasksByDay[day.id] || [];
            const completedCount = dayTasks.filter(t => t.completed).length;
            const totalCount = dayTasks.length;
            const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
            const isExpanded = expandedDay === day.id;

            return (
                <div 
                    key={day.id} 
                    className={`
                        border rounded-2xl overflow-hidden transition-all duration-300 relative
                        ${isPast 
                            ? 'bg-neutral-950/80 border-neutral-900 opacity-70 grayscale-[0.8]' 
                            : isRestDay 
                                ? 'bg-gradient-to-br from-emerald-900/20 to-neutral-900 border-emerald-900/50' 
                                : isToday
                                    ? 'bg-neutral-900 border-game-red/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]'
                                    : 'bg-neutral-900 border-neutral-800'}
                    `}
                >
                    {/* Header Card */}
                    <div 
                        onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                        className="p-4 flex items-center justify-between cursor-pointer active:bg-white/5 relative z-10"
                    >
                        <div className="flex items-center gap-4">
                            {/* Day Icon / Progress */}
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                {isPast ? (
                                    <div className="bg-neutral-800 p-2 rounded-full border border-neutral-700">
                                        <Lock size={18} className="text-neutral-500" />
                                    </div>
                                ) : isRestDay ? (
                                    <Coffee className="text-emerald-500" size={24} />
                                ) : (
                                    <CircularProgress 
                                        size={48} 
                                        strokeWidth={4} 
                                        percentage={progress} 
                                        color={progress === 100 ? 'text-game-red' : 'text-neutral-600'}
                                    >
                                        <span className={`text-xs font-bold ${progress === 100 ? 'text-game-red' : 'text-neutral-500'}`}>
                                            {Math.round(progress)}%
                                        </span>
                                    </CircularProgress>
                                )}
                            </div>
                            
                            <div>
                                <h3 className={`font-black text-lg flex items-center gap-2 ${isPast ? 'text-neutral-500' : isRestDay ? 'text-emerald-500' : 'text-white'}`}>
                                    {day.label}
                                    {isToday && <span className="text-[9px] bg-game-red text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>}
                                </h3>
                                <p className="text-xs text-neutral-500">
                                    {isPast 
                                        ? t('dayLocked') || "مغلق" 
                                        : isRestDay 
                                            ? t('restDay') 
                                            : `${completedCount} / ${totalCount} ${t('completedTasks')}`}
                                </p>
                            </div>
                        </div>

                        {/* Expand Icon */}
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} text-neutral-500`}>
                            ▼
                        </div>
                    </div>

                    {/* Expanded Content */}
                    <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 pt-0 border-t border-neutral-800/50">
                            
                            {isRestDay && !isPast ? (
                                <div className="py-6 text-center text-emerald-500/80">
                                    <p className="text-sm font-bold">{t('enjoyDay')}</p>
                                </div>
                            ) : (
                                <>
                                    {dayTasks.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <p className="text-neutral-600 text-sm mb-3">
                                                {isPast ? (t('noTasksHistory') || "لا توجد مهام مسجلة") : t('noScheduledTasks')}
                                            </p>
                                            {!isPast && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleAddClick(index, day.id); }}
                                                    className="text-game-red text-xs font-bold border border-game-red/30 px-3 py-1.5 rounded-lg hover:bg-game-red/10"
                                                >
                                                    + {t('addTaskFor')} {day.label}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3 mt-4">
                                            {dayTasks.map(task => (
                                                <TaskItem 
                                                    key={task.id}
                                                    task={task}
                                                    onComplete={completeTask}
                                                    onDelete={deleteTask}
                                                    onEdit={isPast ? undefined : onEditTask} // Disable editing for past days
                                                    canAfford={stats.energy >= task.energyCost}
                                                />
                                            ))}
                                            {!isPast && (
                                                <button 
                                                    onClick={() => handleAddClick(index, day.id)}
                                                    className="w-full py-3 border border-dashed border-neutral-800 rounded-xl text-neutral-600 text-sm font-bold hover:text-white hover:border-neutral-600 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={16} /> {t('addMore')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );
};
