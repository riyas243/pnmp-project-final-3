import React, { useState } from 'react';
import {
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Trash2,
  Clock,
  Plus,
  RotateCcw,
  Star,
  BookOpen,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LoggedMealItem, NutritionTotals, FavoriteFood, FoodScanData, NutritionPlan } from '../types.ts';
import { LanguageCode, t } from '../utils/translations.ts';

interface DailyDiaryProps {
  meals: LoggedMealItem[];
  history: LoggedMealItem[];
  favorites: FavoriteFood[];
  totals: NutritionTotals;
  targets: NutritionPlan;
  onDeleteMeal: (id: string) => Promise<void>;
  onLogMeal: (meal: FoodScanData, mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => Promise<void>;
  onRemoveFavorite: (id: string) => Promise<void>;
  onGoToScanner: () => void;
  language: LanguageCode;
}

export const DailyDiary: React.FC<DailyDiaryProps> = ({
  meals,
  history,
  favorites,
  totals,
  targets,
  onDeleteMeal,
  onLogMeal,
  onRemoveFavorite,
  onGoToScanner,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'favorites'>('today');
  const [loggingId, setLoggingId] = useState<string | null>(null);

  const calPercentage = Math.min(100, Math.round((totals.calories / targets.target_calories) * 100));

  const mealCategories = [
    'Breakfast',
    'Morning Snack',
    'Lunch',
    'Evening Snack',
    'Dinner',
    'Snack',
  ] as const;

  const handleLogAgain = async (item: LoggedMealItem | FavoriteFood) => {
    setLoggingId(item.id);
    try {
      const mealData: FoodScanData = {
        food_name: item.food_name,
        confidence: (item as any).confidence || 90,
        serving_size: item.serving_size,
        calories: item.calories,
        protein: item.protein,
        carbohydrates: item.carbohydrates,
        fat: item.fat,
        fiber: item.fiber || 0,
        sugar: item.sugar || 0,
        ingredients: (item as any).ingredients || [],
        health_notes: (item as any).health_notes || '',
        warnings: (item as any).warnings || '',
      };
      const cat = ('meal_type' in item ? item.meal_type : (item as LoggedMealItem).mealType || 'Lunch') as any;
      await onLogMeal(mealData, cat);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    } catch (err) {
      alert('Failed to log meal again');
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Daily Nutrition Diary &amp; Food History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review today&apos;s meals, quickly re-log previously consumed dishes, and manage favorite foods.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToScanner}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Scan New Food</span>
        </button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calories</span>
              <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{totals.calories}</span>
              <span className="text-xs font-bold text-slate-400">/ {targets.target_calories} kcal</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
              <span>{calPercentage}% of Goal</span>
              <span>{Math.max(0, targets.target_calories - totals.calories)} left</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${calPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Protein */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Protein</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Dumbbell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totals.protein}g</span>
            <span className="text-xs text-slate-400">/ {targets.protein_g}g</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mt-4 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(100, (totals.protein / targets.protein_g) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Carbs */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Carbs</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Wheat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totals.carbohydrates}g</span>
            <span className="text-xs text-slate-400">/ {targets.carbs_g}g</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mt-4 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${Math.min(100, (totals.carbohydrates / targets.carbs_g) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Fat */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fat</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Droplet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totals.fat}g</span>
            <span className="text-xs text-slate-400">/ {targets.fat_g}g</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mt-4 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${Math.min(100, (totals.fat / targets.fat_g) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Today's Log vs Food History vs Favorites */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'today'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Today&apos;s Diary ({meals.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {t('food_history', language)} ({history.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          {t('favorites', language)} ({favorites.length})
        </button>
      </div>

      {/* 1. Today's Meals Section */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {mealCategories.map(cat => {
            const catMeals = meals.filter(m => m.mealType === cat);
            const catCals = catMeals.reduce((acc, m) => acc + m.calories, 0);

            return (
              <div
                key={cat}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{cat}</h3>
                  </div>
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                    {catCals} kcal
                  </span>
                </div>

                {catMeals.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No meals logged for {cat} yet.</p>
                ) : (
                  <div className="space-y-3">
                    {catMeals.map(meal => (
                      <div
                        key={meal.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
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
                          className="p-2 text-slate-400 hover:text-rose-500 transition self-end sm:self-center"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Section 61: Food History with "Log Again" */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Previously Logged Foods</h3>
            <p className="text-xs text-slate-500">Quickly re-log any dish from your recent history.</p>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No historical foods recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {item.date || 'Past'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {item.mealType}
                      </span>
                      <span className="text-xs font-black text-emerald-600">{item.calories} kcal</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.food_name}</h4>
                    <span className="text-[11px] text-slate-400">
                      {item.serving_size} • P: {item.protein}g | C: {item.carbohydrates}g | F: {item.fat}g
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={loggingId === item.id}
                    onClick={() => handleLogAgain(item)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer self-end sm:self-center"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {loggingId === item.id ? 'Logging...' : t('log_again', language)}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Section 62: Favorite Foods */}
      {activeTab === 'favorites' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Your Starred Favorite Foods</h3>
            <p className="text-xs text-slate-500">Quick-log foods you consume regularly with a single click.</p>
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 mb-2">No favorite foods saved yet.</p>
              <p className="text-[11px] text-slate-500">
                You can star dishes after scanning or searching foods to save them here!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span className="text-xs font-black text-emerald-600">{item.calories} kcal</span>
                      <span className="text-xs text-slate-400">• {item.serving_size}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.food_name}</h4>
                    <span className="text-[11px] text-slate-400">
                      P: {item.protein}g | C: {item.carbohydrates}g | F: {item.fat}g
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={loggingId === item.id}
                      onClick={() => handleLogAgain(item)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Log This
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveFavorite(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition"
                      title="Remove Favorite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
