
import { UserStats, Task, BASE_XP_PER_LEVEL, PillarsData, PillarType, AppSettings, PlayerProfile, WeeklyHistory, MonthlyHistory, WeeklyReport, MonthlyReport, WeeklyReward, MonthlyReward } from '../types';
import { MAX_DAILY_ENERGY, PILLARS } from '../constants';

const STATS_KEY = 'game_stats';
const PILLARS_KEY = 'game_pillars';
const SETTINGS_KEY = 'game_settings';
const PLAYER_KEY = 'game_player';
const WEEKLY_HISTORY_KEY = 'game_history_weeks';
const MONTHLY_HISTORY_KEY = 'game_history_months';
const WEEKLY_REPORTS_KEY = 'game_reports_weekly';
const MONTHLY_REPORTS_KEY = 'game_reports_monthly';
// New Keys for Rewards
const WEEKLY_REWARDS_KEY = 'game_rewards_weekly';
const MONTHLY_REWARDS_KEY = 'game_rewards_monthly';

export const defaultStats: UserStats = {
  level: 1,
  currentXp: 0,
  maxXp: BASE_XP_PER_LEVEL,
  energy: MAX_DAILY_ENERGY,
  maxEnergy: MAX_DAILY_ENERGY,
  streak: 0,
  lastLoginDate: new Date().toISOString().split('T')[0],
  lastTaskCompletionDate: '',
  lastEnergyUpdate: Date.now(),
  quranPagesRead: 0,
  quranBadges: 0,
  // New Weekly Tracking Defaults
  currentWeekStart: new Date().toISOString().split('T')[0],
  weeklyXpAccumulated: 0,
  weeklyTasksCompleted: 0,
  weeklyMaxStreak: 0,
  weeklyExerciseCount: 0,
  // New Daily Quest
  dailyQuest: {
    pushups: 0,
    situps: 0,
    squats: 0,
    run: 0,
    isCompleted: false,
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  hunterAttributes: {
    strength: 10,
    intelligence: 10,
    vitality: 10,
    sense: 10,
    agility: 10
  }
};

export const defaultSettings: AppSettings = {
  language: 'ar',
  themeColor: 'red-black',
  darkMode: true,
  notificationsEnabled: false,
  allowDeleteCompleted: false,
  soundEnabled: true,
  hapticsEnabled: true,
};

// Helper to create a fresh structure every time
const createEmptyPillarsData = (): PillarsData => ({
  Learning: [],
  Studying: [],
  Exercise: [],
  Work: [],
  Entertainment: [],
  Quran: []
});

export const StorageService = {
  // --- Profile ---
  saveProfile: (profile: PlayerProfile) => {
    try {
        localStorage.setItem(PLAYER_KEY, JSON.stringify(profile));
    } catch (e) {
        console.error("Failed to save profile", e);
    }
  },

  loadProfile: (): PlayerProfile | null => {
    try {
        const data = localStorage.getItem(PLAYER_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
  },

  // --- Stats ---
  saveStats: (stats: UserStats) => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error("Failed to save stats", e);
    }
  },

  loadStats: (): UserStats | null => {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      // Migration: Ensure new fields exist by merging with default
      // Deep merge for nested objects like dailyQuest
      return { 
          ...defaultStats, 
          ...parsed, 
          dailyQuest: { ...defaultStats.dailyQuest, ...(parsed.dailyQuest || {}) },
          hunterAttributes: { ...defaultStats.hunterAttributes, ...(parsed.hunterAttributes || {}) }
      };
    } catch (e) {
      console.error("Failed to load stats", e);
      return null;
    }
  },

  // --- Tasks ---
  saveTasks: (tasks: Task[]) => {
    try {
      // CRITICAL FIX: Always create a fresh object with fresh arrays
      const pillarsData: PillarsData = createEmptyPillarsData();
      
      tasks.forEach(task => {
        if (pillarsData[task.pillar]) {
          pillarsData[task.pillar].push(task);
        }
      });
      localStorage.setItem(PILLARS_KEY, JSON.stringify(pillarsData));
    } catch (e) {
      console.error("Failed to save pillars", e);
    }
  },

  loadTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(PILLARS_KEY);
      if (!data) return [];

      const pillarsData: PillarsData = JSON.parse(data);
      let allTasks: Task[] = [];
      (Object.keys(pillarsData) as PillarType[]).forEach(key => {
        if (Array.isArray(pillarsData[key])) {
          allTasks = [...allTasks, ...pillarsData[key]];
        }
      });
      
      // Ensure tasks have order property if missing (migration)
      return allTasks.map((t, i) => ({
        ...t,
        order: t.order ?? i
      })).sort((a, b) => a.order - b.order);

    } catch (e) {
      console.error("Failed to load pillars", e);
      return [];
    }
  },

  // --- History ---
  saveWeeklyHistory: (history: WeeklyHistory[]) => {
    try {
      localStorage.setItem(WEEKLY_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save weekly history", e);
    }
  },

  loadWeeklyHistory: (): WeeklyHistory[] => {
    try {
      const data = localStorage.getItem(WEEKLY_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveMonthlyHistory: (history: MonthlyHistory[]) => {
    try {
      localStorage.setItem(MONTHLY_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save monthly history", e);
    }
  },

  loadMonthlyHistory: (): MonthlyHistory[] => {
    try {
      const data = localStorage.getItem(MONTHLY_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // --- Reports ---
  saveWeeklyReports: (reports: WeeklyReport[]) => {
    try {
      localStorage.setItem(WEEKLY_REPORTS_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error("Failed to save weekly reports", e);
    }
  },

  loadWeeklyReports: (): WeeklyReport[] => {
    try {
      const data = localStorage.getItem(WEEKLY_REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveMonthlyReports: (reports: MonthlyReport[]) => {
    try {
      localStorage.setItem(MONTHLY_REPORTS_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error("Failed to save monthly reports", e);
    }
  },

  loadMonthlyReports: (): MonthlyReport[] => {
    try {
      const data = localStorage.getItem(MONTHLY_REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // --- Rewards (New) ---
  saveWeeklyRewards: (rewards: WeeklyReward[]) => {
    try {
      localStorage.setItem(WEEKLY_REWARDS_KEY, JSON.stringify(rewards));
    } catch (e) {
      console.error("Failed to save weekly rewards", e);
    }
  },

  loadWeeklyRewards: (): WeeklyReward[] => {
    try {
      const data = localStorage.getItem(WEEKLY_REWARDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveMonthlyRewards: (rewards: MonthlyReward[]) => {
    try {
      localStorage.setItem(MONTHLY_REWARDS_KEY, JSON.stringify(rewards));
    } catch (e) {
      console.error("Failed to save monthly rewards", e);
    }
  },

  loadMonthlyRewards: (): MonthlyReward[] => {
    try {
      const data = localStorage.getItem(MONTHLY_REWARDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // --- Settings ---
  saveSettings: (settings: AppSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  },

  loadSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  },

  // --- Utility ---
  clearAll: () => {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(PILLARS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(PLAYER_KEY);
    localStorage.removeItem(WEEKLY_HISTORY_KEY);
    localStorage.removeItem(MONTHLY_HISTORY_KEY);
    localStorage.removeItem(WEEKLY_REPORTS_KEY);
    localStorage.removeItem(MONTHLY_REPORTS_KEY);
    localStorage.removeItem(WEEKLY_REWARDS_KEY);
    localStorage.removeItem(MONTHLY_REWARDS_KEY);
  },

  initializeNewAccount: (profile: PlayerProfile) => {
    StorageService.saveProfile(profile);
    StorageService.saveStats(defaultStats);
    StorageService.saveTasks([]);
    StorageService.saveSettings(defaultSettings);
    StorageService.saveWeeklyHistory([]);
    StorageService.saveMonthlyHistory([]);
    StorageService.saveWeeklyReports([]);
    StorageService.saveMonthlyReports([]);
    StorageService.saveWeeklyRewards([]);
    StorageService.saveMonthlyRewards([]);
  }
};
