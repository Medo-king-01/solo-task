
import React, { useEffect, useState } from 'react';
import { Trophy, Star, X, Zap } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { AudioService } from '../services/audioService';

export const LevelUpModal: React.FC = () => {
  const { showLevelUpModal, closeLevelUpModal, stats } = useGame();
  const { soundEnabled } = useSettings();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (showLevelUpModal) {
      setAnimate(true);
      if (soundEnabled) {
        // Slight delay to sync with animation pop
        setTimeout(() => AudioService.playLevelUp(), 100);
      }
    } else {
      setAnimate(false);
    }
  }, [showLevelUpModal, soundEnabled]);

  if (!showLevelUpModal) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      {/* Background Rays Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent rotate-45 blur-3xl animate-pulse" />
      </div>

      <div className={`
        relative bg-neutral-900 border-2 border-yellow-500 rounded-3xl p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]
        transform transition-all duration-700
        ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10'}
      `}>
        
        {/* Floating Icons */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-neutral-900 p-4 rounded-full border-4 border-yellow-500 shadow-xl">
            <Trophy size={64} className="text-yellow-500 animate-bounce" />
        </div>

        <div className="mt-12 space-y-4">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm uppercase tracking-tighter">
                LEVEL UP!
            </h2>
            
            <div className="py-4">
                <span className="text-8xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                    {stats.level}
                </span>
            </div>

            <p className="text-neutral-400 font-bold text-sm">
                لقد أصبحت أقوى! حدود طاقتك وقدراتك زادت.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700">
                    <span className="text-[10px] text-neutral-500 font-bold block mb-1">XP المطلوب</span>
                    <div className="flex items-center justify-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="font-bold">{stats.maxXp}</span>
                    </div>
                </div>
                <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700">
                    <span className="text-[10px] text-neutral-500 font-bold block mb-1">الحد الأقصى للطاقة</span>
                    <div className="flex items-center justify-center gap-1 text-blue-500">
                        <Zap size={14} fill="currentColor" />
                        <span className="font-bold">100</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={closeLevelUpModal}
                className="w-full mt-8 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl shadow-lg shadow-yellow-900/20 active:scale-95 transition-all"
            >
                استمرار
            </button>
        </div>
      </div>

      {/* Confetti Particles (CSS Only Simulation) */}
      {[...Array(10)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-2 h-2 bg-yellow-500 rounded-full animate-ping"
            style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random()}s`,
                animationDuration: '1.5s'
            }}
          />
      ))}
    </div>
  );
};
