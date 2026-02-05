
import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Dashboard } from './components/Dashboard';
import { PillarsView } from './components/PillarsView';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { AICoach } from './components/AICoach';
import { SettingsScreen } from './components/SettingsScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { StatisticsScreen } from './components/StatisticsScreen';
import { ToastSystem } from './components/ToastSystem';
import { AppTab, PillarType, StackScreen, Task, DayOfWeek } from './types';
import { Settings as SettingsIcon, ArrowRight } from 'lucide-react';
import { LearningScreen, StudyingScreen, ExerciseScreen, WorkScreen, EntertainmentScreen, QuranScreen } from './components/PillarScreens';
import { TaskFormModal } from './components/TaskFormModal';
import { LevelUpModal } from './components/LevelUpModal';
import { SmartNotificationManager } from './components/SmartNotificationManager';
import { App as CapacitorApp } from '@capacitor/app';
import { MotivationService } from './services/motivationService';

// Helper to get current day name in English to match DayOfWeek type
const getCurrentDayOfWeek = (): DayOfWeek => {
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const AppContent: React.FC = () => {
  const { playerProfile, addTask, editTask } = useGame();
  const { t } = useSettings();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [currentStackScreen, setCurrentStackScreen] = useState<StackScreen>('ROOT');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultPillar, setModalDefaultPillar] = useState<PillarType>('Learning');
  
  // Initialize with current actual day
  const [modalDefaultDay, setModalDefaultDay] = useState<DayOfWeek>(getCurrentDayOfWeek());

  const navigateToPillar = (pillar: PillarType) => {
    setActiveTab(AppTab.PILLARS); 
    setCurrentStackScreen(pillar);
  };

  const handleBack = () => {
    setCurrentStackScreen('ROOT');
    setActiveTab(AppTab.DASHBOARD);
  };

  const goHome = () => {
    setActiveTab(AppTab.DASHBOARD);
    setCurrentStackScreen('ROOT');
  };

  // Hardware Back Button Handler
  useEffect(() => {
    let listener: any;
    
    const setupListener = async () => {
        listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (isModalOpen) {
                setIsModalOpen(false);
            } else if (currentStackScreen !== 'ROOT') {
                handleBack();
            } else if (activeTab !== AppTab.DASHBOARD) {
                goHome();
            } else {
                CapacitorApp.exitApp();
            }
        });
    };

    setupListener();

    return () => {
        if (listener) {
            listener.remove();
        }
    };
  }, [currentStackScreen, activeTab, isModalOpen]);

  // Daily Motivation Check
  useEffect(() => {
    if (playerProfile) {
        const dailyQuote = MotivationService.checkDailyQuote();
        if (dailyQuote) {
            setTimeout(() => {
                addToast(`💡 ${dailyQuote.text}`, 'info');
            }, 1500);
        }
    }
  }, [playerProfile, addToast]);

  // Handlers for Modal
  const openAddTask = (pillar?: PillarType, day?: DayOfWeek) => {
    setEditingTask(null);
    setModalDefaultPillar(pillar || (currentStackScreen !== 'ROOT' ? (currentStackScreen as PillarType) : 'Learning'));
    // Automatically set the day to TODAY if no specific day is passed
    setModalDefaultDay(day || getCurrentDayOfWeek());
    setIsModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
        editTask(editingTask.id, taskData);
    } else {
        addTask(taskData);
    }
    setIsModalOpen(false);
  };

  // If no profile exists, show Sign Up
  if (!playerProfile) {
    return (
        <>
            <SignUpScreen />
            <ToastSystem />
        </>
    );
  }

  const renderContent = () => {
    // If we are in a specific pillar screen (Stack Navigation)
    if (currentStackScreen !== 'ROOT') {
        const props = { 
            onBack: handleBack, 
            onAddTask: () => openAddTask(currentStackScreen as PillarType),
            onEditTask: openEditTask
        };
        switch (currentStackScreen) {
            case 'Learning': return <LearningScreen {...props} />;
            case 'Studying': return <StudyingScreen {...props} />;
            case 'Exercise': return <ExerciseScreen {...props} />;
            case 'Work': return <WorkScreen {...props} />;
            case 'Entertainment': return <EntertainmentScreen {...props} />;
            case 'Quran': return <QuranScreen {...props} />;
        }
    }

    // Default Tab Navigation
    switch (activeTab) {
      case AppTab.DASHBOARD: 
        return <Dashboard 
                  onNavigateToPillar={navigateToPillar} 
                  onOpenSettings={() => setActiveTab(AppTab.SETTINGS)} 
                  onNavigateToTab={setActiveTab}
                  onQuickAdd={() => openAddTask()}
               />;
      case AppTab.PLANNER:
        return <WeeklyPlanner onAddTask={(day) => openAddTask(undefined, day)} onEditTask={openEditTask} />;
      case AppTab.PILLARS: 
        return <PillarsView onNavigate={navigateToPillar} />;
      case AppTab.COACH: 
        return <AICoach />;
      case AppTab.STATS:
        return <StatisticsScreen />;
      case AppTab.SETTINGS:
        return <SettingsScreen />;
      default: 
        return <Dashboard 
                  onNavigateToPillar={navigateToPillar} 
                  onOpenSettings={() => setActiveTab(AppTab.SETTINGS)} 
                  onNavigateToTab={setActiveTab}
                  onQuickAdd={() => openAddTask()}
               />;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-game-black text-white flex justify-center font-sans overflow-hidden">
      <div className="w-full max-w-md h-[100dvh] flex flex-col relative bg-game-black shadow-2xl overflow-hidden">
        
        {/* Header (Only show if not in stack screen) */}
        {currentStackScreen === 'ROOT' && (
            <header className="p-4 flex justify-between items-center border-b border-neutral-800 bg-game-black/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    {activeTab !== AppTab.DASHBOARD && (
                        <button onClick={goHome} className="text-neutral-400 hover:text-white">
                            <ArrowRight size={24} />
                        </button>
                    )}
                    {/* Stylized Logo for 'Solo Task' */}
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tighter leading-none italic select-none">
                            <span className="text-white drop-shadow-md">SOLO</span>
                            <span className="text-game-red drop-shadow-md ml-1">TASK</span>
                        </h1>
                        <span className="text-[7px] font-mono text-neutral-500 tracking-[0.4em] uppercase opacity-80">
                            SYSTEM ACTIVE
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => setActiveTab(AppTab.SETTINGS)} 
                    className={`text-neutral-500 hover:text-game-red transition-colors ${activeTab === AppTab.SETTINGS ? 'text-game-red' : ''}`}
                >
                    <SettingsIcon size={20} />
                </button>
            </header>
        )}

        {/* Main Content - No scroll here, children handle it */}
        <main className="flex-1 overflow-hidden relative">
            {renderContent()}
        </main>

        {/* Global Task Modal */}
        <TaskFormModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSaveTask}
            initialData={editingTask}
            defaultPillar={modalDefaultPillar}
            defaultDay={modalDefaultDay}
        />
        
        {/* Managers & Overlays */}
        <SmartNotificationManager />
        <ToastSystem />
        <LevelUpModal />

      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
        <ToastProvider>
            <GameProvider>
                <AppContent />
            </GameProvider>
        </ToastProvider>
    </SettingsProvider>
  );
};

export default App;
