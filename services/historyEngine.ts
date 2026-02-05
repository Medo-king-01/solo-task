
import { Task, UserStats, WeeklyHistory, MonthlyHistory, PillarType, WeeklyReport, WeeklyReward, MonthlyReport, MonthlyReward } from '../types';
import { ReportEngine } from './reportEngine';
import { RewardEngine } from './rewardEngine';

// Helper for safe UUID
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const HistoryEngine = {
  /**
   * Calculates the Rank Score based on the formula:
   * (totalXP * 0.4) + (tasksCompleted * 0.3) + (streakMax * 0.2) + (exerciseConsistency * 0.1)
   */
  calculateRankScore: (xp: number, tasks: number, streak: number, exerciseCount: number): number => {
    // Normalize exercise consistency (assuming 5 times a week is "perfect" for score)
    const exerciseScore = Math.min(exerciseCount * 20, 100); 
    
    // Simple normalization for others to keep score readable (approx 0-1000 range usually)
    const score = (xp * 0.4) + (tasks * 10 * 0.3) + (streak * 10 * 0.2) + (exerciseScore * 0.1);
    return Math.floor(score);
  },

  /**
   * Creates a Weekly Snapshot from current stats and tasks
   */
  createWeeklySnapshot: (stats: UserStats, tasks: Task[]): WeeklyHistory => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = stats.currentWeekStart || endDate;
    const monthId = startDate.substring(0, 7); // YYYY-MM
    
    const totalCompletedEver = tasks.filter(t => t.completed).length || 1;
    const ratio = stats.weeklyTasksCompleted > 0 ? (stats.weeklyTasksCompleted / totalCompletedEver) : 0;

    // Estimate pillar breakdown for the week based on ratio if precise tracking isn't available
    // (In a full DB we would query by date, here we approximate for local storage efficiency)
    const getPillarCount = (p: PillarType) => Math.ceil(tasks.filter(t => t.pillar === p && t.completed).length * ratio);

    const snapshot: WeeklyHistory = {
        weekId: generateId(),
        monthId: monthId,
        weekIndexInMonth: Math.ceil(new Date(startDate).getDate() / 7),
        startDate,
        endDate,
        
        totalXP: stats.weeklyXpAccumulated,
        tasksCompleted: stats.weeklyTasksCompleted,
        streakMax: stats.weeklyMaxStreak,
        
        statsSummary: {
            learning: getPillarCount('Learning'),
            studying: getPillarCount('Studying'),
            exercise: getPillarCount('Exercise'),
            work: getPillarCount('Work'),
            entertainment: getPillarCount('Entertainment'),
            quran: getPillarCount('Quran'),
        },

        rankScore: HistoryEngine.calculateRankScore(
            stats.weeklyXpAccumulated, 
            stats.weeklyTasksCompleted, 
            stats.weeklyMaxStreak, 
            stats.weeklyExerciseCount
        ),
        createdAt: Date.now()
    };

    return snapshot;
  },

  /**
   * Aggregates 4 weeks into a Monthly Snapshot
   */
  createMonthlySnapshot: (monthId: string, weeks: WeeklyHistory[]): MonthlyHistory => {
    if (weeks.length === 0) throw new Error("No weeks to aggregate");

    const totalXP = weeks.reduce((sum, w) => sum + w.totalXP, 0);
    const totalTasks = weeks.reduce((sum, w) => sum + w.tasksCompleted, 0);
    const rankScores = weeks.map(w => w.rankScore);
    const bestScore = Math.max(...rankScores);
    const worstScore = Math.min(...rankScores);
    const maxStreak = Math.max(...weeks.map(w => w.streakMax));

    const consistencyRate = bestScore > 0 
        ? Math.round((weeks.reduce((sum, w) => sum + w.rankScore, 0) / weeks.length) / bestScore * 100) 
        : 0;

    // Determine Rank
    let monthRank = 'Novice';
    if (totalXP > 10000) monthRank = 'Legend';
    else if (totalXP > 5000) monthRank = 'Elite Hunter';
    else if (totalXP > 2000) monthRank = 'Grinder';
    else monthRank = 'Survivor';

    // Aggregate Pillar Stats
    const summary = {
        learning: 0, studying: 0, exercise: 0, work: 0, entertainment: 0, quran: 0
    };
    weeks.forEach(w => {
        summary.learning += w.statsSummary.learning;
        summary.studying += w.statsSummary.studying;
        summary.exercise += w.statsSummary.exercise;
        summary.work += w.statsSummary.work;
        summary.entertainment += w.statsSummary.entertainment;
        summary.quran += w.statsSummary.quran;
    });

    const snapshot: MonthlyHistory = {
        monthId,
        startDate: weeks[0].startDate,
        endDate: weeks[weeks.length - 1].endDate,
        weeksIncluded: weeks.map(w => w.weekId),
        
        totalXP,
        averageXP: Math.round(totalXP / weeks.length),
        totalTasks,
        
        bestWeekRankScore: bestScore,
        worstWeekRankScore: worstScore,
        
        statsSummary: summary,
        streakRecord: maxStreak,
        consistencyRate,
        monthRank,
        createdAt: Date.now()
    };

    return snapshot;
  },

  /**
   * ⚡ PROCESS TIME SKIP (The Engine Core)
   * Handles catching up on missed weeks/months when the user opens the app after a long time.
   */
  processTimeSkip: (
    stats: UserStats, 
    tasks: Task[], 
    weeklyHistory: WeeklyHistory[],
    monthlyHistory: MonthlyHistory[],
    weeklyReports: WeeklyReport[],
    monthlyReports: MonthlyReport[],
    weeklyRewards: WeeklyReward[],
    monthlyRewards: MonthlyReward[]
  ) => {
    const now = new Date();
    const currentWeekStart = new Date(stats.currentWeekStart);
    const diffTime = Math.abs(now.getTime() - currentWeekStart.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Copies to modify
    let newStats = { ...stats };
    let newWeeklyHistory = [...weeklyHistory];
    let newMonthlyHistory = [...monthlyHistory];
    let newWeeklyReports = [...weeklyReports];
    let newMonthlyReports = [...monthlyReports];
    let newWeeklyRewards = [...weeklyRewards];
    let newMonthlyRewards = [...monthlyRewards];
    let reportsGenerated = 0;

    // If more than 7 days passed, we need to close the previous week(s)
    if (diffDays >= 7) {
        // 1. Close the active week (the one stored in stats)
        const newSnapshot = HistoryEngine.createWeeklySnapshot(newStats, tasks);
        newWeeklyHistory.push(newSnapshot);
        
        const previousWeek = weeklyHistory.length > 0 ? weeklyHistory[weeklyHistory.length - 1] : undefined;
        const report = ReportEngine.generateWeeklyReport(newSnapshot, previousWeek);
        newWeeklyReports.push(report);
        newWeeklyRewards.push(RewardEngine.generateWeeklyReward(report));
        reportsGenerated++;

        // 2. Reset Stats for new week
        // Note: If user missed multiple weeks, we don't generate "Empty" reports for the middle weeks 
        // to avoid spamming the user with "Lazy" reports. We just jump to "Now".
        const todayStr = now.toISOString().split('T')[0];
        newStats.currentWeekStart = todayStr;
        newStats.weeklyXpAccumulated = 0;
        newStats.weeklyTasksCompleted = 0;
        newStats.weeklyMaxStreak = 0;
        newStats.weeklyExerciseCount = 0;

        // 3. Check for Monthly Closure
        // Group weeks by month
        const currentMonthId = now.toISOString().substring(0, 7);
        const snapshotMonthId = newSnapshot.monthId;
        
        // If the snapshot we just created belongs to a month that is now OVER, or we have 4+ weeks
        const weeksInSnapshotMonth = newWeeklyHistory.filter(w => w.monthId === snapshotMonthId);
        const isMonthDifferent = snapshotMonthId !== currentMonthId;

        if (weeksInSnapshotMonth.length >= 4 || isMonthDifferent) {
             // Avoid duplicate month generation
             if (!newMonthlyHistory.find(m => m.monthId === snapshotMonthId)) {
                 const newMonthlySnapshot = HistoryEngine.createMonthlySnapshot(snapshotMonthId, weeksInSnapshotMonth);
                 newMonthlyHistory.push(newMonthlySnapshot);

                 const previousMonth = monthlyHistory.length > 0 ? monthlyHistory[monthlyHistory.length - 1] : undefined;
                 const monthlyReport = ReportEngine.generateMonthlyReport(newMonthlySnapshot, previousMonth);
                 newMonthlyReports.push(monthlyReport);
                 newMonthlyRewards.push(RewardEngine.generateMonthlyReward(monthlyReport));
                 reportsGenerated++;
             }
        }
    }

    return {
        stats: newStats,
        weeklyHistory: newWeeklyHistory,
        monthlyHistory: newMonthlyHistory,
        weeklyReports: newWeeklyReports,
        monthlyReports: newMonthlyReports,
        weeklyRewards: newWeeklyRewards,
        monthlyRewards: newMonthlyRewards,
        reportsGenerated
    };
  }
};
