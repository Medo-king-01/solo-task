import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';
import { useToast } from '../context/ToastContext';
import { Globe, Palette, AlertTriangle, Check, RotateCcw, Bell, Lock, User, Volume2, Smartphone, Monitor, ChevronRight, Edit2, Shield, Activity, Save, X } from 'lucide-react';
import { ThemeColor } from '../types';
// استيراد مكتبة الإشعارات الخاصة بكاباسيتور
import { LocalNotifications } from '@capacitor/local-notifications';

export const SettingsScreen: React.FC = () => {
  const { language, themeColor, darkMode, notificationsEnabled, soundEnabled, hapticsEnabled, updateSettings, t } = useSettings();
  const { playerProfile, updateProfile, resetProgress } = useGame();
  const { addToast } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({
      name: playerProfile?.name || '',
      age: playerProfile?.age || 0,
      height: playerProfile?.height || 0,
      weight: playerProfile?.weight || 0
  });

  // --- تحديث دالة الضغط على زر الإشعارات ---
  const handleNotificationClick = async () => {
    try {
        // إذا كانت الإشعارات مفعلة ونريد إغلاقها
        if (notificationsEnabled) {
            updateSettings({ notificationsEnabled: false });
            addToast(language === 'ar' ? "تم إيقاف الإشعارات" : "Notifications Disabled", 'info');
            return;
        }

        // إذا كانت معطلة ونريد تفعيلها (نطلب الإذن من أندرويد)
        const permission = await LocalNotifications.requestPermissions();
        
        if (permission.display === 'granted') {
            // إنشاء القناة لضمان العمل على أندرويد
            await LocalNotifications.createChannel({
                id: 'messages',
                name: 'System Notifications',
                importance: 5,
                visibility: 1,
                vibration: true
            });

            // تحديث الإعدادات في Context
            updateSettings({ notificationsEnabled: true });
            
            // إرسال إشعار تجريبي باستخدام Capacitor بدلاً من Web Notification
            await LocalNotifications.schedule({
                notifications: [{
                    title: "Solo Level",
                    body: "System Online",
                    id: 1,
                    channelId: 'messages'
                }]
            });

            addToast(language === 'ar' ? "تم تفعيل الإشعارات بنجاح" : "Notifications Enabled", 'success');
        } else {
            addToast(language === 'ar' ? "يرجى تفعيل الإذن من إعدادات الهاتف" : "Please enable permission from settings", 'error');
        }
    } catch (error) {
        console.error("Notification Error:", error);
        addToast("Notification System Error", 'error');
    }
  };

  const saveProfileChanges = () => {
      updateProfile(tempProfile);
      setIsEditingProfile(false);
  };

  const themes: { id: ThemeColor; color: string; label: string }[] = [
    { id: 'red-black', color: '#ef4444', label: 'Red & Black' },
    { id: 'blue-dark', color: '#3b82f6', label: 'Blue & Dark' },
    { id: 'green-matrix', color: '#00f763', label: 'Matrix Green' },
    { id: 'purple-royal', color: '#d946ef', label: 'Royal Purple' },
    { id: 'pink-white', color: '#ff4d8d', label: 'Pink & White' },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 animate-fade-in bg-game-black">
      {/* باقي الكود الخاص بـ UI كما هو تماماً دون تغيير */}
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-game-black/90 backdrop-blur-md p-4 border-b border-neutral-800 flex items-center gap-3">
          <Monitor className="text-game-red" size={24} />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t('settingsScreen')}</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* 1. Profile Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield size={100} />
            </div>
            
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-game-red">
                    <User size={18} />
                    <h3 className="font-bold text-sm uppercase tracking-widest">{t('profileSettings')}</h3>
                </div>
                {!isEditingProfile ? (
                    <button onClick={() => setIsEditingProfile(true)} className="p-2 bg-neutral-800 rounded-lg hover:text-white text-neutral-400 transition-colors">
                        <Edit2 size={16} />
                    </button>
                ) : (
                     <div className="flex gap-2">
                        <button onClick={() => setIsEditingProfile(false)} className="p-2 bg-neutral-800 rounded-lg text-red-400 hover:bg-red-900/20">
                            <X size={16} />
                        </button>
                        <button onClick={saveProfileChanges} className="p-2 bg-green-900/50 rounded-lg text-green-400 hover:bg-green-900/80 border border-green-800">
                            <Save size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="p-4 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-neutral-800 to-neutral-950 rounded-full border-2 border-game-red flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                        <User size={32} className="text-game-red" />
                    </div>
                    <div className="flex-1">
                        {isEditingProfile ? (
                            <input 
                                type="text" 
                                value={tempProfile.name}
                                onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                                className="bg-black border border-neutral-700 rounded px-2 py-1 text-white font-bold w-full focus:border-game-red outline-none"
                            />
                        ) : (
                            <h2 className="text-xl font-black text-white">{playerProfile?.name}</h2>
                        )}
                        <p className="text-xs text-game-red font-mono uppercase tracking-widest">{t('jobTitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black/40 p-2 rounded border border-neutral-800 text-center">
                        <span className="text-[10px] text-neutral-500 uppercase block mb-1">{t('age')}</span>
                        {isEditingProfile ? (
                            <input 
                                type="number" 
                                value={tempProfile.age}
                                onChange={(e) => setTempProfile({...tempProfile, age: Number(e.target.value)})}
                                className="bg-neutral-900 w-full text-center text-sm font-bold text-white outline-none rounded"
                            />
                        ) : (
                            <span className="text-lg font-bold text-white">{playerProfile?.age}</span>
                        )}
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-neutral-800 text-center">
                        <span className="text-[10px] text-neutral-500 uppercase block mb-1">{t('height')}</span>
                        {isEditingProfile ? (
                             <input 
                                type="number" 
                                value={tempProfile.height}
                                onChange={(e) => setTempProfile({...tempProfile, height: Number(e.target.value)})}
                                className="bg-neutral-900 w-full text-center text-sm font-bold text-white outline-none rounded"
                            />
                        ) : (
                             <span className="text-lg font-bold text-white">{playerProfile?.height} <span className="text-[10px]">cm</span></span>
                        )}
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-neutral-800 text-center">
                        <span className="text-[10px] text-neutral-500 uppercase block mb-1">{t('weight')}</span>
                        {isEditingProfile ? (
                             <input 
                                type="number" 
                                value={tempProfile.weight}
                                onChange={(e) => setTempProfile({...tempProfile, weight: Number(e.target.value)})}
                                className="bg-neutral-900 w-full text-center text-sm font-bold text-white outline-none rounded"
                            />
                        ) : (
                            <span className="text-lg font-bold text-white">{playerProfile?.weight} <span className="text-[10px]">kg</span></span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* 2. System Settings */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
             <div className="p-4 border-b border-neutral-800 flex items-center gap-2 text-blue-500">
                <Activity size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('systemSettings')}</h3>
            </div>

            <div className="divide-y divide-neutral-800">
                {/* Notifications Button */}
                <button 
                    onClick={handleNotificationClick}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${notificationsEnabled ? 'bg-green-900/20 text-green-500' : 'bg-neutral-800 text-neutral-500'}`}>
                            <Bell size={18} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-sm text-white">{t('notifications')}</p>
                            <p className="text-[10px] text-neutral-500">{t('notificationsDesc')}</p>
                        </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${notificationsEnabled ? 'bg-green-600' : 'bg-neutral-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notificationsEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                    </div>
                </button>

                 {/* باقي الأزرار (الصوت، الهزاز، اللغة) كما هي... */}
                 <button 
                    onClick={() => updateSettings({ soundEnabled: !soundEnabled })}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400">
                            <Volume2 size={18} />
                        </div>
                        <p className="font-bold text-sm text-white">{t('soundEffects')}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${soundEnabled ? 'bg-blue-600' : 'bg-neutral-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${soundEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                    </div>
                </button>

                 <button 
                    onClick={() => updateSettings({ hapticsEnabled: !hapticsEnabled })}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400">
                            <Smartphone size={18} />
                        </div>
                        <p className="font-bold text-sm text-white">{t('hapticFeedback')}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${hapticsEnabled ? 'bg-blue-600' : 'bg-neutral-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${hapticsEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                    </div>
                </button>

                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neutral-800 text-neutral-400">
                            <Globe size={18} />
                        </div>
                        <p className="font-bold text-sm text-white">{t('language')}</p>
                    </div>
                    <div className="flex bg-black rounded-lg p-1 border border-neutral-800">
                        <button 
                            onClick={() => updateSettings({ language: 'ar' })}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'ar' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                        >
                            AR
                        </button>
                        <button 
                             onClick={() => updateSettings({ language: 'en' })}
                             className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                        >
                            EN
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* باقي الثيمات ومنطقة الخطر كما هي... */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden p-4">
             <div className="flex items-center gap-2 mb-4 text-purple-500">
                <Palette size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('theme')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {themes.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => updateSettings({ themeColor: theme.id })}
                        className={`relative h-16 rounded-xl overflow-hidden transition-all border-2 ${themeColor === theme.id ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: theme.color }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                             <span className="text-white font-bold text-xs">{theme.label}</span>
                             {themeColor === theme.id && <Check size={14} className="ml-auto text-white" />}
                        </div>
                    </button>
                ))}
            </div>
        </div>

         <div className="bg-red-950/20 border border-red-900/50 rounded-2xl overflow-hidden p-4">
             <div className="flex items-center gap-2 mb-4 text-red-500">
                <AlertTriangle size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('dangerZone')}</h3>
            </div>
             <button 
                onClick={resetProgress}
                className="w-full flex items-center justify-center gap-2 bg-red-900/20 text-red-500 p-3 rounded-xl border border-red-900/50 hover:bg-red-900/40 transition-colors"
            >
                <RotateCcw size={16} />
                <span className="font-bold text-sm">{t('resetProgress')}</span>
            </button>
         </div>

         <div className="text-center">
            <p className="text-[10px] text-neutral-600 font-mono">SYSTEM VERSION 1.0.5</p>
         </div>
      </div>
    </div>
  );
};
