
import React from 'react';
import { PillarType, Task } from '../types';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { PillWidget } from './PillWidget';
import { TaskItem } from './TaskItem';
import { ArrowRight, Plus, ClipboardList } from 'lucide-react';

interface Props {
  pillarId: PillarType;
  onBack: () => void;
  onAddTask: () => void;
  onEditTask?: (task: Task) => void;
  customHeader?: React.ReactNode; 
}

export const PillarDetailScreen: React.FC<Props> = ({ pillarId, onBack, onAddTask, onEditTask, customHeader }) => {
  const { tasks, completeTask, deleteTask, stats } = useGame();
  const { t } = useSettings();
  
  const pillarTasks = tasks.filter(t => t.pillar === pillarId);
  const activeTasks = pillarTasks.filter(t => !t.completed);
  const completedTasks = pillarTasks.filter(t => t.completed);

  // Sorting: Newest first
  activeTasks.sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col h-full bg-game-black animate-fade-in absolute inset-0 z-30 pt-safe">
      
      {/* Header Area */}
      <div className="relative shadow-2xl z-10">
        <button 
            onClick={onBack}
            className="absolute top-6 left-4 z-20 p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/10 active:scale-90 transition-all"
        >
            <ArrowRight size={20} />
        </button>
        <PillWidget pillarId={pillarId} taskCount={activeTasks.length} variant="header" />
      </div>

      {/* Task List Container */}
      <div className="flex-1 overflow-y-auto pb-28 pt-4 px-4 no-scrollbar">
        
        {/* Custom Header Injection (Daily Quest) */}
        {customHeader && <div className="mb-4 animate-slide-up">{customHeader}</div>}

        <div className="space-y-4">
            {activeTasks.length === 0 && completedTasks.length === 0 && !customHeader && (
                <div className="flex flex-col items-center justify-center h-64 text-neutral-600 opacity-80 animate-fade-in">
                    <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-neutral-800">
                        <ClipboardList size={32} />
                    </div>
                    <p className="font-bold">{t('noTasks')}</p>
                    <p className="text-xs mt-2 text-neutral-500">{t('pillarQuiet')}</p>
                </div>
            )}

            {/* Active Tasks */}
            <div className="space-y-3">
                {activeTasks.map((task, index) => (
                    <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                        <TaskItem 
                            task={task}
                            onComplete={completeTask}
                            onDelete={deleteTask}
                            onEdit={onEditTask}
                            canAfford={stats.energy >= task.energyCost}
                        />
                    </div>
                ))}
            </div>

            {/* Completed Tasks Header */}
            {completedTasks.length > 0 && (
                <div className="pt-8 mt-4 border-t border-dashed border-neutral-800/50">
                    <h4 className="text-[10px] font-black text-neutral-600 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span>{t('completedArchive')}</span>
                        <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">{completedTasks.length}</span>
                    </h4>
                    <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity duration-500">
                        {completedTasks.map(task => (
                            <TaskItem 
                                key={task.id}
                                task={task}
                                onComplete={completeTask}
                                onDelete={deleteTask}
                                canAfford={true}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* FAB to Add Task - Safe Area Aware */}
      <button 
        onClick={onAddTask}
        className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-6 w-14 h-14 bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-90 transition-all z-40 flex items-center justify-center border-4 border-neutral-200"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  );
};
