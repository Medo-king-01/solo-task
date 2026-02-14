
import React, { useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';
import { useToast } from '../context/ToastContext';
import { Globe, Palette, AlertTriangle, Check, RotateCcw, Bell, Lock, User, Volume2, Smartphone, Monitor, ChevronRight, Edit2, Shield, Activity, Save, X, Clock, VolumeX, Download, Upload, FileText, Database } from 'lucide-react';
import { ThemeColor, NotificationDuration } from '../types';
import { AudioService } from '../services/audioService';
import { NotificationService } from '../services/notifications';

export const SettingsScreen: React.FC = () => {
  const { language, themeColor, darkMode, notificationsEnabled, notificationDuration, soundEnabled, soundVolume, hapticsEnabled, updateSettings, toggleNotifications, t } = useSettings();
  const { playerProfile, updateProfile, resetProgress, exportSaveData, importSaveData } = useGame();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({
      name: playerProfile?.name || '',
      age: playerProfile?.age || 0,
      height: playerProfile?.height || 0,
      weight: playerProfile?.weight || 0
  });

  const themes: { id: ThemeColor; color: string; label: string }[] = [
    { id: 'red-black', color: '#ef4444', label: 'Red & Black' },
    { id: 'blue-dark', color: '#3b82f6', label: 'Blue & Dark' },
    { id: 'green-matrix', color: '#00f763', label: 'Matrix Green' },
    { id: 'purple-royal', color: '#d946ef', label: 'Royal Purple' },
    { id: 'pink-white', color: '#ff4d8d', label: 'Pink & White' },
  ];

  const handleNotificationClick = async () => {
    const targetState = !notificationsEnabled;
    if(soundEnabled) AudioService.playToggle(targetState);
    
    if (targetState) {
        const granted = await NotificationService.requestPermission();
        if (granted) {
            updateSettings({ notificationsEnabled: true });
            NotificationService.sendExternal("Solo Level", "System Online: Notifications Active");
            addToast("تم تفعيل الإشعارات", 'success');
        } else {
            addToast("تم رفض الإذن", 'error');
            updateSettings({ notificationsEnabled: false });
        }
    } else {
        updateSettings({ notificationsEnabled: false });
        addToast("تم إيقاف الإشعارات", 'info');
    }
  };

  const handleDurationChange = (duration: NotificationDuration) => {
      if(soundEnabled) AudioService.playClick();
      updateSettings({ notificationDuration: duration });
      setTimeout(() => addToast(`Updated duration to ${duration}`, 'info'), 100);
  };

  const handleHapticsToggle = () => {
      if(soundEnabled) AudioService.playToggle(!hapticsEnabled);
      updateSettings({ hapticsEnabled: !hapticsEnabled });
  };

  const saveProfileChanges = () => {
      if(soundEnabled) AudioService.playClick();
      updateProfile(tempProfile);
      setIsEditingProfile(false);
  };

  const toggleEditProfile = (edit: boolean) => {
      if(soundEnabled) AudioService.playClick();
      setIsEditingProfile(edit);
  };

  const changeTheme = (id: ThemeColor) => {
      if(soundEnabled) AudioService.playClick();
      updateSettings({ themeColor: id });
  };

  const changeLanguage = (lang: 'ar' | 'en') => {
      if(soundEnabled) AudioService.playClick();
      updateSettings({ language: lang });
  };

  const handleExport = () => {
      const data = exportSaveData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solotask_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if(soundEnabled) AudioService.playClick();
      addToast("تم تصدير ملف النسخ الاحتياطي", "success");
  };

  const handleImportClick = () => {
      if(fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              if (confirm("تحذير: استعادة النسخة الاحتياطية ستقوم بحذف بياناتك الحالية واستبدالها. هل أنت متأكد؟")) {
                  importSaveData(content);
              }
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 animate-fade-in bg-game-bg text-game-text">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-game-bg/90 backdrop-blur-md p-4 border-b border-game-border flex items-center gap-3">
          <Monitor className="text-game-primary" size={24} />
          <h2 className="text-2xl font-black text-game-text uppercase tracking-tighter">{t('settingsScreen')}</h2>
      </div>

      <div className="p-4 space-y-6">

        {/* 1. Profile Section */}
        <div className="bg-game-surface border border-game-border rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield size={100} />
            </div>
            
            <div className="p-4 border-b border-game-border flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-game-primary">
                    <User size={18} />
                    <h3 className="font-bold text-sm uppercase tracking-widest">{t('profileSettings')}</h3>
                </div>
                {!isEditingProfile ? (
                    <button onClick={() => toggleEditProfile(true)} className="p-2 bg-game-surface-highlight rounded-lg hover:text-game-text text-game-text-muted transition-colors">
                        <Edit2 size={16} />
                    </button>
                ) : (
                     <div className="flex gap-2">
                        <button onClick={() => toggleEditProfile(false)} className="p-2 bg-game-surface-highlight rounded-lg text-red-400 hover:bg-red-900/20">
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
                    <div className="w-16 h-16 bg-gradient-to-br from-game-surface-highlight to-game-bg rounded-full border-2 border-game-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--color-primary),0.3)]">
                        <User size={32} className="text-game-primary" />
                    </div>
                    <div className="flex-1">
                        {isEditingProfile ? (
                            <input 
                                type="text" 
                                value={tempProfile.name}
                                onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                                className="bg-game-bg border border-game-border rounded px-2 py-1 text-game-text font-bold w-full focus:border-game-primary outline-none"
                            />
                        ) : (
                            <h2 className="text-xl font-black text-game-text">{playerProfile?.name}</h2>
                        )}
                        <p className="text-xs text-game-primary font-mono uppercase tracking-widest">{t('jobTitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-game-bg/40 p-2 rounded border border-game-border text-center">
                        <span className="text-[10px] text-game-text-muted uppercase block mb-1">{t('age')}</span>
                        {isEditingProfile ? (
                            <input 
                                type="number" 
                                value={tempProfile.age}
                                onChange={(e) => setTempProfile({...tempProfile, age: Number(e.target.value)})}
                                className="bg-game-surface w-full text-center text-sm font-bold text-game-text outline-none rounded"
                            />
                        ) : (
                            <span className="text-lg font-bold text-game-text">{playerProfile?.age}</span>
                        )}
                    </div>
                    <div className="bg-game-bg/40 p-2 rounded border border-game-border text-center">
                        <span className="text-[10px] text-game-text-muted uppercase block mb-1">{t('height')}</span>
                        {isEditingProfile ? (
                             <input 
                                type="number" 
                                value={tempProfile.height}
                                onChange={(e) => setTempProfile({...tempProfile, height: Number(e.target.value)})}
                                className="bg-game-surface w-full text-center text-sm font-bold text-game-text outline-none rounded"
                            />
                        ) : (
                             <span className="text-lg font-bold text-game-text">{playerProfile?.height} <span className="text-[10px]">cm</span></span>
                        )}
                    </div>
                    <div className="bg-game-bg/40 p-2 rounded border border-game-border text-center">
                        <span className="text-[10px] text-game-text-muted uppercase block mb-1">{t('weight')}</span>
                        {isEditingProfile ? (
                             <input 
                                type="number" 
                                value={tempProfile.weight}
                                onChange={(e) => setTempProfile({...tempProfile, weight: Number(e.target.value)})}
                                className="bg-game-surface w-full text-center text-sm font-bold text-game-text outline-none rounded"
                            />
                        ) : (
                            <span className="text-lg font-bold text-game-text">{playerProfile?.weight} <span className="text-[10px]">kg</span></span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* 2. System Settings */}
        <div className="bg-game-surface border border-game-border rounded-2xl overflow-hidden">
             <div className="p-4 border-b border-game-border flex items-center gap-2 text-game-primary">
                <Activity size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('systemSettings')}</h3>
            </div>

            <div className="divide-y divide-game-border">
                {/* Notifications */}
                <button 
                    onClick={handleNotificationClick}
                    className="w-full p-4 flex items-center justify-between hover:bg-game-surface-highlight transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${notificationsEnabled ? 'bg-green-900/20 text-green-500' : 'bg-game-surface-highlight text-game-text-muted'}`}>
                            <Bell size={18} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-sm text-game-text">{t('notifications')}</p>
                            <p className="text-[10px] text-game-text-muted">{t('notificationsDesc')}</p>
                        </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${notificationsEnabled ? 'bg-green-600' : 'bg-game-border'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notificationsEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                    </div>
                </button>

                {/* Notification Duration */}
                <div className="p-4 flex flex-col gap-3 bg-game-bg/20">
                     <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-game-surface-highlight text-game-text-muted">
                            <Clock size={18} />
                        </div>
                        <p className="font-bold text-sm text-game-text">{t('alertDuration')}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {(['short', 'medium', 'long', 'persistent'] as NotificationDuration[]).map(d => (
                            <button
                                key={d}
                                onClick={() => handleDurationChange(d)}
                                className={`
                                    py-2 rounded-lg text-[10px] font-bold uppercase transition-all border
                                    ${notificationDuration === d 
                                        ? 'bg-game-surface-highlight text-game-text border-game-text' 
                                        : 'bg-game-bg text-game-text-muted border-game-border hover:border-game-text-muted'}
                                `}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                 {/* Volume Control */}
                 <div className="w-full p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-game-surface-highlight text-game-text-muted">
                                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </div>
                            <p className="font-bold text-sm text-game-text">{t('soundEffects')}</p>
                        </div>
                        <span className="text-xs font-mono text-game-text-muted">{(soundVolume * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                if(soundEnabled) AudioService.playToggle(!soundEnabled);
                                updateSettings({ soundEnabled: !soundEnabled });
                            }}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${soundEnabled ? 'bg-game-primary' : 'bg-game-border'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${soundEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                        </button>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05"
                            value={soundVolume}
                            onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value), soundEnabled: true })}
                            className="flex-1 h-2 bg-game-border rounded-lg appearance-none cursor-pointer accent-game-primary"
                        />
                    </div>
                </div>

                {/* Haptics */}
                 <button 
                    onClick={handleHapticsToggle}
                    className="w-full p-4 flex items-center justify-between hover:bg-game-surface-highlight transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-game-surface-highlight text-game-text-muted">
                            <Smartphone size={18} />
                        </div>
                        <p className="font-bold text-sm text-game-text">{t('hapticFeedback')}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${hapticsEnabled ? 'bg-game-primary' : 'bg-game-border'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${hapticsEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                    </div>
                </button>

                {/* Language */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-game-surface-highlight text-game-text-muted">
                            <Globe size={18} />
                        </div>
                        <p className="font-bold text-sm text-game-text">{t('language')}</p>
                    </div>
                    <div className="flex bg-game-bg rounded-lg p-1 border border-game-border">
                        <button 
                            onClick={() => changeLanguage('ar')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'ar' ? 'bg-game-primary text-white' : 'text-game-text-muted hover:text-game-text'}`}
                        >
                            AR
                        </button>
                        <button 
                             onClick={() => changeLanguage('en')}
                             className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'en' ? 'bg-game-primary text-white' : 'text-game-text-muted hover:text-game-text'}`}
                        >
                            EN
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. Security */}
        <div className="bg-game-surface border border-game-border rounded-2xl overflow-hidden p-4">
             <div className="flex items-center gap-2 mb-4 text-emerald-500">
                <Lock size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('securitySection')}</h3>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-start justify-between bg-game-bg/40 p-3 rounded-xl border border-game-border">
                    <div className="flex gap-3">
                        <Bell size={18} className="text-game-text-muted mt-1" />
                        <div>
                            <h4 className="text-xs font-bold text-game-text">{t('permNotificationsTitle')}</h4>
                            <p className="text-[10px] text-game-text-muted leading-tight mt-1 max-w-[200px]">
                                {t('permNotificationsDesc')}
                            </p>
                        </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase ${notificationsEnabled ? 'text-green-400 border-green-900 bg-green-900/20' : 'text-red-400 border-red-900 bg-red-900/20'}`}>
                        {notificationsEnabled ? t('permGranted') : t('permDenied')}
                    </span>
                </div>

                <div className="flex items-start justify-between bg-game-bg/40 p-3 rounded-xl border border-game-border">
                    <div className="flex gap-3">
                        <FileText size={18} className="text-game-text-muted mt-1" />
                        <div>
                            <h4 className="text-xs font-bold text-game-text">{t('permStorageTitle')}</h4>
                            <p className="text-[10px] text-game-text-muted leading-tight mt-1 max-w-[200px]">
                                {t('permStorageDesc')}
                            </p>
                        </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-1 rounded border uppercase text-blue-400 border-blue-900 bg-blue-900/20">
                        {t('permSystem')}
                    </span>
                </div>
            </div>
        </div>

        {/* 4. Visuals */}
        <div className="bg-game-surface border border-game-border rounded-2xl overflow-hidden p-4">
             <div className="flex items-center gap-2 mb-4 text-game-primary">
                <Palette size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">{t('theme')}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {themes.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => changeTheme(theme.id)}
                        className={`
                            relative h-16 rounded-xl overflow-hidden transition-all border-2
                            ${themeColor === theme.id ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}
                        `}
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

        {/* 5. Backup & Data */}
        <div className="bg-game-surface border border-game-border rounded-2xl overflow-hidden p-4">
             <div className="flex items-center gap-2 mb-4 text-blue-400">
                <Save size={18} />
                <h3 className="font-bold text-sm uppercase tracking-widest">إدارة البيانات</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleExport}
                    className="flex flex-col items-center justify-center gap-2 bg-game-surface-highlight p-4 rounded-xl hover:bg-game-bg border border-game-border transition-colors"
                >
                    <Download size={20} className="text-blue-400" />
                    <span className="text-xs font-bold text-game-text">تصدير نسخة</span>
                </button>
                
                <button
                    onClick={handleImportClick}
                    className="flex flex-col items-center justify-center gap-2 bg-game-surface-highlight p-4 rounded-xl hover:bg-game-bg border border-game-border transition-colors"
                >
                    <Upload size={20} className="text-yellow-400" />
                    <span className="text-xs font-bold text-game-text">استعادة نسخة</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".json"
                />
            </div>
        </div>

        {/* 6. Danger Zone */}
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
            <p className="text-[10px] text-game-text-muted font-mono">SYSTEM VERSION 1.2.0 (STABLE)</p>
         </div>

      </div>
    </div>
  );
};
