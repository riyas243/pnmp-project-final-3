import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  Plus,
  Trash2,
  FileDown,
  Printer,
  AlertTriangle,
  Info,
  CheckSquare,
  Square,
  ShieldCheck,
  Utensils,
  ChevronRight,
  Flame,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  MealPlanRecord,
  MealPlanDay,
  MealPlanDayMeal,
  UserProfile,
  NutritionPlan,
  GroceryItem,
  FamilyMember,
} from '../types.ts';
import { LanguageCode, t } from '../utils/translations.ts';
import { exportMealPlanPdf } from '../utils/pdfExport.ts';

interface MealPlannerProps {
  member: FamilyMember;
  profile: UserProfile;
  targets: NutritionPlan;
  language: LanguageCode;
  onMealLogged: () => void;
  onGoToProfile: () => void;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({
  member,
  profile,
  targets,
  language,
  onMealLogged,
  onGoToProfile,
}) => {
  const [plan, setPlan] = useState<MealPlanRecord | null>(null);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Grocery Item state
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCat, setNewItemCat] = useState<string>('Produce');

  // Meal Logging Modal State
  const [logModalOpen, setLogModalOpen] = useState<boolean>(false);
  const [mealToLog, setMealToLog] = useState<{
    food_name: string;
    meal_type: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    serving_size: string;
    fiber: number;
    sugar: number;
  } | null>(null);
  const [isSubmittingLog, setIsSubmittingLog] = useState<boolean>(false);

  // Fetch current stored plan for this member (Section 53: does not regenerate on page refresh)
  const fetchCurrentPlan = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/meal-plan?member_id=${member.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
        setGroceryItems(data.grocery_items || []);
      }
    } catch (err) {
      console.warn('Failed to load meal plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentPlan();
    setSelectedDayIndex(0);
  }, [member.id]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Generate / Regenerate 7-Day Plan
  const handleGeneratePlan = async () => {
    if (isGenerating) return; // Prevent duplicate calls (Section 57)

    // Check incomplete profile
    if (!profile.age || !profile.height_cm || !profile.weight_kg) {
      setErrorMessage('Please complete your nutrition profile before generating a personalized meal plan.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: member.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Unable to generate your meal plan right now. Please try again later.');
        return;
      }

      setPlan(data.plan);
      setGroceryItems(data.grocery_items || []);
      showToast('Personalized 7-day meal plan generated and saved!');
    } catch (err) {
      setErrorMessage('Unable to generate your meal plan right now. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Grocery Management handlers
  const handleToggleGrocery = async (id: string) => {
    try {
      const res = await fetch(`/api/grocery/${id}/toggle?member_id=${member.id}`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        setGroceryItems(prev => prev.map(item => (item.id === id ? data.item : item)));
      }
    } catch (err) {
      console.warn('Error toggling grocery item:', err);
    }
  };

  const handleAddGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const res = await fetch('/api/grocery/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.id,
          name: newItemName.trim(),
          category: newItemCat,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGroceryItems(prev => [...prev, data.item]);
        setNewItemName('');
        showToast('Grocery item added');
      }
    } catch (err) {
      console.warn('Error adding grocery item:', err);
    }
  };

  const handleDeleteGrocery = async (id: string) => {
    try {
      const res = await fetch(`/api/grocery/${id}?member_id=${member.id}`, { method: 'DELETE' });
      if (res.ok) {
        setGroceryItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.warn('Error deleting grocery item:', err);
    }
  };

  const handleClearCompletedGrocery = async () => {
    try {
      const res = await fetch('/api/grocery/clear-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: member.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setGroceryItems(data.items || []);
        showToast(`Cleared completed items`);
      }
    } catch (err) {
      console.warn('Error clearing completed items:', err);
    }
  };

  // Open Log Meal confirmation modal (Section 55)
  const openLogMealModal = (meal: MealPlanDayMeal) => {
    setMealToLog({
      food_name: meal.food_name,
      meal_type: meal.meal_type,
      calories: meal.calories,
      protein: meal.protein,
      carbohydrates: meal.carbohydrates,
      fat: meal.fat,
      serving_size: meal.serving_size,
      fiber: meal.fiber || 0,
      sugar: meal.sugar || 0,
    });
    setLogModalOpen(true);
  };

  // Confirm logging meal into today's diary
  const confirmLogMeal = async () => {
    if (!mealToLog) return;
    setIsSubmittingLog(true);

    try {
      const res = await fetch('/api/log-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.id,
          meal: mealToLog,
          mealType: mealToLog.meal_type,
        }),
      });

      if (res.ok) {
        showToast(`Logged "${mealToLog.food_name}" to today's ${mealToLog.meal_type}!`);
        setLogModalOpen(false);
        setMealToLog(null);
        onMealLogged();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to log meal');
      }
    } catch (err) {
      alert('Error recording meal to diary.');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Group grocery items by category
  const groupedGroceries = groceryItems.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const selectedDay: MealPlanDay | undefined = plan?.weekly_plan?.[selectedDayIndex];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header Banner & Generation Action */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Multimodal Gemini AI Dietitian
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Personalized 7-Day AI Meal Plan
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Scientifically calibrated for <span className="font-semibold text-slate-800 dark:text-slate-200">{member.name}</span> based on BMR, TDEE, activity level, allergies, and health goals.
            </p>

            {/* Profile Biometric Parameters in View */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700">
                Target: <strong className="text-emerald-600 dark:text-emerald-400">{targets.target_calories} kcal/day</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700">
                Goal: <strong className="text-slate-900 dark:text-white">{profile.fitness_goal}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700">
                Diet: <strong className="text-slate-900 dark:text-white">{profile.dietary_preference}</strong>
              </span>
              {profile.allergies && (
                <span className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  Allergies: <strong>{profile.allergies}</strong>
                </span>
              )}
              {profile.medical_conditions && (
                <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  Medical: <strong>{profile.medical_conditions}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {plan && (
              <button
                type="button"
                onClick={() => exportMealPlanPdf(plan, member.name, profile, targets, groceryItems)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-emerald-600" />
                {t('download_plan_pdf', language)}
              </button>
            )}

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGeneratePlan}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md shadow-emerald-600/20 transition cursor-pointer ${
                isGenerating
                  ? 'bg-emerald-400 cursor-not-allowed opacity-80'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating
                ? t('generating_plan', language)
                : plan
                ? t('regenerate_plan', language)
                : t('generate_plan', language)}
            </button>
          </div>
        </div>

        {/* Incomplete profile warning */}
        {(!profile.age || !profile.height_cm || !profile.weight_kg) && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Your nutrition profile is incomplete. Please fill in height, weight, and fitness goals for accurate personalization.
            </span>
            <button
              onClick={onGoToProfile}
              className="underline font-bold hover:text-amber-950 dark:hover:text-amber-100"
            >
              Update Profile
            </button>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Loading state during initial generation */}
      {isGenerating && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Synthesizing 7-Day Personalized Meal Plan...
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Gemini is balancing daily caloric target ({targets.target_calories} kcal), macronutrients ({targets.protein_g}g Protein, {targets.carbs_g}g Carbs, {targets.fat_g}g Fat), dietary preferences, and allergies across all 7 days.
          </p>
        </div>
      )}

      {/* Main Content Area: Day Selector & Meals */}
      {!isGenerating && plan && plan.weekly_plan && plan.weekly_plan.length > 0 && (
        <div className="space-y-6">
          {/* Summary Card */}
          {plan.summary && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-1">
                  Dietitian Protocol & Strategy
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{plan.summary}</p>
              </div>
            </div>
          )}

          {/* 7 Days Tabs (Monday → Sunday) - Section 49 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {plan.weekly_plan.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={day.day}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition cursor-pointer text-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      Day {idx + 1}
                    </span>
                    <span className="text-sm font-extrabold mt-0.5">{day.day}</span>
                    <span className={`text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {day.daily_total?.calories || targets.target_calories} kcal
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day View */}
          {selectedDay && (
            <div className="space-y-4">
              {/* Day Header & Daily Nutrient Totals Bar (Section 51 & 54) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    {selectedDay.day} Nutrition Schedule
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    5 structured meals balanced to reach ~{targets.target_calories} kcal
                  </p>
                </div>

                {/* Macro summary pills */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold">
                    <Flame className="w-4 h-4 text-emerald-600" />
                    <span>Total: {selectedDay.daily_total.calories} kcal</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold">
                    P: {selectedDay.daily_total.protein}g
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold">
                    C: {selectedDay.daily_total.carbohydrates}g
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold">
                    F: {selectedDay.daily_total.fat}g
                  </div>
                </div>
              </div>

              {/* 5 Meal Cards per day (Section 49 & 55) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDay.meals.map((meal, mIdx) => (
                  <div
                    key={`${selectedDay.day}-${meal.meal_type}-${mIdx}`}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-600 transition"
                  >
                    <div>
                      {/* Meal Type Header */}
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          <Utensils className="w-3 h-3 text-emerald-600" />
                          {meal.meal_type}
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {meal.calories} kcal
                        </span>
                      </div>

                      {/* Food Name & Portion */}
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {meal.food_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Portion: {meal.serving_size}
                      </p>

                      {/* Prep / notes */}
                      {meal.prep_notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-2 bg-slate-50 dark:bg-slate-750 p-2 rounded-lg">
                          &ldquo;{meal.prep_notes}&rdquo;
                        </p>
                      )}

                      {/* Ingredients */}
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {meal.ingredients.slice(0, 4).map((ing, iIdx) => (
                            <span
                              key={iIdx}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Macros & Log Action (Section 55) */}
                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-slate-500 dark:text-slate-400 mb-3">
                        <div className="bg-slate-50 dark:bg-slate-750 py-1 rounded">
                          Protein: <strong className="text-blue-600">{meal.protein}g</strong>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-750 py-1 rounded">
                          Carbs: <strong className="text-amber-600">{meal.carbohydrates}g</strong>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-750 py-1 rounded">
                          Fat: <strong className="text-rose-600">{meal.fat}g</strong>
                        </div>
                      </div>

                      {/* Log Meal Button */}
                      <button
                        type="button"
                        onClick={() => openLogMealModal(meal)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-bold text-xs transition border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Log Meal to Diary
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grocery Shopping List Management (Section 65) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                  Weekly Grocery Shopping List
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ingredients aggregated from your 7-day meal plan. Check off items as you shop.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearCompletedGrocery}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {t('clear_completed', language)}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  title="Print grocery list"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add Custom Item Form */}
            <form onSubmit={handleAddGrocery} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="Add custom item (e.g. Chia seeds 200g)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-emerald-500"
              />
              <select
                value={newItemCat}
                onChange={e => setNewItemCat(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              >
                <option value="Produce">Produce</option>
                <option value="Proteins">Proteins</option>
                <option value="Grains & Pantry">Grains & Pantry</option>
                <option value="Dairy & Alternatives">Dairy & Alternatives</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            {/* Grouped Grocery Items Display */}
            {Object.keys(groupedGroceries).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No grocery items available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(groupedGroceries).map(([category, items]) => (
                  <div key={category} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider pb-2 mb-2 border-b border-slate-200 dark:border-slate-600">
                        {category} ({items.length})
                      </h4>
                      <ul className="space-y-1.5">
                        {items.map(item => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-2 group text-xs text-slate-700 dark:text-slate-300"
                          >
                            <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => handleToggleGrocery(item.id)}
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className={item.checked ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                                {item.name}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeleteGrocery(item.id)}
                              className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medical Disclaimer */}
          {plan.medical_disclaimer && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Medical Notice:</strong> {plan.medical_disclaimer}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Empty State: No Plan Generated Yet */}
      {!isGenerating && (!plan || !plan.weekly_plan || plan.weekly_plan.length === 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            No Weekly Meal Plan Generated Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 mb-6">
            Synthesize a full 7-day nutrition schedule tailored to {member.name}&apos;s biometrics, daily calorie target ({targets.target_calories} kcal), dietary preference ({profile.dietary_preference}), and fitness goal.
          </p>
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGeneratePlan}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Generate 7-Day AI Meal Plan
          </button>
        </div>
      )}

      {/* Confirm & Log Meal Modal (Section 55) */}
      {logModalOpen && mealToLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600" />
                Confirm & Log Meal to Diary
              </h4>
              <button
                type="button"
                onClick={() => setLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Food / Dish Name
                </label>
                <input
                  type="text"
                  value={mealToLog.food_name}
                  onChange={e => setMealToLog({ ...mealToLog, food_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Meal Type
                  </label>
                  <select
                    value={mealToLog.meal_type}
                    onChange={e => setMealToLog({ ...mealToLog, meal_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Morning Snack">Morning Snack</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Evening Snack">Evening Snack</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Portion Size
                  </label>
                  <input
                    type="text"
                    value={mealToLog.serving_size}
                    onChange={e => setMealToLog({ ...mealToLog, serving_size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Nutrients Editable */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Calories</label>
                  <input
                    type="number"
                    value={mealToLog.calories}
                    onChange={e => setMealToLog({ ...mealToLog, calories: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-center font-bold text-emerald-600 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Protein (g)</label>
                  <input
                    type="number"
                    value={mealToLog.protein}
                    onChange={e => setMealToLog({ ...mealToLog, protein: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-center font-bold text-blue-600 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Carbs (g)</label>
                  <input
                    type="number"
                    value={mealToLog.carbohydrates}
                    onChange={e => setMealToLog({ ...mealToLog, carbohydrates: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-center font-bold text-amber-600 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Fat (g)</label>
                  <input
                    type="number"
                    value={mealToLog.fat}
                    onChange={e => setMealToLog({ ...mealToLog, fat: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-center font-bold text-rose-600 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingLog}
                  onClick={confirmLogMeal}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  {isSubmittingLog ? 'Saving...' : 'Confirm & Log to Today'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
