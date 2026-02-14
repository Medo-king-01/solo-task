
import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { CheckCircle2, Trash2, Zap, Pencil, CalendarClock, Circle, ChevronUp, ChevronDown, Moon, Sun, Ghost, XCircle, Lock, AlertOctagon, Sword } from 'lucide-react';
import { PILLARS } from '../constants';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  canAfford: boolean;
}

export const TaskItem: React.FC<Props> = React.memo(({ task, onComplete, onDelete, onEdit, canAfford }) => {
  const { moveTask } = useGame();
  const { t } = useSettings();
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
    if (task.isMissed) return;
    setIsCompleting(true);
    // Play sound logic handled in GameContext
    setTimeout(() => {
        onComplete(task.id);
        setIsCompleting(false);
    }, 500); // Wait for slash animation
  };
  
  // Safe comparison for YYYY-MM-DD
  const isOverdue = React.useMemo(() => {
    if (!task.dueDate) return false;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return task.dueDate < todayStr;
  }, [task.dueDate]);

  // Shadow Task Styling (Emergency Protocol)
  if (task.isShadow) {
      return (
        <div className={`
            relative p-4 rounded-none mb-3 transition-all duration-500 animate-pop overflow-hidden
            bg-purple-950/30 border border-purple-500/60
            flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.15)]
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            ${isCompleting ? 'scale-95 opacity-0' : 'scale-100'}
        `}>
            {/* Scanline Effect Overlay */}
            <div className="absolute inset-0 bg-scanlines opacity-30 pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
                <div className="bg-purple-900/50 p-2 rounded-sm border border-purple-500 animate-pulse">
                    <AlertOctagon size={22} className="text-purple-300" />
                </div>
                <div>
                    <h4 className="font-black text-purple-200 text-sm tracking-wide uppercase font-mono">{task.title}</h4>
                    <p className="text-[10px] text-purple-400 font-mono mt-0.5">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 border border-green-500/30">
                            {t('shadow_reward_tag')} +{Math.abs(task.energyCost)}
                        </span>
                        <span className="text-[9px] text-purple-500/70 font-mono animate-pulse">
                            {t('urgent_quest')}
                        </span>
                    </div>
                </div>
            </div>
            <button
                onClick={handleComplete}
                className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-sm transition-all shadow-[0_0_10px_#9333ea] border border-purple-400 relative z-10 group"
            >
                <Zap size={20} className="fill-white group-hover:scale-110 transition-transform" />
            </button>
        </div>
      );
  }

  // Missed Task Styling (Broken Dungeon Effect)
  if (task.isMissed) {
      return (
        <div className={`
            relative p-4 rounded-sm border mb-3 transition-all duration-500 opacity-80 hover:opacity-100
            bg-red-950/20 border-red-900/60 flex items-center justify-between
            ${isVisible ? 'translate-y-0' : 'translate-y-4'}
        `}>
            {/* Cracks Effect (Simulated via gradients) */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,0,0.05)_10px,rgba(255,0,0,0.05)_11px)] pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
                <div className="bg-red-900/20 p-2 rounded-sm border border-red-900/50">
                    <XCircle size={20} className="text-red-500" />
                </div>
                <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-950 px-1.5 border border-red-900">FAILED</span>
                        {pillarInfo && (
                            <span className={`text-[9px] font-bold ${pillarInfo.color} opacity-60`}>{pillarInfo.label}</span>
                        )}
                    </div>
                    <h4 className="font-bold text-neutral-400 text-lg line-through decoration-red-600/50 decoration-2">{task.title}</h4>
                    <span className="text-[10px] font-mono text-red-400/60 mt-1 block flex items-center gap-1">
                        <Lock size={10} /> Dungeon Locked
                    </span>
                </div>
            </div>
            
             <button
                onClick={() => {
                    if(confirm('هل تريد حذف هذه المهمة الفائتة من السجل؟')) onDelete(task.id);
                }}
                className="p-3 text-neutral-600 hover:text-red-500 hover:bg-red-900/10 rounded-sm transition-colors relative z-10"
            >
                <Trash2 size={18} />
            </button>
        </div>
      );
  }

  return (
    <div 
        className={`
            relative p-4 rounded-lg border mb-3 transition-all duration-300 group overflow-hidden
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            ${task.completed 
                ? 'bg-neutral-900/50 border-neutral-900 opacity-60 grayscale' 
                : 'bg-neutral-900/80 backdrop-blur-sm border-neutral-800 hover:border-neutral-600 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]'}
        `}
    >
      {/* SLASH Animation Element */}
      {isCompleting && (
          <div className="absolute inset-0 z-50 pointer-events-none">
              <div className="slash-line w-full animate-slash"></div>
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          </div>
      )}

      {/* Subtle selection indicator */}
      {!task.completed && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${pillarInfo?.color.replace('text-', 'bg-')} opacity-50 group-hover:opacity-100 transition-opacity`} />
      )}

      <div className="flex justify-between items-start">
        <div className="flex-1 ml-3">
            
            {/* Meta Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                {pillarInfo && (
                    <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-black/40 border border-white/5 ${pillarInfo.color}`}>
                         <pillarInfo.icon size={10} />
                        <span>{pillarInfo.label}</span>
                    </div>
                )}
                {task.dueDate && (
                     <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-black/40 border border-neutral-800 ${isOverdue && !task.completed ? 'text-red-500 border-red-900/50' : 'text-neutral-500'}`}>
                        <CalendarClock size={10} />
                        <span>{task.dueDate}</span>
                    </div>
                )}
                {/* Time Effect Badge */}
                {!task.completed && task.pillar !== 'Quran' && (
                    <>
                        {isMorning && <div className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-yellow-500/5 border border-yellow-500/20 text-yellow-500"><Sun size={10}/> Morning Buff</div>}
                        {isNight && <div className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-900/20 border border-blue-500/20 text-blue-400"><Moon size={10}/> Night Debuff</div>}
                    </>
                )}
            </div>

          <h4 className={`font-bold text-white text-lg leading-snug transition-all ${task.completed ? 'line-through text-neutral-500' : 'group-hover:text-blue-100'}`}>
            {task.title}
          </h4>
          {task.description && <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed font-mono opacity-80">{task.description}</p>}
          
          {/* Rewards (Stats) */}
          {!task.completed && (
            <div className="flex items-center mt-3 gap-2">
                <div className="flex items-center text-[9px] text-yellow-500 font-mono bg-yellow-900/10 px-2 py-0.5 rounded-sm border border-yellow-500/20">
                    <Zap size={10} className="ml-1 fill-yellow-500" /> 
                    <span className="font-bold">-{task.energyCost} EP</span>
                </div>
                <div className="text-[9px] text-blue-400 font-mono font-bold bg-blue-900/10 px-2 py-0.5 rounded-sm border border-blue-500/20">
                    +{task.xpReward} XP
                </div>
            </div>
          )}
        </div>

        {/* Actions & Reordering */}
        <div className="flex flex-col gap-1 pl-2 items-center">
            {/* Reorder Buttons */}
            {!task.completed && (
                <div className="flex flex-col gap-1 mb-2 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                    <button onClick={() => moveTask(task.id, 'up')} className="p-0.5 hover:bg-neutral-800 rounded text-neutral-600 hover:text-white">
                        <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveTask(task.id, 'down')} className="p-0.5 hover:bg-neutral-800 rounded text-neutral-600 hover:text-white">
                        <ChevronDown size={14} />
                    </button>
                </div>
            )}

            {!task.completed && (
                <button
                onClick={handleComplete}
                disabled={!canAfford || isCompleting}
                className={`
                    p-3 rounded-lg transition-all duration-200 relative overflow-hidden group/btn
                    ${canAfford 
                        ? 'bg-neutral-800 text-neutral-400 hover:bg-system-blue hover:text-white hover:shadow-[0_0_15px_rgba(37,99,235,0.6)] border border-neutral-700 hover:border-blue-400' 
                        : 'bg-neutral-900 text-neutral-700 cursor-not-allowed border border-neutral-800'}
                `}
                title={canAfford ? "Execute" : "Insufficient Energy"}
                >
                    {canAfford ? (
                        <div className="relative">
                            <Sword size={20} className={`transition-transform duration-300 ${isCompleting ? 'scale-0' : 'group-hover/btn:rotate-45'}`} />
                            {/* Inner glow on hover */}
                            <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover/btn:opacity-20 blur-md"></div>
                        </div>
                    ) : <Lock size={20} />}
                </button>
            )}
            
            {!task.completed && onEdit && (
                <button
                    onClick={() => onEdit(task)}
                    className="p-2 text-neutral-600 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors scale-90 hover:scale-100"
                >
                    <Pencil size={16} />
                </button>
            )}

            <button
                onClick={() => {
                    if(confirm('Delete this task?')) onDelete(task.id);
                }}
                className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-900/10 rounded-lg transition-colors scale-90 hover:scale-100"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>
    </div>
  );
});
