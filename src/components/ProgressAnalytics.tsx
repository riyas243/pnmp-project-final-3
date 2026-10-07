import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Target,
  Scale,
  Flame,
  Droplet,
  Moon,
  FileDown,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import { ProgressData, UserProfile, NutritionPlan, FamilyMember } from '../types.ts';
import { LanguageCode } from '../utils/translations.ts';
import { exportNutritionReportPdf } from '../utils/pdfExport.ts';

interface ProgressAnalyticsProps {
  member: FamilyMember;
  profile: UserProfile;
  targets: NutritionPlan;
  language: LanguageCode;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  member,
  profile,
  targets,
}) => {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/progress-data?member_id=${member.id}`);
        if (res.ok) {
          const resJson = await res.json();
          setData(resJson);
        }
      } catch (err) {
        console.warn('Failed to load progress data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, [member.id]);

  // Section 64: Nutrition Goal Progress Calculations
  const startingWeight = 74.0; // Reference initial weight
  const currentWeight = profile.weight_kg;
  const targetWeight = profile.target_weight_kg || 68.0;

  const totalToChange = Math.abs(startingWeight - targetWeight);
  const actualChanged = Math.abs(startingWeight - currentWeight);
  const remainingWeight = Math.max(0, Math.round(Math.abs(currentWeight - targetWeight) * 10) / 10);
  const progressPct = totalToChange > 0 ? Math.min(100, Math.round((actualChanged / totalToChange) * 100)) : 100;

  const isWeightLoss = profile.fitness_goal === 'Weight Loss';

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
            <LineChart className="w-3.5 h-3.5 text-emerald-600" />
            14-Day Health Metrics & Clinical Trends
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Progress Analytics — {member.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Track daily caloric consistency, macronutrient compliance, body mass evolution, hydration levels, and restorative sleep quality.
          </p>
        </div>

        {data && (
          <button
            type="button"
            onClick={() => exportNutritionReportPdf(member.name, profile, targets, data)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer self-start sm:self-auto"
          >
            <FileDown className="w-4 h-4" />
            Download Nutrition Report (PDF)
          </button>
        )}
      </div>

      {/* Section 64: Goal Progress Section with Visual Indicators */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Weight Goal Progress & Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Strategy: <strong className="text-slate-800 dark:text-slate-200">{profile.fitness_goal}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {progressPct}%
            </span>
            <span className="text-xs text-slate-400">Achieved</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 shadow-sm"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Starting: {startingWeight} kg</span>
            <span className="font-bold text-slate-900 dark:text-white">Current: {currentWeight} kg</span>
            <span>Target: {targetWeight} kg</span>
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Starting Weight
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white">{startingWeight} kg</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Current Weight
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white">{currentWeight} kg</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Weight Change
            </span>
            <div className="text-xl font-black text-emerald-600 flex items-center gap-1">
              {isWeightLoss ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              {Math.round(actualChanged * 10) / 10} kg
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Remaining to Goal
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white">{remainingWeight} kg</div>
          </div>
        </div>
      </div>

      {/* 14-Day Calorie & Macro Intake Bars */}
      {data && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                14-Day Caloric Intake vs Target ({targets.target_calories} kcal)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualizing daily caloric adherence over the past two weeks.
              </p>
            </div>
          </div>

          {/* Visual Bar Graph */}
          <div className="space-y-3">
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end h-48 pt-6 pb-2 border-b border-slate-200 dark:border-slate-700">
              {data.labels.map((label, idx) => {
                const cals = data.calories[idx] || 0;
                const maxCal = Math.max(3000, targets.target_calories * 1.3);
                const heightPct = Math.min(100, Math.round((cals / maxCal) * 100));
                const isOver = cals > targets.target_calories + 200;
                const isGood = cals >= targets.target_calories - 200 && cals <= targets.target_calories + 200;

                return (
                  <div key={label} className="flex flex-col items-center gap-1 group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow whitespace-nowrap z-20">
                      {label}: {cals} kcal
                    </div>

                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        cals === 0
                          ? 'bg-slate-200 dark:bg-slate-700 h-2'
                          : isGood
                          ? 'bg-emerald-500'
                          : isOver
                          ? 'bg-rose-500'
                          : 'bg-amber-400'
                      }`}
                      style={{ height: cals === 0 ? '6px' : `${Math.max(8, heightPct)}%` }}
                    ></div>
                    <span className="text-[9px] text-slate-400 truncate w-full text-center">
                      {label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500"></span> On Target (±200 kcal)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400"></span> Under Target
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500"></span> Over Target
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hydration & Sleep Dual Trends */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hydration */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-500" />
              Hydration Intake Trend (Target: {targets.water_target_ml} ml)
            </h3>
            <div className="space-y-2">
              {data.labels.slice(-5).map((label, idx) => {
                const actualIdx = data.labels.length - 5 + idx;
                const water = data.water[actualIdx] || 0;
                const pct = Math.min(100, Math.round((water / targets.water_target_ml) * 100));

                return (
                  <div key={label} className="text-xs">
                    <div className="flex justify-between font-semibold mb-1 text-slate-600 dark:text-slate-400">
                      <span>{label}</span>
                      <span>{water} ml ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sleep */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-500" />
              Sleep Quality & Duration Trend
            </h3>
            <div className="space-y-2">
              {data.labels.slice(-5).map((label, idx) => {
                const actualIdx = data.labels.length - 5 + idx;
                const sleep = data.sleep[actualIdx] || 0;
                const pct = Math.min(100, Math.round((sleep / 8.0) * 100));

                return (
                  <div key={label} className="text-xs">
                    <div className="flex justify-between font-semibold mb-1 text-slate-600 dark:text-slate-400">
                      <span>{label}</span>
                      <span>{sleep} hrs</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
