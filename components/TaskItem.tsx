import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { CheckCircle2, Trash2, Zap, Pencil, CalendarClock, Circle, ChevronUp, ChevronDown, Moon, Sun, Ghost } from 'lucide-react';
import { PILLARS } from '../constants';
import { useGame } from '../context/GameContext';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  canAfford: boolean;
}

export const TaskItem: React.FC<Props> = React.memo(({ task, onComplete, onDelete, onEdit, canAfford }) => {
  const { moveTask } = useGame();
  const pillarInfo = PILLARS.find(p => p.id === task.pillar);
  const [isVisible, setIsVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Time Modifier Check
  const hour = new Date().getHours();
  const isMorning = hour >= 6 && hour < 10;
  const isNight = hour >= 22 || hour < 4;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    setIsCompleting(true);
    // Play sound logic could go here if sound was enabled
    setTimeout(() => {
        onComplete(task.id);
        setIsCompleting(false);
    }, 400); // Slightly longer for the effect
  };
  
  // Safe comparison for YYYY-MM-DD
  const isOverdue = React.useMemo(() => {
    if (!task.dueDate) return false;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return task.dueDate < todayStr;
  }, [task.dueDate]);

  // Shadow Task Styling
  if (task.isShadow) {
      return (
        <div className={`
            relative p-4 rounded-2xl border mb-3 transition-all duration-500 animate-pop
            bg-purple-900/10 border-purple-500/30 flex items-center justify-between
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            ${isCompleting ? 'scale-95 opacity-0' : 'scale-100'}
        `}>
            <div className="flex items-center gap-3">
                <div className="bg-purple-900/50 p-2 rounded-full">
                    <Ghost size={20} className="text-purple-300" />
                </div>
                <div>
                    <h4 className="font-bold text-purple-200 text-sm">{task.title}</h4>
                    <p className="text-[10px] text-purple-400">{task.description}</p>
                    <span className="text-[10px] font-bold text-green-400 mt-1 block">+{Math.abs(task.energyCost)} طاقة</span>
                </div>
            </div>
            <button
                onClick={handleComplete}
                className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-500 transition-colors shadow-lg"
            >
                <CheckCircle2 size={20} />
            </button>
        </div>
      );
  }

  return (
    <div 
        className={`
            relative p-4 rounded-2xl border mb-3 transition-all duration-500 group overflow-hidden
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            ${task.completed 
                ? 'bg-neutral-950/50 border-neutral-900 opacity-60 grayscale' 
                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 shadow-md hover:shadow-xl hover:translate-x-1'}
            ${isCompleting ? 'scale-95' : 'scale-100'}
        `}
    >
      {/* Completion Flash Effect */}
      {isCompleting && (
          <div className="absolute inset-0 bg-white/20 z-20 animate-pulse pointer-events-none" />
      )}

      {/* Selection Line */}
      {!task.completed && (
        <div className={`absolute right-0 top-0 bottom-0 w-1 ${pillarInfo?.color.replace('text-', 'bg-')} opacity-0 group-hover:opacity-100 transition-opacity`} />
      )}

      <div className="flex justify-between items-start">
        <div className="flex-1 ml-2">
            
            {/* Meta Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                {pillarInfo && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-black/40 border border-neutral-800 ${pillarInfo.color}`}>
                         <pillarInfo.icon size={10} />
                        <span>{pillarInfo.label}</span>
                    </div>
                )}
                {task.dueDate && (
                     <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-black/40 border border-neutral-800 ${isOverdue && !task.completed ? 'text-red-500 border-red-900/50' : 'text-neutral-500'}`}>
                        <CalendarClock size={10} />
                        <span>{task.dueDate}</span>
                    </div>
                )}
                {/* Time Effect Badge */}
                {!task.completed && task.pillar !== 'Quran' && (
                    <>
                        {isMorning && <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-500"><Sun size={10}/> بوناس صباحي</div>}
                        {isNight && <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-blue-900/30 border border-blue-500/30 text-blue-400"><Moon size={10}/> إرهاق ليلي</div>}
                    </>
                )}
            </div>

          <h4 className={`font-bold text-white text-lg leading-snug transition-all ${task.completed ? 'line-through text-neutral-500' : 'group-hover:text-gray-100'}`}>
            {task.title}
          </h4>
          {task.description && <p className="text-sm text-neutral-400 mt-2 leading-relaxed font-light">{task.description}</p>}
          
          {/* Rewards */}
          {!task.completed && (
            <div className="flex items-center mt-4 gap-3">
                <div className="flex items-center text-[10px] text-yellow-500 font-mono bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                    <Zap size={10} className="ml-1 fill-yellow-500" /> 
                    <span className="font-bold">-{task.energyCost} طاقة</span>
                </div>
                <div className="text-[10px] text-game-red font-mono font-bold bg-game-red/10 px-2 py-1 rounded border border-game-red/20">
                    +{task.xpReward} XP
                </div>
            </div>
          )}
        </div>

        {/* Actions & Reordering */}
        <div className="flex flex-col gap-1 pl-2 items-center">
            {/* Reorder Buttons (Only visible if not completed) */}
            {!task.completed && (
                <div className="flex flex-col gap-1 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveTask(task.id, 'up')} className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white">
                        <ChevronUp size={16} />
                    </button>
                    <button onClick={() => moveTask(task.id, 'down')} className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white">
                        <ChevronDown size={16} />
                    </button>
                </div>
            )}

            {!task.completed && (
                <button
                onClick={handleComplete}
                disabled={!canAfford || isCompleting}
                className={`
                    p-3 rounded-xl transition-all duration-300 relative overflow-hidden
                    ${canAfford 
                        ? 'bg-neutral-800 text-neutral-400 hover:bg-game-red hover:text-white hover:scale-110 shadow-lg' 
                        : 'bg-neutral-900 text-neutral-700 cursor-not-allowed'}
                `}
                title={canAfford ? "إكمال المهمة" : "لا توجد طاقة كافية"}
                >
                    {isCompleting && <span className="absolute inset-0 bg-white opacity-30 animate-ping rounded-xl"></span>}
                    {canAfford ? <CheckCircle2 size={22} className={isCompleting ? 'animate-bounce' : ''} /> : <Circle size={22} className="stroke-neutral-700" />}
                </button>
            )}
            
            {!task.completed && onEdit && (
                <button
                    onClick={() => onEdit(task)}
                    className="p-3 text-neutral-600 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors scale-90 hover:scale-100"
                >
                    <Pencil size={18} />
                </button>
            )}

            <button
                onClick={() => {
                    if(confirm('هل أنت متأكد من حذف هذه المهمة؟')) onDelete(task.id);
                }}
                className="p-3 text-neutral-600 hover:text-red-500 hover:bg-neutral-800/50 rounded-xl transition-colors scale-90 hover:scale-100"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>
    </div>
  );
});