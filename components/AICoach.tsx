import React, { useState } from 'react';
import { MotivationService, MotivationalQuote } from '../services/motivationService';
import { Zap, Quote, Terminal, Cpu } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { AudioService } from '../services/audioService';

export const AICoach: React.FC = () => {
  const { playerProfile, stats, tasks } = useGame();
  const { soundEnabled, hapticsEnabled, t } = useSettings();
  const [quote, setQuote] = useState<MotivationalQuote | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);
  const [animate, setAnimate] = useState(false);

  const handleBoost = () => {
    if (isCooldown) return;

    // Feedback
    if (hapticsEnabled && navigator.vibrate) navigator.vibrate(50);
    if (soundEnabled) AudioService.playBoost();

    // USE DETERMINISTIC ENGINE
    const newQuote = MotivationService.getSmartAdvice(stats, tasks);
    
    setQuote(newQuote);
    setAnimate(true);
    
    // Reset animation class
    setTimeout(() => setAnimate(false), 500);

    // Start Cooldown
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 5000); // 5 seconds cooldown
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in pb-20 bg-game-black">
      
      {/* Header */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 bg-neutral-900 rounded-xl flex items-center justify-center border border-game-red shadow-[0_0_20px_rgba(220,38,38,0.2)] relative overflow-hidden">
            {/* Scanline */}
            <div className="absolute inset-0 bg-scanlines opacity-50"></div>
            <Cpu size={40} className="text-game-red animate-pulse relative z-10" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mt-2">{t('motivationBooster')}</h2>
        <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1 rounded border border-neutral-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-neutral-400 text-[10px] font-mono tracking-widest">{t('systemActive')}</p>
        </div>
      </div>

      {/* Quote Display Area */}
      <div className="w-full max-w-md min-h-[180px] flex items-center justify-center relative">
        {quote ? (
            <div className={`
                relative bg-neutral-900/80 border border-neutral-700 p-8 rounded-sm shadow-lg 
                transition-all duration-500 backdrop-blur-md
                ${animate ? 'scale-95 opacity-50 blur-sm' : 'scale-100 opacity-100'}
            `}>
                {/* Decorative Terminal Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-game-red"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-game-red"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-game-red"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-game-red"></div>

                <Quote className="absolute top-4 right-4 text-neutral-700 rotate-180" size={24} />
                
                <div className="mb-4 flex justify-center">
                    <span className="text-[9px] bg-neutral-800 text-game-red px-2 py-0.5 rounded border border-neutral-700 uppercase tracking-widest font-mono">
                        SYSTEM_MSG :: {quote.category.toUpperCase()}
                    </span>
                </div>

                <p className="text-lg font-bold text-white leading-relaxed font-sans direction-rtl">
                    "{quote.text}"
                </p>
                
                <Quote className="absolute bottom-4 left-4 text-neutral-700" size={24} />
            </div>
        ) : (
            <div className="text-neutral-600 space-y-3 font-mono text-xs border border-neutral-800 p-6 rounded bg-black/40">
                <p>{" > "} SYSTEM READY.</p>
                <p>{" > "} WAITING FOR INPUT...</p>
                <p className="text-game-red animate-pulse">{" > "} {playerProfile?.name || 'USER'} DETECTED.</p>
            </div>
        )}
      </div>

      {/* Interaction Button */}
      <button
        onClick={handleBoost}
        disabled={isCooldown}
        className={`
            group relative flex items-center gap-3 px-8 py-4 rounded-sm font-black text-sm uppercase tracking-widest transition-all duration-300 border
            ${isCooldown 
                ? 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed' 
                : 'bg-white text-black border-white hover:bg-neutral-200 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]'}
        `}
      >
        {isCooldown ? (
            <span className="flex items-center gap-2">
                <Terminal size={14} className="animate-spin" />
                {t('charging')}
            </span>
        ) : (
            <>
                <span className="font-mono">{t('boostBtn')}</span>
                <Zap className="fill-black group-hover:rotate-12 transition-transform" size={16} />
            </>
        )}
      </button>

      <div className="absolute bottom-24 text-[9px] text-neutral-700 font-mono">
        LOCAL ENGINE v3.0 • NO CLOUD SYNC
      </div>
    </div>
  );
};