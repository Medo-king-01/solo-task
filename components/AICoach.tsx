
import React, { useState } from 'react';
import { MotivationService, MotivationalQuote } from '../services/motivationService';
import { Zap, Quote, Flame } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useSettings } from '../context/SettingsContext';
import { AudioService } from '../services/audioService';

export const AICoach: React.FC = () => {
  const { playerProfile } = useGame();
  const { soundEnabled, hapticsEnabled, t } = useSettings();
  const [quote, setQuote] = useState<MotivationalQuote | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);
  const [animate, setAnimate] = useState(false);

  const handleBoost = () => {
    if (isCooldown) return;

    // Feedback
    if (hapticsEnabled && navigator.vibrate) navigator.vibrate(50);
    if (soundEnabled) AudioService.playBoost();

    const newQuote = MotivationService.getRandomQuote();
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
        <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center border-2 border-game-red shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <Flame size={40} className="text-game-red animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mt-2">{t('motivationBooster')}</h2>
        <p className="text-neutral-500 text-xs font-mono">{t('systemActive')}</p>
      </div>

      {/* Quote Display Area */}
      <div className="w-full max-w-md min-h-[160px] flex items-center justify-center relative">
        {quote ? (
            <div className={`relative bg-neutral-900/50 border border-neutral-800 p-8 rounded-2xl shadow-lg transition-all duration-500 ${animate ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                <Quote className="absolute top-4 right-4 text-neutral-700 rotate-180" size={24} />
                <p className="text-xl font-bold text-white leading-relaxed font-sans">
                    "{quote.text}"
                </p>
                <div className="mt-4 flex justify-center">
                    <span className="text-[10px] bg-game-red/10 text-game-red px-2 py-1 rounded border border-game-red/20 uppercase tracking-widest">
                        {quote.category}
                    </span>
                </div>
                <Quote className="absolute bottom-4 left-4 text-neutral-700" size={24} />
            </div>
        ) : (
            <div className="text-neutral-600 space-y-2">
                <p className="text-sm">{t('welcomeHunter')} {playerProfile?.name}، {t('needBoost')}</p>
                <p className="text-xs opacity-50">{t('pressButton')}</p>
            </div>
        )}
      </div>

      {/* Interaction Button */}
      <button
        onClick={handleBoost}
        disabled={isCooldown}
        className={`
            group relative flex items-center gap-3 px-8 py-4 rounded-xl font-black text-lg transition-all duration-300
            ${isCooldown 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700' 
                : 'bg-white text-black hover:bg-neutral-200 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}
        `}
      >
        {isCooldown ? (
            <span className="animate-pulse">{t('charging')}</span>
        ) : (
            <>
                <span>{t('boostBtn')}</span>
                <Zap className="fill-black group-hover:rotate-12 transition-transform" size={20} />
            </>
        )}
      </button>

      <div className="absolute bottom-24 text-[10px] text-neutral-700 font-mono">
        OFFLINE DATABASE • VER 2.1
      </div>
    </div>
  );
};
