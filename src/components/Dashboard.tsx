import React, { useState } from 'react';
import {
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Moon,
  Activity,
  Plus,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  Search,
  Scale,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { LoggedMealItem, NutritionTotals, FamilyMember, UserProfile, NutritionPlan } from '../types.ts';
import { LanguageCode, t } from '../utils/translations.ts';

interface DashboardProps {
  totals: NutritionTotals;
  meals: LoggedMealItem[];
  member: FamilyMember;
  profile: UserProfile;
  targets: NutritionPlan;
  waterMl: number;
  sleepHours: number;
  onLogWater: (amountMl: number) => Promise<void>;
  onLogSleep: (hours: number, quality: 'Excellent' | 'Good' | 'Fair' | 'Poor') => Promise<void>;
  onDeleteMeal: (id: string) => Promise<void>;
  onGoToScanner: () => void;
  onGoToMealPlan: () => void;
  onGoToSearch: () => void;
  onGoToDiary: () => void;
  language: LanguageCode;
}

export const Dashboard: React.FC<DashboardProps> = ({
  totals,
  meals,
  member,
  profile,
  targets,
  waterMl,
  sleepHours,
  onLogWater,
  onLogSleep,
  onDeleteMeal,
  onGoToScanner,
  onGoToMealPlan,
  onGoToSearch,
  onGoToDiary,
  language,
}) => {
  const [customWater, setCustomWater] = useState('');
  const [customSleep, setCustomSleep] = useState('');
  const [isLoggingWater, setIsLoggingWater] = useState(false);
  const [isLoggingSleep, setIsLoggingSleep] = useState(false);

  // Section 63: SMART DAILY SUMMARY
  const targetCalories = targets.target_calories || 2000;
  const consumedCalories = totals.calories || 0;
  const remainingCalories = targetCalories - consumedCalories;

  const targetProtein = targets.protein_g || 120;
  const targetCarbs = targets.carbs_g || 220;
  const targetFat = targets.fat_g || 60;

  const calPct = Math.min(150, Math.round((consumedCalories / targetCalories) * 100));
  const proteinPct = Math.min(150, Math.round(((totals.protein || 0) / targetProtein) * 100));
  const carbsPct = Math.min(150, Math.round(((totals.carbohydrates || 0) / targetCarbs) * 100));
  const fatPct = Math.min(150, Math.round(((totals.fat || 0) / targetFat) * 100));
  const waterPct = Math.min(100, Math.round((waterMl / targets.water_target_ml) * 100));

  // Determine Daily Status (Excellent / Good / Needs Attention)
  let statusBadge: { label: string; color: string; description: string; icon: any } = {
    label: 'Good',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
    description: t('good_status', language),
    icon: CheckCircle2,
  };

  const isCalorieClose = Math.abs(remainingCalories) <= 250;
  const hasWater = waterMl >= 1500;

  if (isCalorieClose && hasWater && meals.length >= 2) {
    statusBadge = {
      label: 'Excellent',
      color: 'bg-emerald-500 text-white border-emerald-600',
      description: t('excellent_status', language),
      icon: Smile,
    };
  } else if (remainingCalories < -400 || (consumedCalories < targetCalories * 0.4 && meals.length === 0)) {
    statusBadge = {
      label: 'Needs Attention',
      color: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300',
      description: t('attention_status', language),
      icon: AlertCircle,
    };
  }

  const handleQuickWater = async (amount: number) => {
    if (isLoggingWater) return;
    setIsLoggingWater(true);
    try {
      await onLogWater(amount);
    } finally {
      setIsLoggingWater(false);
    }
  };

  const handleCustomWaterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(customWater, 10);
    if (amt > 0) {
      await handleQuickWater(amt);
      setCustomWater('');
    }
  };

  const handleQuickSleepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(customSleep);
    if (hrs > 0 && hrs <= 24) {
      setIsLoggingSleep(true);
      try {
        await onLogSleep(hrs, 'Good');
        setCustomSleep('');
      } finally {
        setIsLoggingSleep(false);
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Smart Daily Summary Hero Card (Section 63) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/10 backdrop-blur-md text-emerald-300 border border-white/10">
                Active Member: {member.name}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.color}`}>
                <statusBadge.icon className="w-3.5 h-3.5" />
                {statusBadge.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Daily Nutrition Summary
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              {statusBadge.description}
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onGoToScanner}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              {t('food_scan', language)}
            </button>
            <button
              type="button"
              onClick={onGoToMealPlan}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/15 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-emerald-300" />
              {t('meal_plan', language)}
            </button>
            <button
              type="button"
              onClick={onGoToSearch}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/15 transition cursor-pointer"
            >
              <Search className="w-4 h-4 text-sky-300" />
              Search Food
            </button>
          </div>
        </div>

        {/* Hero KPI Numbers */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Calorie Target
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white">{targetCalories}</div>
            <span className="text-xs text-slate-400">kcal/day</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Consumed Today
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{consumedCalories}</div>
            <span className="text-xs text-slate-400">{calPct}% of target</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Calories Remaining
            </span>
            <div className={`text-2xl sm:text-3xl font-black ${remainingCalories >= 0 ? 'text-white' : 'text-amber-400'}`}>
              {remainingCalories >= 0 ? remainingCalories : `+${Math.abs(remainingCalories)} over`}
            </div>
            <span className="text-xs text-slate-400">{meals.length} meals logged</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Water & Sleep
            </span>
            <div className="text-2xl sm:text-3xl font-black text-blue-300">{waterMl} ml</div>
            <span className="text-xs text-indigo-300">{sleepHours} hrs sleep</span>
          </div>
        </div>
      </div>

      {/* Macronutrient Distributions Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Protein */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 uppercase">
              <Dumbbell className="w-4 h-4 text-blue-500" /> Protein
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {totals.protein} / {targetProtein}g
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: `${Math.min(100, proteinPct)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
            <span>{proteinPct}% met</span>
            <span>Target: {targetProtein}g</span>
          </div>
        </div>

        {/* Carbohydrates */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 uppercase">
              <Wheat className="w-4 h-4 text-amber-500" /> Carbohydrates
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {totals.carbohydrates} / {targetCarbs}g
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-700"
              style={{ width: `${Math.min(100, carbsPct)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
            <span>{carbsPct}% met</span>
            <span>Fiber: {totals.fiber}g</span>
          </div>
        </div>

        {/* Fats */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 uppercase">
              <Droplet className="w-4 h-4 text-rose-500" /> Healthy Fats
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {totals.fat} / {targetFat}g
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-rose-500 transition-all duration-700"
              style={{ width: `${Math.min(100, fatPct)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
            <span>{fatPct}% met</span>
            <span>Target: {targetFat}g</span>
          </div>
        </div>
      </div>

      {/* Hydration & Sleep Trackers Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hydration Widget */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Droplet className="w-4 h-4 text-blue-500" />
              {t('water_tracker', language)}
            </h3>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
              {waterMl} / {targets.water_target_ml} ml ({waterPct}%)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${waterPct}%` }}
            ></div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              disabled={isLoggingWater}
              onClick={() => handleQuickWater(250)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition cursor-pointer"
            >
              +250 ml (Glass)
            </button>
            <button
              type="button"
              disabled={isLoggingWater}
              onClick={() => handleQuickWater(500)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition cursor-pointer"
            >
              +500 ml (Bottle)
            </button>
            <form onSubmit={handleCustomWaterSubmit} className="flex items-center gap-1.5">
              <input
                type="number"
                value={customWater}
                onChange={e => setCustomWater(e.target.value)}
                placeholder="ml..."
                className="w-20 px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs bg-slate-50 dark:bg-slate-900"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Sleep Widget */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Moon className="w-4 h-4 text-indigo-500" />
              {t('sleep_tracker', language)}
            </h3>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              {sleepHours} hrs logged
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (sleepHours / 8.0) * 100)}%` }}
            ></div>
          </div>

          <form onSubmit={handleQuickSleepSubmit} className="flex items-center gap-2 pt-2">
            <input
              type="number"
              step="0.5"
              min={1}
              max={24}
              value={customSleep}
              onChange={e => setCustomSleep(e.target.value)}
              placeholder="Record hours (e.g. 8.0)..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs bg-slate-50 dark:bg-slate-900"
            />
            <button
              type="submit"
              disabled={isLoggingSleep || !customSleep}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              Log Sleep
            </button>
          </form>
        </div>
      </div>

      {/* Today's Meals Quick List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Today&apos;s Nutrition Diary ({meals.length} items)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time meals logged for {member.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToDiary}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            View Food History <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400 mb-3">No meals logged yet today.</p>
            <button
              type="button"
              onClick={onGoToScanner}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Scan First Meal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map(meal => (
              <div
                key={meal.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {meal.mealType}
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {meal.calories} kcal
                    </span>
                    <span className="text-xs text-slate-400">• {meal.serving_size}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{meal.food_name}</h4>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>P: <strong className="text-blue-600">{meal.protein}g</strong></span>
                    <span>C: <strong className="text-amber-600">{meal.carbohydrates}g</strong></span>
                    <span>F: <strong className="text-rose-600">{meal.fat}g</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteMeal(meal.id)}
                  className="text-xs text-slate-400 hover:text-rose-500 self-end sm:self-center transition"
                  title="Remove"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
