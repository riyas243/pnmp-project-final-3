import React, { useState } from 'react';
import {
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  HeartPulse,
  AlertCircle,
  PlusCircle,
  RotateCcw,
  Check,
  Tag,
  ShieldCheck,
  Edit3,
  Star,
  Save,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FoodScanData } from '../types.ts';

interface ResultCardProps {
  data: FoodScanData;
  imagePreviewUrl: string | null;
  onScanAnother: () => void;
  onMealLogged: (meal: FoodScanData, mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => Promise<void>;
  onAddToFavorites?: (meal: FoodScanData) => Promise<void>;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  data: initialData,
  imagePreviewUrl,
  onScanAnother,
  onMealLogged,
  onAddToFavorites,
}) => {
  // Local editable copy (Section 70 & 71)
  const [data, setData] = useState<FoodScanData>({ ...initialData });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [isLogging, setIsLogging] = useState(false);
  const [hasLogged, setHasLogged] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const handleLogClick = async () => {
    if (isLogging || hasLogged) return;
    setIsLogging(true);
    try {
      await onMealLogged(data, mealType);
      setHasLogged(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogging(false);
    }
  };

  const handleFavoriteClick = async () => {
    if (onAddToFavorites) {
      try {
        await onAddToFavorites(data);
        setIsFavorited(true);
      } catch (err) {
        console.warn('Failed to add favorite:', err);
      }
    }
  };

  // Section 70: AI FOOD CONFIDENCE HANDLING
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          High confidence ({confidence}%)
        </span>
      );
    }
    if (confidence >= 50) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Medium confidence — please verify the result. ({confidence}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <AlertCircle className="w-4 h-4 text-rose-600" />
        Low confidence — please verify the food manually. ({confidence}%)
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden transition-all animate-fade-in">
      {/* Top Banner with Image & Dish Title */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-100 dark:border-slate-700">
        {imagePreviewUrl && (
          <div className="md:col-span-1 bg-slate-900 relative min-h-[220px] max-h-[300px] overflow-hidden flex items-center justify-center">
            <img
              src={imagePreviewUrl}
              alt={data.food_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-3 text-white text-xs font-medium px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md">
              Multimodal Scan
            </div>
          </div>
        )}

        <div className={`p-6 sm:p-8 flex flex-col justify-between ${imagePreviewUrl ? 'md:col-span-2' : 'col-span-3'}`}>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              {getConfidenceBadge(data.confidence)}

              <div className="flex items-center gap-2">
                {onAddToFavorites && (
                  <button
                    type="button"
                    onClick={handleFavoriteClick}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      isFavorited
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 hover:text-amber-600'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-500 text-amber-500' : ''}`} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Done Editing' : 'Edit Result'}
                </button>
              </div>
            </div>

            {/* Food Name & Portion (Editable when isEditing) */}
            {isEditing ? (
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Food / Dish Name
                  </label>
                  <input
                    type="text"
                    value={data.food_name}
                    onChange={e => setData({ ...data, food_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-base font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Serving Size / Portion
                  </label>
                  <input
                    type="text"
                    value={data.serving_size}
                    onChange={e => setData({ ...data, serving_size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                  {data.food_name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Portion: <strong className="text-slate-800 dark:text-slate-200">{data.serving_size || 'Standard Serving'}</strong>
                </p>
              </div>
            )}

            {data.health_notes && (
              <div className="mt-3 flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm">
                <HeartPulse className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{data.health_notes}</span>
              </div>
            )}

            {data.warnings && (
              <div className="mt-2.5 flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{data.warnings}</span>
              </div>
            )}
          </div>

          {/* Quick Macro Highlights (Editable if isEditing) */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <div className="w-full">
                {isEditing ? (
                  <input
                    type="number"
                    value={data.calories}
                    onChange={e => setData({ ...data, calories: Number(e.target.value) })}
                    className="w-full p-1 rounded font-black text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800"
                  />
                ) : (
                  <div className="text-xl font-black text-slate-900 dark:text-white">{data.calories}</div>
                )}
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Calories</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="w-full">
                {isEditing ? (
                  <input
                    type="number"
                    value={data.protein}
                    onChange={e => setData({ ...data, protein: Number(e.target.value) })}
                    className="w-full p-1 rounded font-black text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800"
                  />
                ) : (
                  <div className="text-xl font-black text-slate-900 dark:text-white">{data.protein}g</div>
                )}
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Protein</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Wheat className="w-5 h-5" />
              </div>
              <div className="w-full">
                {isEditing ? (
                  <input
                    type="number"
                    value={data.carbohydrates}
                    onChange={e => setData({ ...data, carbohydrates: Number(e.target.value) })}
                    className="w-full p-1 rounded font-black text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800"
                  />
                ) : (
                  <div className="text-xl font-black text-slate-900 dark:text-white">{data.carbohydrates}g</div>
                )}
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Carbs</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Droplet className="w-5 h-5" />
              </div>
              <div className="w-full">
                {isEditing ? (
                  <input
                    type="number"
                    value={data.fat}
                    onChange={e => setData({ ...data, fat: Number(e.target.value) })}
                    className="w-full p-1 rounded font-black text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800"
                  />
                ) : (
                  <div className="text-xl font-black text-slate-900 dark:text-white">{data.fat}g</div>
                )}
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fats</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Nutrition Breakdown & Ingredients */}
      <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-850">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fiber & Sugar */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Detailed Micronutrient Profile
            </h3>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Dietary Fiber</span>
                  <span className="text-slate-900 dark:text-white font-bold">{data.fiber} g</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (data.fiber / 15) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Natural Sugars</span>
                  <span className="text-slate-900 dark:text-white font-bold">{data.sugar} g</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (data.sugar / 25) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Ingredients */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              Identified Ingredients ({data.ingredients?.length || 0})
            </h3>

            {data.ingredients && data.ingredients.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.ingredients.map((ingredient, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No specific sub-ingredients listed for this item.</p>
            )}
          </div>
        </div>

        {/* Meal Logging Controls (Section 71: Edit Result, Log Meal, Scan Again) */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Log as:</span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/60 dark:bg-slate-700 rounded-xl text-xs font-medium">
              {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    mealType === type
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onScanAnother}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Scan Again</span>
            </button>

            <button
              type="button"
              onClick={handleLogClick}
              disabled={isLogging || hasLogged}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all text-xs shadow-md cursor-pointer ${
                hasLogged
                  ? 'bg-emerald-700 text-white cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {hasLogged ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Meal Logged!</span>
                </>
              ) : isLogging ? (
                <span>Logging...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Log Meal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
