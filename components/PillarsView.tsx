
import React from 'react';
import { useGame } from '../context/GameContext';
import { PILLARS } from '../constants';
import { PillarType } from '../types';
import { PillWidget } from './PillWidget';
import { Layers } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface Props {
    onNavigate: (pillar: PillarType) => void;
}

export const PillarsView: React.FC<Props> = ({ onNavigate }) => {
  const { tasks } = useGame();
  const { t } = useSettings();

  return (
    <div className="h-full flex flex-col pb-24 bg-game-black animate-fade-in overflow-y-auto no-scrollbar">
      
      {/* Header Info */}
      <div className="px-6 pt-6 pb-2">
         <div className="flex items-center gap-2 mb-2 text-game-red">
            <Layers size={24} />
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t('lifePillars')}</h2>
         </div>
         <p className="text-neutral-400 text-sm">
             إدارة أركان حياتك وتطوير قدراتك. اختر ركناً للدخول إلى التفاصيل.
         </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-4 p-4">
        {PILLARS.map((pillar, index) => {
          const pillarTasks = tasks.filter(t => t.pillar === pillar.id);
          const activeCount = pillarTasks.filter(t => !t.completed).length;
          
          return (
            <div 
                key={pillar.id} 
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
            >
                <PillWidget 
                    pillarId={pillar.id} 
                    taskCount={activeCount}
                    onClick={() => onNavigate(pillar.id)}
                    variant="card"
                />
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 text-center">
        <p className="text-[10px] text-neutral-600 font-mono">SYSTEM: PILLAR_VIEW_V2.0 // READY</p>
      </div>
    </div>
  );
};
