
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { DAYS_OF_WEEK } from '../constants';
import { TaskItem } from './TaskItem';
import { DayOfWeek, Task } from '../types';
import { Calendar, CheckCircle2, Coffee, Plus } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface Props {
  onAddTask: (day: DayOfWeek) => void;
  onEditTask: (task: Task) => void;
}

export const WeeklyPlanner: React.FC<Props> = ({ onAddTask, onEditTask }) => {
  const { tasks, completeTask, deleteTask, stats } = useGame();
  const { t } = useSettings();
  
  // State to track expanded days (default to today or Saturday)
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>('Saturday');

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

  return (
    <div className="h-full overflow-y-auto pb-24 animate-fade-in p-4 space-y-4 no-scrollbar">
        <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-game-red" size={24} />
            <h2 className="text-2xl font-black text-white">{t('weeklyPlanner')}</h2>
        </div>

        {DAYS_OF_WEEK.map((day) => {
            const isRestDay = day.id === 'Friday';
            const dayTasks = tasksByDay[day.id] || [];
            const completedCount = dayTasks.filter(t => t.completed).length;
            const totalCount = dayTasks.length;
            const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
            const isExpanded = expandedDay === day.id;

            return (
                <div 
                    key={day.id} 
                    className={`
                        border rounded-2xl overflow-hidden transition-all duration-300
                        ${isRestDay 
                            ? 'bg-gradient-to-br from-emerald-900/20 to-neutral-900 border-emerald-900/50' 
                            : 'bg-neutral-900 border-neutral-800'}
                    `}
                >
                    {/* Header Card */}
                    <div 
                        onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                        className="p-4 flex items-center justify-between cursor-pointer active:bg-white/5"
                    >
                        <div className="flex items-center gap-4">
                            {/* Day Icon / Progress */}
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                {isRestDay ? (
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
                                <h3 className={`font-black text-lg ${isRestDay ? 'text-emerald-500' : 'text-white'}`}>
                                    {day.label}
                                </h3>
                                <p className="text-xs text-neutral-500">
                                    {isRestDay ? t('restDay') : `${completedCount} / ${totalCount} ${t('completedTasks')}`}
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
                            
                            {isRestDay ? (
                                <div className="py-6 text-center text-emerald-500/80">
                                    <p className="text-sm font-bold">{t('enjoyDay')}</p>
                                </div>
                            ) : (
                                <>
                                    {dayTasks.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <p className="text-neutral-600 text-sm mb-3">{t('noScheduledTasks')}</p>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onAddTask(day.id); }}
                                                className="text-game-red text-xs font-bold border border-game-red/30 px-3 py-1.5 rounded-lg hover:bg-game-red/10"
                                            >
                                                + {t('addTaskFor')} {day.label}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 mt-4">
                                            {dayTasks.map(task => (
                                                <TaskItem 
                                                    key={task.id}
                                                    task={task}
                                                    onComplete={completeTask}
                                                    onDelete={deleteTask}
                                                    onEdit={onEditTask}
                                                    canAfford={stats.energy >= task.energyCost}
                                                />
                                            ))}
                                            <button 
                                                onClick={() => onAddTask(day.id)}
                                                className="w-full py-3 border border-dashed border-neutral-800 rounded-xl text-neutral-600 text-sm font-bold hover:text-white hover:border-neutral-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} /> {t('addMore')}
                                            </button>
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
