
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, Language, ThemeColor } from '../types';
import { StorageService, defaultSettings } from '../services/storage';
import { translations, TranslationKey } from '../utils/translations';
import { NotificationService } from '../services/notifications';

interface SettingsContextType extends AppSettings {
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleNotifications: () => Promise<boolean>;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loaded = StorageService.loadSettings();
    setSettings(loaded);
    setIsLoaded(true);
  }, []);

  // Sync settings with storage and DOM
  useEffect(() => {
    if (!isLoaded) return;

    // 1. Language Direction
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';

    // 2. Dark Mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Theme Colors (Improved Palettes)
    const root = document.documentElement;
    let primary, primaryDim, bg, surface, accent;

    switch (settings.themeColor) {
      case 'blue-dark':
        // Electric Blue / Deep Navy
        primary = '#3b82f6';    // blue-500
        primaryDim = '#1e40af'; // blue-800
        accent = '#60a5fa';     // blue-400
        bg = settings.darkMode ? '#020617' : '#f0f9ff';     // slate-950 / sky-50
        surface = settings.darkMode ? '#0f172a' : '#ffffff'; // slate-900
        break;

      case 'green-matrix':
        // Hacker Green / Terminal Black
        primary = '#00f763';    // Neon Green
        primaryDim = '#14532d'; // green-900
        accent = '#4ade80';     // green-400
        bg = settings.darkMode ? '#000000' : '#f0fdf4';      // Pure Black for OLED
        surface = settings.darkMode ? '#051a0d' : '#ffffff'; // Dark Green tint
        break;

      case 'purple-royal':
        // Mystic Purple / Void
        primary = '#d946ef';    // fuchsia-500 (more vibrant than purple)
        primaryDim = '#701a75'; // fuchsia-900
        accent = '#e879f9';     // fuchsia-400
        bg = settings.darkMode ? '#150529' : '#faf5ff';      // Deep violet black
        surface = settings.darkMode ? '#2e1065' : '#ffffff'; // violet-900
        break;

      case 'pink-white':
        // Cyber Pink / Rose (New Theme)
        primary = '#ff4d8d';    // Vibrant Pink
        primaryDim = '#9d174d'; // pink-800
        accent = '#ff87b3';     // pink-300
        bg = settings.darkMode ? '#1f0812' : '#fff0f5';      // Deep rose black / Lavender blush
        surface = settings.darkMode ? '#3b0f20' : '#ffffff'; // Dark rose
        break;

      case 'red-black':
      default:
        // Solo Leveling Classic (Enhanced)
        primary = '#ef4444';    // red-500 (Brighter red)
        primaryDim = '#7f1d1d'; // red-900
        accent = '#f87171';     // red-400
        bg = settings.darkMode ? '#0a0a0a' : '#fef2f2';      // Neutral 950
        surface = settings.darkMode ? '#171717' : '#ffffff'; // Neutral 900
        break;
    }

    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-dim', primaryDim);
    root.style.setProperty('--color-accent', accent);
    root.style.setProperty('--color-bg', bg);
    root.style.setProperty('--color-surface', surface);

    // 4. Force Enable Notifications in State if Browser already granted permission
    if ('Notification' in window && Notification.permission === 'granted' && !settings.notificationsEnabled) {
       updateSettings({ notificationsEnabled: true });
    }

    StorageService.saveSettings(settings);
  }, [settings, isLoaded]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleNotifications = async (): Promise<boolean> => {
    if (!settings.notificationsEnabled) {
      // Enable
      const granted = await NotificationService.requestPermission();
      if (granted) {
        updateSettings({ notificationsEnabled: true });
        return true;
      }
      return false;
    } else {
      // Disable logic removed from UI access usually, but kept here for fallback
      updateSettings({ notificationsEnabled: false });
      return true;
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[settings.language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings, toggleNotifications, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};
