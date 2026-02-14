
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { GameState, Task, UserStats, PlayerProfile, WeeklyHistory, MonthlyHistory, WeeklyReport, MonthlyReport, WeeklyReward, MonthlyReward, DailyQuestProgress, BASE_XP_PER_LEVEL, DayOfWeek } from '../types';
import { ENERGY_RECOVERY_RATE, PILLAR_BASE_RATES, DIFFICULTY_CONFIG, XP_SCALING_FACTOR, HIDDEN_QUESTS, DAILY_QUEST_TARGETS, ENERGY_PER_QURAN_PAGE, DAYS_OF_WEEK, XP_PENALTY_RATIO, MAX_DAILY_XP_LOSS_PERCENT, CRITICAL_HIT_CHANCE, CRITICAL_HIT_MULTIPLIER } from '../constants';
import { StorageService, defaultStats } from '../services/storage';
import { HistoryEngine } from '../services/historyEngine';
import { useToast } from './ToastContext';
import { useSettings } from '../context/SettingsContext';
import { AudioService } from '../services/audioService';
import { TranslationKey } from '../utils/translations';

interface GameContextType extends GameState {
  isLoaded: boolean; // Add this to interface
  createProfile: (profileData: Omit<PlayerProfile, 'createdAt'>) => void;
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  addTask: (task: Partial<Task>) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  reorderTasks: (reorderedTasks: Task[]) => void;
  moveTask: (taskId: string, direction: 'up' | 'down') => void;
  resetProgress: () => void;
  setWeeklyChallenge: (title: string) => void;
  completeWeeklyChallenge: () => void;
  updateDailyQuest: (type: keyof Omit<DailyQuestProgress, 'isCompleted' | 'lastResetDate'>, amount: number) => void;
  showLevelUpModal: boolean;
  closeLevelUpModal: () => void;
  importSaveData: (jsonData: string) => boolean;
  exportSaveData: () => string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// --- 🛠️ CORE TIME ENGINE UTILITIES ---

/**
 * Gets the local date string "YYYY-MM-DD" ensuring local timezone is respected.
 * Avoids UTC issues with toISOString().
 */
const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns the App-specific day index (0 = Saturday, 1 = Sunday, ... 6 = Friday).
 * Standard JS getDay() returns 0 for Sunday, 6 for Saturday.
 * Formula: (jsDay + 1) % 7 -> Converts Sat(6) to 0, Sun(0) to 1, Fri(5) to 6.
 */
const getAppDayIndex = (date: Date = new Date()): number => {
    return (date.getDay() + 1) % 7;
};

/**
 * Returns the date of the most recent Saturday (Start of App Week).
 * This ensures strict alignment of week cycles.
 */
const getStartOfCurrentWeek = (date: Date = new Date()): string => {
    const appDayIndex = getAppDayIndex(date); // How many days passed since Saturday
    const satDate = new Date(date);
    satDate.setDate(date.getDate() - appDayIndex);
    return getLocalDateString(satDate);
};

// Helper for safe UUID
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Time Modifier Function
const getTimeModifier = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return { xp: 1.15, energy: 0.85 }; // Morning Bonus
    if (hour >= 22 || hour < 4) return { xp: 0.85, energy: 1.15 }; // Night Penalty
    return { xp: 1, energy: 1 };
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  
  // History State
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistory[]>([]);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistory[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [weeklyRewards, setWeeklyRewards] = useState<WeeklyReward[]>([]);
  const [monthlyRewards, setMonthlyRewards] = useState<MonthlyReward[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const { addToast } = useToast();
  const { soundEnabled, hapticsEnabled, t } = useSettings();

  const isSaving = useRef(false);

  // Helper for Sound/Haptics
  const triggerFeedback = useCallback((type: 'success' | 'hard-success' | 'error' | 'levelup' | 'click' | 'boost' | 'mystery' | 'failure') => {
      if (hapticsEnabled && navigator.vibrate) {
          if (type === 'success') navigator.vibrate(50);
          if (type === 'hard-success') navigator.vibrate([100, 50, 100]);
          if (type === 'error') navigator.vibrate([50, 50, 50]);
          if (type === 'levelup') navigator.vibrate([100, 50, 100, 50, 200]);
          if (type === 'click') navigator.vibrate(10);
          if (type === 'failure') navigator.vibrate([500, 200]);
      }
      
      if (soundEnabled) {
          if (type === 'success') AudioService.playTaskComplete();
          if (type === 'hard-success') AudioService.playHardTaskComplete();
          if (type === 'error') AudioService.playEnergyWarning();
          if (type === 'click') AudioService.playClick(); 
          if (type === 'boost') AudioService.playXpGain();
          if (type === 'mystery') AudioService.playMysteryReveal();
          if (type === 'failure') AudioService.playFailure();
      }
  }, [soundEnabled, hapticsEnabled]);

  // --- 1. INITIAL LOAD & TIME TRAVEL ENGINE ---
  useEffect(() => {
    StorageService.init();

    const loadedProfile = StorageService.loadProfile();
    const loadedStats = StorageService.loadStats();
    const loadedTasks = StorageService.loadTasks();
    
    // Load History
    setWeeklyHistory(StorageService.loadWeeklyHistory());
    setMonthlyHistory(StorageService.loadMonthlyHistory());
    setWeeklyReports(StorageService.loadWeeklyReports());
    setMonthlyReports(StorageService.loadMonthlyReports());
    setWeeklyRewards(StorageService.loadWeeklyRewards());
    setMonthlyRewards(StorageService.loadMonthlyRewards());

    if (loadedProfile) setPlayerProfile(loadedProfile);
    if (loadedTasks) setTasks(loadedTasks);
    
    if (loadedStats) {
        let currentStats = { ...loadedStats };
        const todayStr = getLocalDateString(); // Normalized YYYY-MM-DD
        const nowMs = Date.now();
        const isNewDay = currentStats.lastLoginDate !== todayStr;

        // 🛠️ TIME FIX: Ensure currentWeekStart is strictly aligned to a Saturday
        const calculatedWeekStart = getStartOfCurrentWeek();
        
        // If the saved week start doesn't match the calculated Saturday, user might have traveled
        // or the initial account creation wasn't on a Saturday. We soft-correct it if it's the same week,
        // or let the time skip logic handle it if it's a new week.
        if (!currentStats.currentWeekStart) {
             currentStats.currentWeekStart = calculatedWeekStart;
        }

        // --- MISSED TASK LOGIC (Robust Index Comparison) ---
        let updatedTasks = loadedTasks ? [...loadedTasks] : [];
        let missedCount = 0;
        let totalXpPenalty = 0;

        // Map Day Names to App Index (0=Saturday ... 6=Friday)
        const dayNameIndices: Record<string, number> = { 
            'Saturday': 0, 'Sunday': 1, 'Monday': 2, 'Tuesday': 3, 
            'Wednesday': 4, 'Thursday': 5, 'Friday': 6 
        };
        
        const currentAppDayIdx = getAppDayIndex(); // Today's Index (0-6)

        // Check if we are in a completely new week relative to saved data
        const savedWeekStartObj = new Date(currentStats.currentWeekStart);
        const diffTime = new Date().getTime() - savedWeekStartObj.getTime();
        const daysSinceWeekStart = diffTime / (1000 * 3600 * 24);
        
        // Strict Week Cycle Check (> 6.9 days ensures we passed the full week cycle)
        const isNewWeekCycle = daysSinceWeekStart > 6.9;

        updatedTasks = updatedTasks.map(t => {
            if (!t.completed && !t.isMissed && t.day) {
                const taskDayIdx = dayNameIndices[t.day];
                let isFailure = false;

                if (isNewWeekCycle) {
                    // New week started -> All uncompleted tasks from previous week are failures
                    isFailure = true;
                } else {
                    // Same week -> Check if day has passed
                    // Example: Today is Monday (2). Task is Sunday (1). 1 < 2 => Failure.
                    if (taskDayIdx < currentAppDayIdx) {
                        isFailure = true;
                    }
                }

                if (isFailure) {
                    missedCount++;
                    const penalty = Math.ceil(t.xpReward * XP_PENALTY_RATIO);
                    totalXpPenalty += penalty;
                    return { ...t, isMissed: true };
                }
            }
            return t;
        });

        // Apply Penalties
        if (missedCount > 0) {
            const maxLoss = Math.floor(currentStats.currentXp * MAX_DAILY_XP_LOSS_PERCENT);
            const actualXpLoss = Math.min(totalXpPenalty, maxLoss);
            
            currentStats.currentXp = Math.max(0, currentStats.currentXp - actualXpLoss);
            currentStats.weeklyMissedTasks = (currentStats.weeklyMissedTasks || 0) + missedCount;
            currentStats.weeklyXpLost = (currentStats.weeklyXpLost || 0) + actualXpLoss;

            setTimeout(() => {
                addToast(`⚠️ ${missedCount} مهام فائتة! -${actualXpLoss} XP`, 'error');
                triggerFeedback('failure');
            }, 2000);
            
            setTasks(updatedTasks);
        }

        // --- ENERGY RECOVERY ---
        let targetEnergy = currentStats.energy;
        if (isNewDay) {
            targetEnergy = currentStats.maxEnergy; // Daily Full Reset
            currentStats.lastEnergyUpdate = nowMs;
        } else {
            // Intraday Recovery
            if (currentStats.energy < currentStats.maxEnergy) {
                const lastUpdate = currentStats.lastEnergyUpdate || nowMs;
                const diffInHours = (nowMs - lastUpdate) / (1000 * 60 * 60);
                const energyRecovered = Math.floor(diffInHours * ENERGY_RECOVERY_RATE);
                
                if (energyRecovered > 0) {
                    currentStats.energy = Math.min(currentStats.maxEnergy, currentStats.energy + energyRecovered);
                    currentStats.lastEnergyUpdate = nowMs;
                }
            } else {
                currentStats.lastEnergyUpdate = nowMs;
            }
            targetEnergy = currentStats.energy;
        }

        // --- DAILY QUEST RESET & STREAK ---
        if (currentStats.dailyQuest?.lastResetDate !== todayStr) {
             const lastTaskDateStr = currentStats.lastTaskCompletionDate || '1970-01-01';
             
             // Calculate yesterday safely using date subtraction
             const yesterdayObj = new Date();
             yesterdayObj.setDate(yesterdayObj.getDate() - 1);
             const yesterdayStr = getLocalDateString(yesterdayObj);

             // Streak Logic: If last completion wasn't today OR yesterday, streak breaks.
             if (lastTaskDateStr !== todayStr && lastTaskDateStr !== yesterdayStr) {
                 if (currentStats.streak > 0) {
                    addToast("انقطعت السلسلة! 😢", "error");
                    currentStats.streak = 0;
                 }
             }

             currentStats.dailyQuest = {
                pushups: 0, situps: 0, squats: 0, run: 0,
                isCompleted: false,
                lastResetDate: todayStr
            };
        }
        currentStats.lastLoginDate = todayStr;

        // --- PROCESS WEEKLY/MONTHLY TRANSITIONS ---
        // Pass the calculatedWeekStart to force alignment if a new week begins
        const processed = HistoryEngine.processTimeSkip(
            currentStats,
            updatedTasks,
            StorageService.loadWeeklyHistory(), // Pass fresh loaded data
            StorageService.loadMonthlyHistory(),
            StorageService.loadWeeklyReports(),
            StorageService.loadMonthlyReports(),
            StorageService.loadWeeklyRewards(),
            StorageService.loadMonthlyRewards()
        );

        if (processed.shouldResetTasks) {
            // New week started: Update week start date to the correct Saturday
            processed.stats.currentWeekStart = calculatedWeekStart; 
            setTasks(processed.tasks);
            addToast("🗓️ أسبوع جديد بدأ! تم أرشفة المهام السابقة.", 'info');
            StorageService.saveTasks(processed.tasks);
        } else if (missedCount > 0) {
            setTasks(updatedTasks);
        }

        // Update History State if new reports generated
        if (processed.reportsGenerated > 0) {
            addToast(`تم إصدار ${processed.reportsGenerated} تقارير جديدة! 📊`, 'info');
            if(soundEnabled) AudioService.playMysteryReveal();

            setWeeklyHistory(processed.weeklyHistory);
            setMonthlyHistory(processed.monthlyHistory);
            setWeeklyReports(processed.weeklyReports);
            setMonthlyReports(processed.monthlyReports);
            setWeeklyRewards(processed.weeklyRewards);
            setMonthlyRewards(processed.monthlyRewards);
            
            // Batch Save
            StorageService.saveWeeklyHistory(processed.weeklyHistory);
            StorageService.saveMonthlyHistory(processed.monthlyHistory);
            StorageService.saveWeeklyReports(processed.weeklyReports);
            StorageService.saveMonthlyReports(processed.monthlyReports);
            StorageService.saveWeeklyRewards(processed.weeklyRewards);
            StorageService.saveMonthlyRewards(processed.monthlyRewards);
        }

        setStats(processed.stats);
        
        if (isNewDay) {
            setTimeout(() => {
                setStats(prev => ({ ...prev, energy: targetEnergy }));
                if (soundEnabled) AudioService.playEnergyRestore();
                addToast("🌅 يوم جديد! تم استعادة طاقتك بالكامل.", 'success');
            }, 800);
        }
    }

    setIsLoaded(true);
  }, []);


  // --- 2. GAME LOOP (HEARTBEAT) ---
  useEffect(() => {
    if (!isLoaded || !playerProfile) return;

    const tick = () => {
        setStats(prev => {
            const now = Date.now();
            let newEnergy = prev.energy;
            let lastUpdate = prev.lastEnergyUpdate;

            if (newEnergy < prev.maxEnergy) {
                const diffInHours = (now - lastUpdate) / (1000 * 60 * 60);
                const thresholdHours = 1 / ENERGY_RECOVERY_RATE; 

                if (diffInHours >= thresholdHours) {
                    const energyGained = Math.floor(diffInHours * ENERGY_RECOVERY_RATE);
                    newEnergy = Math.min(prev.maxEnergy, prev.energy + energyGained);
                    lastUpdate = lastUpdate + (energyGained / ENERGY_RECOVERY_RATE) * (1000 * 60 * 60); 
                    
                    if (soundEnabled) AudioService.playEnergyRestore();
                }
            } else {
                lastUpdate = now;
            }

            if (newEnergy === prev.energy && lastUpdate === prev.lastEnergyUpdate) {
                return prev;
            }

            return {
                ...prev,
                energy: newEnergy,
                lastEnergyUpdate: lastUpdate
            };
        });
    };

    // Optimization: Run tick every 60 seconds instead of 30.
    // Energy recovery is slow (8/hour), so strict 30s checks are unnecessary overhead.
    const interval = setInterval(tick, 60000); 
    return () => clearInterval(interval);
  }, [isLoaded, playerProfile, soundEnabled]);


  // --- 3. SHADOW TASK MANAGER (UPDATED) ---
  useEffect(() => {
    if (!isLoaded || !playerProfile) return;

    // SPAWN LOGIC: Energy Critical (< 20%)
    if (stats.energy <= 20) {
        setTasks(currentTasks => {
            const hasShadowTask = currentTasks.some(t => t.isShadow && !t.completed);
            if (!hasShadowTask) {
                const randomQuest = HIDDEN_QUESTS[Math.floor(Math.random() * HIDDEN_QUESTS.length)];
                
                // Use translations dynamically for current locale
                const title = t(`${randomQuest.id}_title` as TranslationKey);
                const desc = t(`${randomQuest.id}_desc` as TranslationKey);

                const shadowTask: Task = {
                    id: generateId(),
                    title: `⚠ ${title}`,
                    description: desc,
                    pillar: 'Entertainment',
                    completed: false,
                    energyCost: -randomQuest.energyRestore,
                    xpReward: 0,
                    difficulty: 'E',
                    createdAt: Date.now(),
                    order: -999,
                    isShadow: true
                };
                
                addToast(t('shadow_msg_spawn'), 'shadow');
                if (soundEnabled) AudioService.playMysteryReveal();
                
                return [shadowTask, ...currentTasks];
            }
            return currentTasks;
        });
    }

    // DESPAWN LOGIC: Energy Stabilized (> 40%)
    if (stats.energy > 40) {
         setTasks(currentTasks => {
            const hasActiveShadow = currentTasks.some(t => t.isShadow && !t.completed);
            if (hasActiveShadow) {
                addToast(t('shadow_msg_clear'), 'info');
                return currentTasks.filter(t => !(t.isShadow && !t.completed));
            }
            return currentTasks;
         });
    }
  }, [stats.energy, isLoaded, playerProfile, soundEnabled, t]); 


  // --- 4. AUTO-SAVE SYSTEM ---
  useEffect(() => {
    if (isLoaded && playerProfile && !isSaving.current) {
        isSaving.current = true;
        const statsSaved = StorageService.saveStats(stats);
        const tasksSaved = StorageService.saveTasks(tasks);
        
        if (!statsSaved || !tasksSaved) {
            console.warn("Critical: Auto-save failed. Check storage quota.");
        }
        setTimeout(() => { isSaving.current = false; }, 100);
    }
  }, [stats, tasks, isLoaded, playerProfile]);


  // --- ACTIONS ---

  const createProfile = useCallback((data: Omit<PlayerProfile, 'createdAt'>) => {
    const newProfile: PlayerProfile = {
        ...data,
        createdAt: new Date().toISOString()
    };
    StorageService.initializeNewAccount(newProfile);
    setPlayerProfile(newProfile);
    setStats({
        ...defaultStats,
        lastLoginDate: getLocalDateString(),
        currentWeekStart: getStartOfCurrentWeek() // Align to Saturday immediately
    });
    setTasks([]);
    triggerFeedback('success');
    addToast('أهلاً بك في رحلة التطوير! 🚀', 'success');
  }, [addToast, triggerFeedback]);

  const updateProfile = useCallback((updates: Partial<PlayerProfile>) => {
    setPlayerProfile(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...updates };
        StorageService.saveProfile(updated);
        return updated;
    });
    addToast('تم تحديث البيانات', 'success');
  }, [addToast]);

  const addTask = useCallback((taskData: Partial<Task>) => {
    setTasks(prev => {
        const maxOrder = prev.length > 0 ? Math.max(...prev.map(t => t.order)) : 0;
        const pillar = taskData.pillar || 'Work';
        const difficulty = taskData.difficulty || 'D';
        
        const baseRates = PILLAR_BASE_RATES[pillar];
        const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;

        const newTask: Task = {
          id: generateId(),
          title: taskData.title || (pillar === 'Quran' ? 'ورد القرآن' : 'مهمة جديدة'),
          description: taskData.description || '',
          pillar: pillar,
          completed: false,
          difficulty: difficulty,
          energyCost: Math.ceil(baseRates.energy * multiplier),
          xpReward: Math.ceil(baseRates.xp * multiplier),
          dueDate: taskData.dueDate,
          day: taskData.day,
          createdAt: Date.now(),
          order: maxOrder + 1,
          pages: taskData.pages
        };
        return [...prev, newTask];
    });
    triggerFeedback('click');
    addToast('تمت إضافة المهمة بنجاح', 'success');
  }, [addToast, triggerFeedback]);

  const editTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const pillar = updates.pillar || t.pillar;
      const difficulty = updates.difficulty || t.difficulty;
      const baseRates = PILLAR_BASE_RATES[pillar];
      const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;

      return { 
          ...t, 
          ...updates,
          energyCost: Math.ceil(baseRates.energy * multiplier),
          xpReward: Math.ceil(baseRates.xp * multiplier)
      };
    }));
    addToast('تم حفظ التعديلات', 'success');
  }, [addToast]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    addToast('تم حذف المهمة', 'info');
  }, [addToast]);

  const reorderTasks = useCallback((reorderedTasks: Task[]) => {
      setTasks(reorderedTasks);
  }, []);

  const moveTask = useCallback((taskId: string, direction: 'up' | 'down') => {
      setTasks(prevTasks => {
        const sortedTasks = [...prevTasks].sort((a, b) => a.order - b.order);
        const sortedIndex = sortedTasks.findIndex(t => t.id === taskId);
        if (sortedIndex === -1) return prevTasks;
        if (direction === 'up' && sortedIndex > 0) {
            const tempOrder = sortedTasks[sortedIndex].order;
            sortedTasks[sortedIndex].order = sortedTasks[sortedIndex - 1].order;
            sortedTasks[sortedIndex - 1].order = tempOrder;
        } else if (direction === 'down' && sortedIndex < sortedTasks.length - 1) {
            const tempOrder = sortedTasks[sortedIndex].order;
            sortedTasks[sortedIndex].order = sortedTasks[sortedIndex + 1].order;
            sortedTasks[sortedIndex + 1].order = tempOrder;
        }
        return [...sortedTasks];
      });
      triggerFeedback('click');
  }, [triggerFeedback]);

  const setWeeklyChallenge = useCallback((title: string) => {
    setStats(prev => ({
        ...prev,
        weeklyChallenge: {
            id: generateId(),
            title: title,
            weekStart: getLocalDateString(),
            completed: false
        }
    }));
    triggerFeedback('click');
    addToast('تم تحديد التحدي الأسبوعي! 🎯', 'info');
  }, [addToast, triggerFeedback]);

  const completeWeeklyChallenge = useCallback(() => {
    setStats(prev => {
        if (!prev.weeklyChallenge || prev.weeklyChallenge.completed) return prev;
        
        const bonusXP = Math.floor(prev.maxXp * 0.25);
        
        let currentXp = prev.currentXp + bonusXP;
        let weeklyXpAccumulated = (prev.weeklyXpAccumulated || 0) + bonusXP;

        let level = prev.level;
        let maxXp = prev.maxXp;
        let didLevelUp = false;

        while (currentXp >= maxXp) {
            currentXp -= maxXp;
            level += 1;
            maxXp = Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_SCALING_FACTOR, level - 1));
            didLevelUp = true;
        }
        
        let newAttributes = { ...prev.hunterAttributes };
        if (didLevelUp) {
             newAttributes.strength += 1;
             newAttributes.intelligence += 1;
             newAttributes.vitality += 1;
             newAttributes.sense += 1;
             newAttributes.agility += 1;
        }

        if (didLevelUp) {
            setShowLevelUpModal(true);
        } else {
            addToast(`مكافأة التحدي: +${bonusXP} XP 🔥`, 'success');
            triggerFeedback('hard-success');
        }

        return {
            ...prev,
            weeklyChallenge: { ...prev.weeklyChallenge!, completed: true },
            currentXp, level, maxXp, weeklyXpAccumulated,
            hunterAttributes: newAttributes
        };
    });
  }, [addToast, triggerFeedback]);

  const closeLevelUpModal = useCallback(() => {
    setShowLevelUpModal(false);
  }, []);

  const updateDailyQuest = useCallback((type: keyof Omit<DailyQuestProgress, 'isCompleted' | 'lastResetDate'>, amount: number) => {
      setStats(prev => {
          if (!prev.dailyQuest || prev.dailyQuest.isCompleted) return prev;

          const newStats = { ...prev };
          newStats.dailyQuest = { ...prev.dailyQuest, [type]: Math.min(DAILY_QUEST_TARGETS[type], amount) };

          const { pushups, situps, squats, run } = newStats.dailyQuest;
          const target = DAILY_QUEST_TARGETS;
          
          if (pushups >= target.pushups && situps >= target.situps && squats >= target.squats && run >= target.run) {
              if (!prev.dailyQuest.isCompleted) {
                  newStats.dailyQuest.isCompleted = true;
                  newStats.energy = newStats.maxEnergy;
                  const dailyXpReward = Math.floor(prev.maxXp * 0.15);
                  newStats.currentXp += dailyXpReward;
                  
                  newStats.hunterAttributes.strength += 2;
                  newStats.hunterAttributes.vitality += 1;
                  
                  addToast(`مهمة يومية مكتملة! طاقة كاملة + ${dailyXpReward}XP`, 'success');
                  triggerFeedback('hard-success');
              }
          }
          triggerFeedback('click');
          return newStats;
      });
  }, [addToast, triggerFeedback]);

  const completeTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed || task.isMissed) return;

    if (task.isShadow) {
        setStats(prev => ({
            ...prev,
            energy: Math.min(prev.maxEnergy, prev.energy + Math.abs(task.energyCost))
        }));
        setTasks(prev => prev.filter(t => t.id !== id));
        addToast("تم استعادة بعض الطاقة! 👻", 'success');
        triggerFeedback('mystery');
        return;
    }

    const timeMod = getTimeModifier();
    const baseRates = PILLAR_BASE_RATES[task.pillar];
    const multiplier = DIFFICULTY_CONFIG[task.difficulty || 'D'].multiplier;
    const rawEnergyCost = Math.ceil(baseRates.energy * multiplier * timeMod.energy);
    const finalEnergyCost = baseRates.energy < 0 ? baseRates.energy * multiplier : rawEnergyCost; 
    
    // Safety check for energy
    if (task.pillar !== 'Quran' && finalEnergyCost > 0 && stats.energy < finalEnergyCost) {
        addToast("طاقة غير كافية! خذ استراحة.", 'error');
        triggerFeedback('error');
        return;
    }

    // Critical Hit Logic
    const isCritical = Math.random() < CRITICAL_HIT_CHANCE;
    
    setTasks(currentTasks => currentTasks.map(t => t.id === id ? { ...t, completed: true } : t));

    setStats(prev => {
        const today = getLocalDateString();
        let newStreak = prev.streak;
        let lastTaskDate = prev.lastTaskCompletionDate;

        if (lastTaskDate !== today) {
            const yesterdayObj = new Date();
            yesterdayObj.setDate(yesterdayObj.getDate() - 1);
            const yesterdayStr = getLocalDateString(yesterdayObj);
            
            if (lastTaskDate === yesterdayStr) newStreak += 1;
            else newStreak = 1;
            lastTaskDate = today;
        }

        let weeklyTasks = (prev.weeklyTasksCompleted || 0) + 1;
        let weeklyStreak = Math.max((prev.weeklyMaxStreak || 0), newStreak);
        let weeklyExercise = (prev.weeklyExerciseCount || 0) + (task.pillar === 'Exercise' ? 1 : 0);

        let newStats = { 
            ...prev,
            streak: newStreak,
            lastTaskCompletionDate: lastTaskDate,
            lastEnergyUpdate: Date.now(),
            weeklyTasksCompleted: weeklyTasks,
            weeklyMaxStreak: weeklyStreak,
            weeklyExerciseCount: weeklyExercise,
            hunterAttributes: { ...prev.hunterAttributes }
        };

        const attrGain = 0.5 * multiplier;
        if (task.pillar === 'Exercise') newStats.hunterAttributes.strength += attrGain;
        if (task.pillar === 'Studying' || task.pillar === 'Learning') newStats.hunterAttributes.intelligence += attrGain;
        if (task.pillar === 'Entertainment') newStats.hunterAttributes.vitality += attrGain;
        if (task.pillar === 'Quran') newStats.hunterAttributes.sense += attrGain;
        if (task.pillar === 'Work') newStats.hunterAttributes.agility += attrGain;

        let didLevelUp = false;

        if (task.pillar === 'Quran') {
            const pagesToAdd = task.pages || 1;
            newStats.quranPagesRead = (prev.quranPagesRead || 0) + pagesToAdd;
            const energyGain = pagesToAdd * ENERGY_PER_QURAN_PAGE;
            newStats.energy = Math.min(newStats.maxEnergy, prev.energy + energyGain);
            addToast(`✅ ${pagesToAdd} صفحة | +${energyGain}⚡ طاقة`, 'success');
            if(soundEnabled) AudioService.playEnergyRestore();
        } 
        else {
            newStats.energy = Math.min(newStats.maxEnergy, Math.max(0, prev.energy - finalEnergyCost));
            
            let baseReward = Math.ceil(baseRates.xp * multiplier * timeMod.xp);
            let finalXpReward = isCritical ? Math.ceil(baseReward * CRITICAL_HIT_MULTIPLIER) : baseReward;
            
            let currentXp = prev.currentXp + finalXpReward;
            newStats.weeklyXpAccumulated = (prev.weeklyXpAccumulated || 0) + finalXpReward;

            let level = prev.level;
            let maxXp = prev.maxXp;
            while (currentXp >= maxXp) {
                currentXp -= maxXp;
                level += 1;
                maxXp = Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_SCALING_FACTOR, level - 1));
                didLevelUp = true;
            }

            if (!didLevelUp) {
                const energyMsg = finalEnergyCost > 0 ? `-${finalEnergyCost}⚡` : `+${Math.abs(finalEnergyCost)}⚡`;
                const critMsg = isCritical ? "⚡ ضربة حرجة! " : "";
                addToast(`${critMsg}+${finalXpReward} XP | ${energyMsg}`, isCritical ? 'hard-success' : 'success');
                
                if (isCritical) {
                    newStats.energy = Math.min(newStats.maxEnergy, newStats.energy + 5);
                    triggerFeedback('hard-success');
                } else {
                    const isHard = ['B', 'A', 'S'].includes(task.difficulty);
                    if (isHard) triggerFeedback('hard-success');
                    else triggerFeedback('success');
                }
            } else {
                 if(soundEnabled) AudioService.playXpGain();
            }

            newStats.currentXp = currentXp;
            newStats.level = level;
            newStats.maxXp = maxXp;
        }

        if (didLevelUp) {
            newStats.hunterAttributes.strength += 1;
            newStats.hunterAttributes.intelligence += 1;
            newStats.hunterAttributes.vitality += 1;
            newStats.hunterAttributes.sense += 1;
            newStats.hunterAttributes.agility += 1;

            setShowLevelUpModal(true);
        }

        return newStats;
    });
  }, [tasks, stats.energy, addToast, triggerFeedback, soundEnabled]);

  const resetProgress = useCallback(() => {
    if (confirm("هل أنت متأكد من حذف الحساب وإعادة البدء؟")) {
      StorageService.clearAll();
      setStats(defaultStats);
      setTasks([]);
      setWeeklyHistory([]);
      setMonthlyHistory([]);
      setWeeklyReports([]);
      setMonthlyReports([]);
      setWeeklyRewards([]);
      setMonthlyRewards([]);
      setPlayerProfile(null);
      addToast('تم إعادة تعيين الحساب', 'info');
      triggerFeedback('error');
    }
  }, [addToast, triggerFeedback]);

  // --- EXPORT/IMPORT ---
  const exportSaveData = useCallback(() => {
      return StorageService.createBackup();
  }, []);

  const importSaveData = useCallback((jsonData: string) => {
      const success = StorageService.restoreBackup(jsonData);
      if (success) {
          addToast("تم استعادة النسخة الاحتياطية. جاري إعادة التحميل...", "success");
          setTimeout(() => window.location.reload(), 1500);
          return true;
      } else {
          addToast("فشل في استعادة النسخة. الملف غير صالح.", "error");
          return false;
      }
  }, [addToast]);

  const value = useMemo(() => ({
    stats,
    tasks,
    playerProfile,
    isLoaded, // Added to context value
    weeklyHistory,
    monthlyHistory,
    weeklyReports,
    monthlyReports,
    weeklyRewards,
    monthlyRewards,
    createProfile,
    updateProfile,
    addTask,
    editTask,
    deleteTask,
    completeTask, 
    reorderTasks,
    moveTask,
    resetProgress,
    setWeeklyChallenge,
    completeWeeklyChallenge,
    showLevelUpModal,
    closeLevelUpModal,
    updateDailyQuest,
    exportSaveData,
    importSaveData
  }), [stats, tasks, playerProfile, isLoaded, weeklyHistory, monthlyHistory, weeklyReports, monthlyReports, weeklyRewards, monthlyRewards, createProfile, updateProfile, addTask, editTask, deleteTask, completeTask, reorderTasks, moveTask, resetProgress, setWeeklyChallenge, completeWeeklyChallenge, showLevelUpModal, closeLevelUpModal, updateDailyQuest, exportSaveData, importSaveData]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};
