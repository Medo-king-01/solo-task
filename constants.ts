
import { BookOpen, Brain, Dumbbell, Briefcase, Gamepad2, Scroll, LucideIcon } from 'lucide-react';
import { PillarType, DayOfWeek, TaskDifficulty } from './types';

export const PILLARS: { id: PillarType; label: string; icon: LucideIcon; color: string; hex: string }[] = [
  { id: 'Quran', label: 'القرآن', icon: Scroll, color: 'text-emerald-400', hex: '#34d399' },
  { id: 'Learning', label: 'التعلم', icon: BookOpen, color: 'text-blue-500', hex: '#3b82f6' },
  { id: 'Studying', label: 'الدراسة', icon: Brain, color: 'text-purple-500', hex: '#a855f7' },
  { id: 'Exercise', label: 'الرياضة', icon: Dumbbell, color: 'text-green-500', hex: '#22c55e' },
  { id: 'Work', label: 'العمل', icon: Briefcase, color: 'text-orange-500', hex: '#f97316' },
  { id: 'Entertainment', label: 'الترفيه', icon: Gamepad2, color: 'text-pink-500', hex: '#ec4899' },
];

export const DAYS_OF_WEEK: { id: DayOfWeek; label: string }[] = [
  { id: 'Saturday', label: 'السبت' },
  { id: 'Sunday', label: 'الأحد' },
  { id: 'Monday', label: 'الاثنين' },
  { id: 'Tuesday', label: 'الثلاثاء' },
  { id: 'Wednesday', label: 'الأربعاء' },
  { id: 'Thursday', label: 'الخميس' },
  { id: 'Friday', label: 'الجمعة' },
];

export const MAX_DAILY_ENERGY = 100;
export const ENERGY_RECOVERY_RATE = 5; // Energy per Hour
export const PAGES_PER_JUZ = 20;
export const ENERGY_PER_QURAN_PAGE = 3; // Improved spiritual recovery

// 1️⃣ XP Scaling - Slightly steeper curve
export const XP_SCALING_FACTOR = 1.35; 

// 2️⃣ Base Economy (Per Difficulty Tier)
// Energy: Positive consumes, Negative restores
export const DIFFICULTY_CONFIG: Record<TaskDifficulty, { label: string; multiplier: number; color: string }> = {
    'E': { label: 'E-Rank (Easy)', multiplier: 0.5, color: 'text-neutral-500' },
    'D': { label: 'D-Rank (Normal)', multiplier: 1.0, color: 'text-green-500' },
    'C': { label: 'C-Rank (Hard)', multiplier: 1.5, color: 'text-blue-500' },
    'B': { label: 'B-Rank (Expert)', multiplier: 2.5, color: 'text-purple-500' },
    'A': { label: 'A-Rank (Master)', multiplier: 4.0, color: 'text-red-500' },
    'S': { label: 'S-Rank (Hell)', multiplier: 6.0, color: 'text-yellow-500' },
};

// 3️⃣ Base Rates Per Pillar (Base D-Rank Values)
// Realistic Energy: Work/Exercise drain heavily. Entertainment drains little or restores.
export const PILLAR_BASE_RATES: Record<PillarType, { energy: number; xp: number }> = {
  Learning: { energy: 8, xp: 12 },       // Moderate drain
  Studying: { energy: 10, xp: 15 },      // Heavy mental drain
  Exercise: { energy: 15, xp: 20 },      // Heavy physical drain
  Work: { energy: 12, xp: 18 },          // Heavy mixed drain
  Entertainment: { energy: -5, xp: 5 },  // Restores small energy, low XP
  Quran: { energy: -2, xp: 0 },          // Special handling in code (Per page)
};

// New: Shadow Tasks (Major Recovery)
export const SHADOW_TASKS = [
  { title: "قيلولة محارب (20 دقيقة)", description: "استعادة سريعة للطاقة والتركيز", energyRestore: 25 },
  { title: "جلسة تأمل (10 دقائق)", description: "تصفية الذهن وتقليل التوتر", energyRestore: 15 },
  { title: "مشية هادئة", description: "بدون هاتف، فقط تنفس", energyRestore: 20 },
  { title: "إغلاق العينين", description: "راحة بصرية لمدة دقيقتين", energyRestore: 10 },
  { title: "شرب كوب ماء", description: "رطب جسمك لزيادة التركيز", energyRestore: 5 },
];

export interface PredefinedExercise {
  id: string;
  name: string;
  reps?: string;
  duration?: string;
  difficulty: TaskDifficulty;
  category: 'Cardio' | 'Strength' | 'Core' | 'Full Body';
}

export const HOME_EXERCISES: PredefinedExercise[] = [
  // Cardio & Endurance (Heart Health)
  { id: 'cardio_1', name: 'Jumping Jacks', reps: '50 Reps', difficulty: 'E', category: 'Cardio' },
  { id: 'cardio_2', name: 'High Knees', duration: '1 Min', difficulty: 'D', category: 'Cardio' },
  { id: 'cardio_4', name: 'Mountain Climbers', duration: '45 Sec', difficulty: 'C', category: 'Cardio' },
  { id: 'cardio_5', name: 'Shadow Boxing', duration: '3 Mins', difficulty: 'D', category: 'Cardio' },
  { id: 'cardio_6', name: 'Squat Jumps', reps: '15 Reps', difficulty: 'C', category: 'Cardio' },
  { id: 'cardio_7', name: 'Speed Skaters', duration: '1 Min', difficulty: 'D', category: 'Cardio' },
  { id: 'cardio_3', name: 'Burpees (Hell)', reps: '20 Reps', difficulty: 'B', category: 'Cardio' },
  
  // Strength
  { id: 'str_1', name: 'Push Ups', reps: '15 Reps', difficulty: 'D', category: 'Strength' },
  { id: 'str_2', name: 'Diamond Push Ups', reps: '15 Reps', difficulty: 'C', category: 'Strength' },
  { id: 'str_3', name: 'Pull Ups', reps: '10 Reps', difficulty: 'B', category: 'Strength' },
  { id: 'str_4', name: 'Lunges', reps: '20 Reps', difficulty: 'D', category: 'Strength' },

  // Core
  { id: 'core_1', name: 'Plank', duration: '1 Min', difficulty: 'C', category: 'Core' },
  { id: 'core_3', name: 'Plank Jacks', reps: '20 Reps', difficulty: 'C', category: 'Core' },
  { id: 'core_2', name: 'Crunches', reps: '30 Reps', difficulty: 'E', category: 'Core' },
  { id: 'core_4', name: 'Leg Raises', reps: '15 Reps', difficulty: 'D', category: 'Core' },
];

// Solo Leveling Daily Quest Targets
export const DAILY_QUEST_TARGETS = {
  pushups: 100,
  situps: 100,
  squats: 100,
  run: 10, // 10km
};

export const MOTIVATIONAL_QUOTES = [
  { id: 1, text: "النجاح لا يبدأ بالقوة، بل بالاستمرار.", category: "consistency" },
  { id: 2, text: "ما تفعله كل يوم أهم بكثير مما تفعله أحيانًا.", category: "habits" },
  { id: 3, text: "الانضباط هو الجسر بين الهدف والإنجاز.", category: "discipline" },
  { id: 4, text: "لا تنتظر الدافع، اصنعه بالفعل.", category: "action" },
  { id: 5, text: "التغيير الصغير المتكرر يصنع تحولًا ضخمًا.", category: "growth" },
  { id: 6, text: "أنت لست أفكارك، أنت من يختارها.", category: "mindset" },
  { id: 7, text: "الألم مؤقت، لكن التراجع يترك أثرًا طويلًا.", category: "resilience" },
  { id: 8, text: "السيطرة على وقتك تعني السيطرة على حياتك.", category: "control" },
  { id: 9, text: "العقل يتبع ما تركز عليه باستمرار.", category: "focus" },
  { id: 10, text: "الفشل ليس عكس النجاح، بل جزء منه.", category: "learning" },
  { id: 11, text: "كل عادة تبنيها هي تصويت على الشخص الذي تريد أن تصبحه.", category: "identity" },
  { id: 12, text: "الخوف إشارة، وليس عائقًا.", category: "courage" },
  { id: 13, text: "لا تبحث عن الراحة، بل عن المعنى.", category: "purpose" },
  { id: 14, text: "ما تقاومه يسيطر عليك، وما تفهمه يضعف.", category: "wisdom" },
  { id: 15, text: "العمل في صمت يجعل النتائج تتكلم عنك.", category: "humility" },
  { id: 16, text: "العظمة تبدأ بقرار بسيط: الاستمرار.", category: "consistency" },
  { id: 17, text: "التقدم البطيء أفضل من الثبات.", category: "progress" },
  { id: 18, text: "لا يمكنك التحكم في كل شيء، لكن يمكنك التحكم في رد فعلك.", category: "stoicism" },
  { id: 19, text: "التفكير الواضح أقوى من الموهبة.", category: "clarity" },
  { id: 20, text: "النجاح هو تراكم محاولات لم يراها أحد.", category: "persistence" },
  { id: 21, text: "لا تسمح لعقلك أن يكون عدوك.", category: "mental_health" },
  { id: 22, text: "التركيز هو العملة الحقيقية في عصر التشتت.", category: "focus" },
  { id: 23, text: "الشخص الذي تصبحه أهم من الهدف الذي تحققه.", category: "growth" },
  { id: 24, text: "التغيير الحقيقي يبدأ عندما تتحمل المسؤولية كاملة.", category: "responsibility" },
  { id: 25, text: "الفكرة بلا تنفيذ مجرد وهم جميل.", category: "action" },
  { id: 26, text: "الراحة تسرق الإمكانيات ببطء.", category: "ambition" },
  { id: 27, text: "لا تقارن بدايتك بنهاية غيرك.", category: "focus" },
  { id: 28, text: "ما تكرره داخلك يتحول إلى واقعك.", category: "mindset" },
  { id: 29, text: "الشجاعة ليست غياب الخوف، بل التقدم رغم وجوده.", category: "courage" },
  { id: 30, text: "كل يوم تلتزم فيه، أنت تقترب حتى لو لم تشعر.", category: "faith" }
];
