import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Check,
  Activity,
  Flame,
  Scale,
  Heart,
  ChevronRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { FamilyMember, UserProfile, NutritionPlan } from '../types.ts';
import { LanguageCode, t } from '../utils/translations.ts';

interface EnrichedMember {
  member: FamilyMember;
  profile: UserProfile;
  targets: NutritionPlan;
}

interface FamilyProfilesProps {
  members: EnrichedMember[];
  activeMemberId: string;
  onSwitchMember: (id: string) => void;
  onRefreshFamily: () => void;
  language: LanguageCode;
}

export const FamilyProfiles: React.FC<FamilyProfilesProps> = ({
  members,
  activeMemberId,
  onSwitchMember,
  onRefreshFamily,
  language,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Child',
    age: 18,
    gender: 'Male',
    height_cm: 165,
    weight_kg: 60,
    activity_level: 'Moderately Active',
    dietary_preference: 'Vegetarian',
    fitness_goal: 'Weight Maintenance',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Please enter a name for the family member.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/family/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to add family member.');
      } else {
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          relationship: 'Child',
          age: 18,
          gender: 'Male',
          height_cm: 165,
          weight_kg: 60,
          activity_level: 'Moderately Active',
          dietary_preference: 'Vegetarian',
          fitness_goal: 'Weight Maintenance',
        });
        onRefreshFamily();
      }
    } catch (err) {
      setErrorMsg('Network error adding member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}'s profile and all their isolated health data?`)) return;

    try {
      const res = await fetch(`/api/family/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshFamily();
      } else {
        const data = await res.json();
        alert(data.error || 'Cannot delete member');
      }
    } catch (err) {
      alert('Error removing member.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Complete Health & Nutrition Isolation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Family Nutrition Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Each family member maintains completely separate food history, favorite foods, meal plans, grocery lists, water intake, sleep logs, and weight trends.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Family Member
        </button>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(({ member, profile, targets }) => {
          const isActive = member.id === activeMemberId;

          return (
            <div
              key={member.id}
              className={`rounded-3xl p-6 transition-all border flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-800 border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
              }`}
            >
              <div>
                {/* Top Row: Avatar & Active Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                        {member.name}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {member.relationship} {member.is_primary && '• Primary Account'}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                {/* Biometrics Summary Chips */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">BMI & Status</span>
                    <strong className="text-slate-900 dark:text-white">{targets.bmi}</strong>{' '}
                    <span className="text-[10px] font-medium text-emerald-600">({targets.bmi_category})</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">Daily Calorie Target</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{targets.target_calories}</strong>{' '}
                    <span className="text-[10px] text-slate-400">kcal</span>
                  </div>
                </div>

                {/* Characteristics */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span>Goal:</span>
                    <strong className="text-slate-900 dark:text-white">{profile.fitness_goal}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Dietary Style:</span>
                    <strong className="text-slate-900 dark:text-white">{profile.dietary_preference}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Biometrics:</span>
                    <span>{profile.age} yrs • {profile.weight_kg} kg • {profile.height_cm} cm</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-1 flex items-center justify-between gap-2">
                {isActive ? (
                  <button
                    disabled
                    className="flex-1 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs text-center cursor-default"
                  >
                    Current Active Profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSwitchMember(member.id)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    Switch to {member.name}
                  </button>
                )}

                {!member.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Add New Family Member
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 text-xs border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Maya"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Relationship
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height_cm}
                    onChange={e => setFormData({ ...formData, height_cm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight_kg}
                    onChange={e => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Fitness Goal
                  </label>
                  <select
                    value={formData.fitness_goal}
                    onChange={e => setFormData({ ...formData, fitness_goal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Weight Maintenance">Weight Maintenance</option>
                    <option value="Weight Gain">Weight Gain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Dietary Preference
                </label>
                <select
                  value={formData.dietary_preference}
                  onChange={e => setFormData({ ...formData, dietary_preference: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Keto">Keto</option>
                  <option value="Jain">Jain</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Creating Profile...' : 'Create Family Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
