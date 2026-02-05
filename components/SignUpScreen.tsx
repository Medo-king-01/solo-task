
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { User, Ruler, Weight, ArrowRight, Activity } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const SignUpScreen: React.FC = () => {
  const { createProfile } = useGame();
  const { t } = useSettings();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
    weight: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    createProfile({
      name: formData.name,
      age: Number(formData.age) || 0,
      height: Number(formData.height) || 0,
      weight: Number(formData.weight) || 0,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-game-black p-6 animate-fade-in relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-game-red rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-600 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">
                {t('createCharacter')}
            </h1>
            <p className="text-neutral-400">{t('startJourney')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-8 rounded-3xl shadow-2xl">
            
            {/* Name Input */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> {t('name')}
                </label>
                <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-white text-lg focus:border-game-red focus:ring-1 focus:ring-game-red outline-none transition-all placeholder:text-neutral-700"
                    placeholder={t('playerName')}
                    required
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Age */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1 justify-center">
                        <Activity size={10} /> {t('age')}
                    </label>
                    <input 
                        type="number" 
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-center text-white focus:border-game-red outline-none"
                        placeholder="00"
                    />
                </div>
                {/* Height */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1 justify-center">
                        <Ruler size={10} /> {t('height')}
                    </label>
                    <input 
                        type="number" 
                        value={formData.height}
                        onChange={(e) => setFormData({...formData, height: e.target.value})}
                        className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-center text-white focus:border-game-red outline-none"
                        placeholder="000"
                    />
                </div>
                {/* Weight */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1 justify-center">
                        <Weight size={10} /> {t('weight')}
                    </label>
                    <input 
                        type="number" 
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-center text-white focus:border-game-red outline-none"
                        placeholder="00"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-game-red to-red-600 text-white font-black py-4 rounded-xl shadow-lg shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
                <span>{t('createAccount')}</span>
                <ArrowRight size={20} />
            </button>
        </form>
        
        <p className="text-center text-neutral-600 text-xs mt-6">
            {t('dataLocal')}
        </p>
      </div>
    </div>
  );
};
