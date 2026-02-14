
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { DAYS_OF_WEEK } from '../constants';
import { ChevronDown, ChevronUp, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { WeeklyHistory, Task } from '../types';

export const HistoryLogViewer: React.FC = () => {
  const { weeklyHistory } = useGame();
  const { t } = useSettings();
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  if (weeklyHistory.length === 0) {
    return (
        <div className="text-center py-8 opacity-50 border-2 border-dashed border-neutral-800 rounded-xl">
            <Calendar size={32} className="mx-auto mb-2 text-neutral-600" />
            <p className="text-sm text-neutral-500">{t('archiveEmpty')}</p>
        </div>
    );
  }

  // Helper to group tasks by day
  const groupTasksByDay = (tasks: Task[]) => {
      const grouped: Record<string, Task[]> = {};
      DAYS_OF_WEEK.forEach(d => grouped[d.id] = []);
      tasks.forEach(t => {
          if (t.day && grouped[t.day]) {
              grouped[t.day].push(t);
          }
      });
      return grouped;
  };

  return (
    <div className="space-y-4 animate-fade-in">
        {/* Weeks List */}
        {weeklyHistory.slice().reverse().map((history) => {
            const isWeekExpanded = expandedWeekId === history.weekId;
            const weekTasks = history.archivedTasks || [];
            const tasksByDay = groupTasksByDay(weekTasks);

            return (
                <div key={history.weekId} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    {/* Week Header */}
                    <div 
                        onClick={() => setExpandedWeekId(isWeekExpanded ? null : history.weekId)}
                        className="p-4 flex items-center justify-between cursor-pointer bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                                <span className="font-mono text-xs font-bold text-neutral-400">W{history.weekIndexInMonth}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-white">
                                    {t('weekOf')} {new Date(history.startDate).toLocaleDateString()}
                                </h4>
                                <p className="text-[10px] text-neutral-500">
                                    {history.tasksCompleted} {t('completedTasks')} • {history.totalXP} XP
                                </p>
                            </div>
                        </div>
                        {isWeekExpanded ? <ChevronUp size={18} className="text-neutral-500"/> : <ChevronDown size={18} className="text-neutral-500"/>}
                    </div>

                    {/* Days List (Accordion inside Accordion) */}
                    {isWeekExpanded && (
                        <div className="border-t border-neutral-800 bg-black/20">
                            {DAYS_OF_WEEK.map((day) => {
                                const dayTasks = tasksByDay[day.id];
                                if (dayTasks.length === 0) return null; // Skip empty days

                                const dayKey = `${history.weekId}-${day.id}`;
                                const isDayExpanded = expandedDayId === dayKey;
                                const completedCount = dayTasks.filter(t => t.completed).length;

                                return (
                                    <div key={dayKey} className="border-b border-neutral-800/50 last:border-0">
                                        <div 
                                            onClick={() => setExpandedDayId(isDayExpanded ? null : dayKey)}
                                            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold ${completedCount === dayTasks.length ? 'text-green-500' : 'text-neutral-300'}`}>
                                                    {day.label}
                                                </span>
                                                <span className="text-[10px] text-neutral-600 bg-neutral-900 px-1.5 rounded">
                                                    {completedCount}/{dayTasks.length}
                                                </span>
                                            </div>
                                            <div className="text-neutral-600">
                                                {isDayExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                            </div>
                                        </div>

                                        {/* Tasks List */}
                                        {isDayExpanded && (
                                            <div className="px-4 pb-3 space-y-2">
                                                {dayTasks.map(task => (
                                                    <div key={task.id} className="flex items-center justify-between bg-black/40 p-2 rounded border border-neutral-800">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            {task.completed ? (
                                                                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                                                            ) : task.isMissed ? (
                                                                <XCircle size={14} className="text-red-500 flex-shrink-0" />
                                                            ) : (
                                                                <Clock size={14} className="text-neutral-500 flex-shrink-0" />
                                                            )}
                                                            <span className={`text-xs truncate ${task.completed ? 'text-neutral-500 line-through' : 'text-neutral-300'}`}>
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] font-mono text-neutral-600">
                                                            {task.xpReward} XP
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
  );
};
