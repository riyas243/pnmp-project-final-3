import React, { useState, useEffect } from 'react';
import {
  User,
  Heart,
  Scale,
  Flame,
  Droplet,
  Save,
  CheckCircle2,
  AlertCircle,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { FamilyMember, UserProfile as UserProfileType, NutritionPlan } from '../types.ts';
import { LanguageCode } from '../utils/translations.ts';

interface UserProfileProps {
  member: FamilyMember;
  profile: UserProfileType;
  targets: NutritionPlan;
  onProfileUpdated: () => void;
  language: LanguageCode;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  member,
  profile: initialProfile,
  targets: initialTargets,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<UserProfileType>({ ...initialProfile });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setProfile({ ...initialProfile });
  }, [initialProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch(`/api/profile?member_id=${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.id,
          age: profile.age,
          gender: profile.gender,
          height_cm: profile.height_cm,
          weight_kg: profile.weight_kg,
          activity_level: profile.activity_level,
          dietary_preference: profile.dietary_preference,
          allergies: profile.allergies,
          medical_conditions: profile.medical_conditions,
          fitness_goal: profile.fitness_goal,
          target_weight_kg: profile.target_weight_kg,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        onProfileUpdated();
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      alert('Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            Biometric Engine & Calibration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Personal Health Profile — {member.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Update physiological parameters, dietary styles, allergies, and wellness targets to re-calculate daily caloric and macronutrient targets.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Profile and nutrition targets successfully updated!
          </div>
        )}
      </div>

      {/* Calculated Metrics Dashboard Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Body Mass Index (BMI)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {initialTargets.bmi}
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
            initialTargets.bmi_category === 'Normal Weight'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {initialTargets.bmi_category}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Basal Metabolic Rate (BMR)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {initialTargets.bmr}
          </div>
          <span className="text-xs text-slate-500">kcal burned at rest</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Daily Expenditure (TDEE)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {initialTargets.tdee}
          </div>
          <span className="text-xs text-slate-500">kcal/day maintenance</span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block mb-1">
            Daily Target Calories
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {initialTargets.target_calories}
          </div>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {initialProfile.fitness_goal}
          </span>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
          Biometrics & Physical Activity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Age (Years)
            </label>
            <input
              type="number"
              required
              min={1}
              max={120}
              value={profile.age}
              onChange={e => setProfile({ ...profile, age: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Biological Gender
            </label>
            <select
              value={profile.gender}
              onChange={e => setProfile({ ...profile, gender: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-semibold"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Physical Activity Level
            </label>
            <select
              value={profile.activity_level}
              onChange={e => setProfile({ ...profile, activity_level: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-semibold"
            >
              <option value="Sedentary">Sedentary (Little or no exercise)</option>
              <option value="Lightly Active">Lightly Active (1-3 days/wk)</option>
              <option value="Moderately Active">Moderately Active (3-5 days/wk)</option>
              <option value="Very Active">Very Active (6-7 days/wk)</option>
              <option value="Extra Active">Extra Active (Very heavy physical work)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={profile.height_cm}
              onChange={e => setProfile({ ...profile, height_cm: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Current Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={profile.weight_kg}
              onChange={e => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Target Goal Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={profile.target_weight_kg || profile.weight_kg}
              onChange={e => setProfile({ ...profile, target_weight_kg: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-semibold"
            />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-700 pt-6 pb-2">
          Dietary Constraints & Clinical Conditions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Dietary Preference
            </label>
            <select
              value={profile.dietary_preference}
              onChange={e => setProfile({ ...profile, dietary_preference: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-semibold"
            >
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Eggetarian">Eggetarian</option>
              <option value="Pescatarian">Pescatarian</option>
              <option value="Keto">Keto</option>
              <option value="Jain">Jain</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Primary Fitness Goal
            </label>
            <select
              value={profile.fitness_goal}
              onChange={e => setProfile({ ...profile, fitness_goal: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-semibold"
            >
              <option value="Weight Loss">Weight Loss (Caloric Deficit -500 kcal)</option>
              <option value="Weight Maintenance">Weight Maintenance (Balanced TDEE)</option>
              <option value="Weight Gain">Weight Gain (Caloric Surplus +400 kcal)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Food Allergies / Intolerances
            </label>
            <input
              type="text"
              value={profile.allergies}
              onChange={e => setProfile({ ...profile, allergies: e.target.value })}
              placeholder="e.g. Peanuts, Gluten, Dairy, Shellfish (or None)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Medical Considerations
            </label>
            <input
              type="text"
              value={profile.medical_conditions}
              onChange={e => setProfile({ ...profile, medical_conditions: e.target.value })}
              placeholder="e.g. Type 2 Diabetes, Hypertension, PCOD, Thyroid (or None)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Recalculating Plan...' : 'Save & Recalculate Nutrition Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};
