import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  PlusCircle,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FoodScanData } from '../types.ts';
import { LanguageCode, t } from '../utils/translations.ts';

interface NutritionSearchProps {
  language: LanguageCode;
  onMealLogged: (meal: FoodScanData, mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => Promise<void>;
  onAddToFavorites: (meal: FoodScanData) => Promise<void>;
}

export const NutritionSearch: React.FC<NutritionSearchProps> = ({
  language,
  onMealLogged,
  onAddToFavorites,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<FoodScanData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [isLogging, setIsLogging] = useState(false);
  const [hasLogged, setHasLogged] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const popularQueries = [
    'Chicken Biryani',
    'Steamed Idli with Sambar',
    'Masala Dosa',
    'Grilled Salmon Quinoa',
    'Greek Salad with Paneer',
    'Boiled Eggs (2 pcs)',
    'Fresh Apple',
    'Oatmeal with Almond Milk',
    'Paneer Butter Masala',
    'Avocado Toast',
  ];

  const handleSearch = async (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    setIsSearching(true);
    setSearchError(null);
    setHasLogged(false);
    setIsFavorited(false);

    try {
      const res = await fetch('/api/nutrition/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSearchError(data.error || 'Failed to fetch nutrition data.');
        setResult(null);
      } else {
        setResult(data.data);
      }
    } catch (err) {
      setSearchError('Network error connecting to nutrition search.');
      setResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogMeal = async () => {
    if (!result || isLogging || hasLogged) return;
    setIsLogging(true);
    try {
      await onMealLogged(result, mealType);
      setHasLogged(true);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      alert('Failed to log meal.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleFavorite = async () => {
    if (!result) return;
    try {
      await onAddToFavorites(result);
      setIsFavorited(true);
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            Instant Nutritional Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manual Nutrition Search
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search any Indian dish, global recipe, or whole food item to view accurate caloric values, macronutrients, and add directly to your diary.
          </p>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="mt-6 flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search food (e.g. Chicken Biryani, Idli, Apple, Avocado)..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSearching ? <Sparkles className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isSearching ? 'Analyzing...' : 'Search'}
          </button>
        </form>

        {/* Popular chips */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-1">Popular:</span>
          {popularQueries.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                handleSearch(item);
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 hover:text-emerald-600 text-slate-600 dark:text-slate-300 transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {searchError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Search Result Display */}
      {result && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" /> Clinical Estimate
                </span>
                <span className="text-xs text-slate-400">Serving: {result.serving_size}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {result.food_name}
              </h2>
              {result.health_notes && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{result.health_notes}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleFavorite}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer self-start sm:self-auto ${
                isFavorited
                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 border-amber-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-500'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorited ? 'fill-amber-500 text-amber-500' : ''}`} />
              {isFavorited ? 'Saved to Favorites' : 'Add to Favorites'}
            </button>
          </div>

          {/* Macro Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Calories</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{result.calories}</div>
              <span className="text-[10px] text-slate-400">kcal</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Dumbbell className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Protein</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{result.protein}g</div>
              <span className="text-[10px] text-slate-400">4 kcal/g</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Wheat className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Carbs</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{result.carbohydrates}g</div>
              <span className="text-[10px] text-slate-400">Fiber: {result.fiber}g</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <Droplet className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Fat</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{result.fat}g</div>
              <span className="text-[10px] text-slate-400">9 kcal/g</span>
            </div>
          </div>

          {/* Log to Meal Action (Section 60: compatible with meal logging) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase">Meal:</span>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-semibold">
                {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      mealType === type
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={isLogging || hasLogged}
              onClick={handleLogMeal}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-white shadow-md transition cursor-pointer ${
                hasLogged
                  ? 'bg-emerald-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {hasLogged ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Logged to {mealType}!
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Add to {mealType}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
