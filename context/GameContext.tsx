
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { GameState, Task, UserStats, PlayerProfile, WeeklyHistory, MonthlyHistory, WeeklyReport, MonthlyReport, WeeklyReward, MonthlyReward, DailyQuestProgress, BASE_XP_PER_LEVEL } from '../types';
import { ENERGY_RECOVERY_RATE, PILLAR_BASE_RATES, DIFFICULTY_CONFIG, XP_SCALING_FACTOR, SHADOW_TASKS, DAILY_QUEST_TARGETS, ENERGY_PER_QURAN_PAGE } from '../constants';
import { StorageService, defaultStats } from '../services/storage';
import { HistoryEngine } from '../services/historyEngine';
import { useToast } from './ToastContext';
import { useSettings } from './SettingsContext';
import { AudioService } from '../services/audioService';

interface GameContextType extends GameState {
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
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Helper for local date string YYYY-MM-DD
const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Helper for safe UUID
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// 2️⃣ Time Modifier Function
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
  const { soundEnabled, hapticsEnabled } = useSettings();

  // Ref to track if we are currently saving to avoid loops
  const isSaving = useRef(false);

  // Helper for Sound/Haptics
  const triggerFeedback = useCallback((type: 'success' | 'error' | 'levelup' | 'click' | 'boost') => {
      if (hapticsEnabled && navigator.vibrate) {
          if (type === 'success') navigator.vibrate(50);
          if (type === 'error') navigator.vibrate([50, 50, 50]);
          if (type === 'levelup') navigator.vibrate([100, 50, 100, 50, 200]);
          if (type === 'click') navigator.vibrate(10);
      }
      
      if (soundEnabled) {
          if (type === 'success') AudioService.playSuccess();
          if (type === 'error') AudioService.playError();
          if (type === 'levelup') AudioService.playLevelUp();
          if (type === 'click') AudioService.playClick();
          if (type === 'boost') AudioService.playBoost();
      }
  }, [soundEnabled, hapticsEnabled]);

  // --- 1. INITIAL LOAD & TIME TRAVEL ENGINE ---
  useEffect(() => {
    const loadedProfile = StorageService.loadProfile();
    const loadedStats = StorageService.loadStats();
    const loadedTasks = StorageService.loadTasks();
    const loadedWeekly = StorageService.loadWeeklyHistory();
    const loadedMonthly = StorageService.loadMonthlyHistory();
    const loadedWeeklyReports = StorageService.loadWeeklyReports();
    const loadedMonthlyReports = StorageService.loadMonthlyReports();
    const loadedWeeklyRewards = StorageService.loadWeeklyRewards();
    const loadedMonthlyRewards = StorageService.loadMonthlyRewards();

    if (loadedProfile) setPlayerProfile(loadedProfile);
    if (loadedTasks) setTasks(loadedTasks);
    
    // Set history states initially
    setWeeklyHistory(loadedWeekly);
    setMonthlyHistory(loadedMonthly);
    setWeeklyReports(loadedWeeklyReports);
    setMonthlyReports(loadedMonthlyReports);
    setWeeklyRewards(loadedWeeklyRewards);
    setMonthlyRewards(loadedMonthlyRewards);
    
    if (loadedStats) {
        let currentStats = { ...loadedStats };
        const today = getLocalDateString();
        const nowMs = Date.now();

        // B. Energy Regeneration (Offline Calculation)
        if (currentStats.energy < currentStats.maxEnergy) {
            const lastUpdate = currentStats.lastEnergyUpdate || nowMs;
            const diffInHours = (nowMs - lastUpdate) / (1000 * 60 * 60);
            const energyRecovered = Math.floor(diffInHours * ENERGY_RECOVERY_RATE);
            if (energyRecovered > 0) {
                currentStats.energy = Math.min(currentStats.maxEnergy, currentStats.energy + energyRecovered);
                currentStats.lastEnergyUpdate = nowMs; // Reset timer base
            }
        } else {
             currentStats.lastEnergyUpdate = nowMs;
        }

        // C. Daily Quest Reset & Streak Decay
        if (currentStats.dailyQuest?.lastResetDate !== today) {
             // Streak Logic: If last task was BEFORE yesterday, reset streak
             const lastTaskDate = new Date(currentStats.lastTaskCompletionDate || '1970-01-01');
             const yesterday = new Date();
             yesterday.setDate(yesterday.getDate() - 1);
             // Compare strings to avoid time issues
             const lastTaskStr = lastTaskDate.toISOString().split('T')[0];
             const yesterdayStr = yesterday.toISOString().split('T')[0];
             
             // If last task wasn't today AND wasn't yesterday -> Streak Broken
             if (lastTaskStr !== today && lastTaskStr !== yesterdayStr) {
                 if (currentStats.streak > 0) {
                    addToast("انقطعت السلسلة! 😢", "error");
                    currentStats.streak = 0;
                 }
             }

             // Reset Daily Quest
             currentStats.dailyQuest = {
                pushups: 0, situps: 0, squats: 0, run: 0,
                isCompleted: false,
                lastResetDate: today
            };
        }
        currentStats.lastLoginDate = today;

        // D. Process Time Skip (Weekly/Monthly Reports)
        const processed = HistoryEngine.processTimeSkip(
            currentStats,
            loadedTasks || [],
            loadedWeekly,
            loadedMonthly,
            loadedWeeklyReports,
            loadedMonthlyReports,
            loadedWeeklyRewards,
            loadedMonthlyRewards
        );

        if (processed.reportsGenerated > 0) {
            addToast(`تم إصدار ${processed.reportsGenerated} تقارير جديدة! 📊`, 'info');
            setWeeklyHistory(processed.weeklyHistory);
            setMonthlyHistory(processed.monthlyHistory);
            setWeeklyReports(processed.weeklyReports);
            setMonthlyReports(processed.monthlyReports);
            setWeeklyRewards(processed.weeklyRewards);
            setMonthlyRewards(processed.monthlyRewards);
            
            // Trigger batch save
            StorageService.saveWeeklyHistory(processed.weeklyHistory);
            StorageService.saveMonthlyHistory(processed.monthlyHistory);
            StorageService.saveWeeklyReports(processed.weeklyReports);
            StorageService.saveMonthlyReports(processed.monthlyReports);
            StorageService.saveWeeklyRewards(processed.weeklyRewards);
            StorageService.saveMonthlyRewards(processed.monthlyRewards);
        }

        setStats(processed.stats);
    }

    setIsLoaded(true);
  }, []);


  // --- 2. GAME LOOP (HEARTBEAT) ---
  // Runs frequently to handle Energy Regen and Shadow Tasks without relying on UI events
  useEffect(() => {
    if (!isLoaded || !playerProfile) return;

    const tick = () => {
        setStats(prev => {
            const now = Date.now();
            
            // Energy Logic
            let newEnergy = prev.energy;
            let lastUpdate = prev.lastEnergyUpdate;

            if (newEnergy < prev.maxEnergy) {
                const diffInHours = (now - lastUpdate) / (1000 * 60 * 60);
                const thresholdHours = 1 / ENERGY_RECOVERY_RATE; 

                if (diffInHours >= thresholdHours) {
                    const energyGained = Math.floor(diffInHours * ENERGY_RECOVERY_RATE);
                    newEnergy = Math.min(prev.maxEnergy, prev.energy + energyGained);
                    // Important: Advance lastUpdate by the EXACT amount consumed
                    lastUpdate = lastUpdate + (energyGained / ENERGY_RECOVERY_RATE) * (1000 * 60 * 60); 
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

    const interval = setInterval(tick, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isLoaded, playerProfile]);


  // --- 3. SHADOW TASK INJECTOR ---
  useEffect(() => {
    if (!isLoaded || !playerProfile) return;

    if (stats.energy < 20) {
        setTasks(currentTasks => {
            const hasShadowTask = currentTasks.some(t => t.isShadow && !t.completed);
            if (!hasShadowTask) {
                const randomShadow = SHADOW_TASKS[Math.floor(Math.random() * SHADOW_TASKS.length)];
                const shadowTask: Task = {
                    id: generateId(),
                    title: `👻 ${randomShadow.title}`,
                    description: randomShadow.description,
                    pillar: 'Entertainment',
                    completed: false,
                    energyCost: -randomShadow.energyRestore,
                    xpReward: 0,
                    difficulty: 'E',
                    createdAt: Date.now(),
                    order: -1,
                    isShadow: true
                };
                addToast("ظهرت مهمة ظل! استعد طاقتك الآن.", 'shadow');
                return [shadowTask, ...currentTasks];
            }
            return currentTasks;
        });
    }
  }, [stats.energy, isLoaded, playerProfile]); 


  // --- 4. AUTO-SAVE SYSTEM ---
  useEffect(() => {
    if (isLoaded && playerProfile && !isSaving.current) {
        isSaving.current = true;
        StorageService.saveStats(stats);
        StorageService.saveTasks(tasks);
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
        lastLoginDate: getLocalDateString()
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
        
        // Calculate based on difficulty
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
        
        // Rebalanced Reward: Not a flat 500 anymore. 
        // It provides 25% of current Level Max XP. 
        // This makes it always valuable but never "broken".
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
        
        // Bonus Stats for Weekly Challenge
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
            triggerFeedback('levelup');
        } else {
            addToast(`مكافأة التحدي: +${bonusXP} XP 🔥`, 'success');
            triggerFeedback('success');
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
                  // Daily Quest Reward: 100% Energy Restore + 15% Level XP
                  newStats.energy = newStats.maxEnergy;
                  const dailyXpReward = Math.floor(prev.maxXp * 0.15);
                  newStats.currentXp += dailyXpReward;
                  
                  newStats.hunterAttributes.strength += 2;
                  newStats.hunterAttributes.vitality += 1;
                  
                  addToast(`مهمة يومية مكتملة! طاقة كاملة + ${dailyXpReward}XP`, 'success');
                  triggerFeedback('success');
              }
          }
          triggerFeedback('click');
          return newStats;
      });
  }, [addToast, triggerFeedback]);

  const completeTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed) return;

    // Handle Shadow Task (Pure Recovery)
    if (task.isShadow) {
        setStats(prev => ({
            ...prev,
            energy: Math.min(prev.maxEnergy, prev.energy + Math.abs(task.energyCost))
        }));
        setTasks(prev => prev.filter(t => t.id !== id));
        addToast("تم استعادة بعض الطاقة! 👻", 'success');
        triggerFeedback('success');
        return;
    }

    const timeMod = getTimeModifier();
    // Re-calculate based on saved difficulty to be sure
    const baseRates = PILLAR_BASE_RATES[task.pillar];
    const multiplier = DIFFICULTY_CONFIG[task.difficulty || 'D'].multiplier;
    
    // Determine real costs
    const rawEnergyCost = Math.ceil(baseRates.energy * multiplier * timeMod.energy);
    // If base energy is negative (Entertainment/Quran), we are GAINING energy, so multiplier increases gain
    const finalEnergyCost = baseRates.energy < 0 ? baseRates.energy * multiplier : rawEnergyCost; 
    
    // Check affordability only if it COSTS energy
    if (task.pillar !== 'Quran' && finalEnergyCost > 0 && stats.energy < finalEnergyCost) {
        addToast("طاقة غير كافية! خذ استراحة.", 'error');
        triggerFeedback('error');
        return;
    }

    setTasks(currentTasks => currentTasks.map(t => t.id === id ? { ...t, completed: true } : t));

    setStats(prev => {
        const today = getLocalDateString();
        let newStreak = prev.streak;
        let lastTaskDate = prev.lastTaskCompletionDate;

        if (lastTaskDate !== today) {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            const yesterdayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

        // Task-Specific Attribute Growth (Scaled by Difficulty)
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
        } 
        else {
            // Apply Energy Change (Subtract cost, or Add if negative cost)
            newStats.energy = Math.min(newStats.maxEnergy, prev.energy - finalEnergyCost);
            
            let finalXpReward = Math.ceil(baseRates.xp * multiplier * timeMod.xp);
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
                addToast(`+${finalXpReward} XP | ${energyMsg}`, 'success');
            }

            newStats.currentXp = currentXp;
            newStats.level = level;
            newStats.maxXp = maxXp;
        }

        if (didLevelUp) {
            // Level Up Bonus for ALL stats
            newStats.hunterAttributes.strength += 1;
            newStats.hunterAttributes.intelligence += 1;
            newStats.hunterAttributes.vitality += 1;
            newStats.hunterAttributes.sense += 1;
            newStats.hunterAttributes.agility += 1;

            setShowLevelUpModal(true);
            triggerFeedback('levelup');
        } else {
            triggerFeedback('success');
        }

        return newStats;
    });
  }, [tasks, stats.energy, addToast, triggerFeedback]);

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

  const value = useMemo(() => ({
    stats,
    tasks,
    playerProfile,
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
    updateDailyQuest
  }), [stats, tasks, playerProfile, weeklyHistory, monthlyHistory, weeklyReports, monthlyReports, weeklyRewards, monthlyRewards, createProfile, updateProfile, addTask, editTask, deleteTask, completeTask, reorderTasks, moveTask, resetProgress, setWeeklyChallenge, completeWeeklyChallenge, showLevelUpModal, closeLevelUpModal, updateDailyQuest]);

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
