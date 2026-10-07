import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { MealPlanner } from './components/MealPlanner.tsx';
import { FoodScanner } from './components/FoodScanner.tsx';
import { NutritionSearch } from './components/NutritionSearch.tsx';
import { DailyDiary } from './components/DailyDiary.tsx';
import { ProgressAnalytics } from './components/ProgressAnalytics.tsx';
import { FamilyProfiles } from './components/FamilyProfiles.tsx';
import { UserProfile } from './components/UserProfile.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { TestingLab } from './components/TestingLab.tsx';
import { SetupGuide } from './components/SetupGuide.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import {
  AIStatusType,
  FoodScanData,
  LoggedMealItem,
  NutritionTotals,
  FamilyMember,
  UserProfile as UserProfileType,
  NutritionPlan,
  FavoriteFood,
  ReminderSetting,
  AuthUser,
} from './types.ts';
import { LanguageCode } from './utils/translations.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'meal_plan'
    | 'scan'
    | 'search'
    | 'diary'
    | 'progress'
    | 'family'
    | 'profile'
    | 'settings'
    | 'tests'
    | 'guide'
    | 'login'
  >('dashboard');

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('pnmp_auth_user');
      return saved ? JSON.parse(saved) : { id: 'usr-demo-1', name: 'Riyas Demo', email: 'demo@pnmp.com' };
    } catch {
      return { id: 'usr-demo-1', name: 'Riyas Demo', email: 'demo@pnmp.com' };
    }
  });

  // Theme & Language state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('pnmp_theme') as 'light' | 'dark') || 'light';
  });
  const [language, setLanguage] = useState<LanguageCode>(() => {
    return (localStorage.getItem('pnmp_lang') as LanguageCode) || 'en';
  });

  // AI Status
  const [aiStatus, setAiStatus] = useState<AIStatusType>('AI Configuration Missing');
  const [modelName, setModelName] = useState<string>('gemini-3.8-flash');
  const [isRefreshingStatus, setIsRefreshingStatus] = useState<boolean>(false);

  // Active Family & Profiles state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [enrichedMembers, setEnrichedMembers] = useState<any[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('mem-demo-riyas');

  const [profile, setProfile] = useState<UserProfileType>({
    member_id: 'mem-demo-riyas',
    age: 25,
    gender: 'Male',
    height_cm: 175,
    weight_kg: 72,
    activity_level: 'Moderately Active',
    dietary_preference: 'Vegetarian',
    allergies: 'None',
    medical_conditions: 'None',
    fitness_goal: 'Weight Loss',
    target_weight_kg: 68,
  });

  const [targets, setTargets] = useState<NutritionPlan>({
    bmi: 23.5,
    bmi_category: 'Normal Weight',
    bmi_color: 'success',
    bmi_advice: 'Healthy weight range.',
    bmr: 1690,
    tdee: 2620,
    target_calories: 2120,
    goal: 'Weight Loss',
    goal_note: 'Targeting safe deficit.',
    protein_g: 159,
    carbs_g: 238.5,
    fat_g: 58.9,
    water_target_ml: 2520,
    sleep_target_hours: 8,
  });

  // Active Member Isolated Data
  const [meals, setMeals] = useState<LoggedMealItem[]>([]);
  const [history, setHistory] = useState<LoggedMealItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [waterMl, setWaterMl] = useState<number>(1250);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [reminders, setReminders] = useState<ReminderSetting[]>([]);

  const [totals, setTotals] = useState<NutritionTotals>({
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
  });

  // Apply dark mode class to html document element and body
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('pnmp_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('pnmp_lang', language);
  }, [language]);

  // 1. Fetch AI Status
  const fetchAiStatus = useCallback(async () => {
    setIsRefreshingStatus(true);
    try {
      const res = await fetch('/api/ai-status');
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data.status as AIStatusType);
        if (data.model) setModelName(data.model);
      }
    } catch {
      setAiStatus('AI Service Temporarily Unavailable');
    } finally {
      setIsRefreshingStatus(false);
    }
  }, []);

  // 2. Fetch Family List
  const fetchFamily = useCallback(async () => {
    try {
      const res = await fetch('/api/family');
      if (res.ok) {
        const data = await res.json();
        setEnrichedMembers(data.members || []);
        const rawMembers = data.members.map((m: any) => m.member);
        setFamilyMembers(rawMembers);
        if (data.active_member_id && !activeMemberId) {
          setActiveMemberId(data.active_member_id);
        }
      }
    } catch (err) {
      console.warn('Failed to load family members:', err);
    }
  }, [activeMemberId]);

  // 3. Fetch Member Profile & Targets
  const fetchMemberProfile = useCallback(async (memberId: string) => {
    try {
      const res = await fetch(`/api/profile?member_id=${memberId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setTargets(data.targets);
      }
    } catch (err) {
      console.warn('Failed to load member profile:', err);
    }
  }, []);

  // 4. Fetch Meals, History, Favorites, Water, Sleep, Reminders for active member
  const fetchMemberHealthData = useCallback(async (memberId: string) => {
    try {
      // Meals & history
      const mealsRes = await fetch(`/api/meals?member_id=${memberId}`);
      if (mealsRes.ok) {
        const mData = await mealsRes.json();
        setMeals(mData.meals || []);
        setHistory(mData.history || []);
        if (mData.totals) setTotals(mData.totals);
      }

      // Favorites
      const favRes = await fetch(`/api/favorites?member_id=${memberId}`);
      if (favRes.ok) {
        const fData = await favRes.json();
        setFavorites(fData.favorites || []);
      }

      // Water
      const waterRes = await fetch(`/api/water?member_id=${memberId}`);
      if (waterRes.ok) {
        const wData = await waterRes.json();
        setWaterMl(wData.total_water || 0);
      }

      // Sleep
      const sleepRes = await fetch(`/api/sleep?member_id=${memberId}`);
      if (sleepRes.ok) {
        const sData = await sleepRes.json();
        setSleepHours(sData.sleep?.hours || 7.5);
      }

      // Reminders
      const remRes = await fetch(`/api/reminders?member_id=${memberId}`);
      if (remRes.ok) {
        const rData = await remRes.json();
        setReminders(rData.reminders || []);
      }
    } catch (err) {
      console.warn('Failed to load member health data:', err);
    }
  }, []);

  // Initial Boot
  useEffect(() => {
    fetchAiStatus();
    fetchFamily();
  }, [fetchAiStatus, fetchFamily]);

  // Reload data whenever active member changes (Section 72: complete isolation)
  useEffect(() => {
    if (activeMemberId) {
      fetchMemberProfile(activeMemberId);
      fetchMemberHealthData(activeMemberId);
    }
  }, [activeMemberId, fetchMemberProfile, fetchMemberHealthData]);

  // Switch Member Handler
  const handleSwitchMember = async (memberId: string) => {
    setActiveMemberId(memberId);
    try {
      await fetch('/api/switch-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      });
    } catch (err) {
      console.warn('Failed to switch member on server:', err);
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (user: AuthUser, newActiveMemberId?: string) => {
    setCurrentUser(user);
    localStorage.setItem('pnmp_auth_user', JSON.stringify(user));
    if (newActiveMemberId) {
      setActiveMemberId(newActiveMemberId);
    }
    fetchFamily();
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pnmp_auth_user');
    setActiveTab('login');
  };

  // Log Meal Handler
  const handleMealLogged = async (
    meal: FoodScanData,
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  ) => {
    const res = await fetch('/api/log-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: activeMemberId,
        meal,
        mealType,
      }),
    });

    if (res.ok) {
      await fetchMemberHealthData(activeMemberId);
    } else {
      throw new Error('Failed to log meal');
    }
  };

  // Delete Meal Handler
  const handleDeleteMeal = async (id: string) => {
    const res = await fetch(`/api/meals/${id}?member_id=${activeMemberId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      await fetchMemberHealthData(activeMemberId);
    }
  };

  // Add Favorite Handler
  const handleAddToFavorites = async (food: FoodScanData) => {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: activeMemberId,
        ...food,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setFavorites(prev => [data.favorite, ...prev.filter(f => f.id !== data.favorite.id)]);
    }
  };

  // Remove Favorite Handler
  const handleRemoveFavorite = async (id: string) => {
    const res = await fetch(`/api/favorites/${id}?member_id=${activeMemberId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setFavorites(prev => prev.filter(f => f.id !== id));
    }
  };

  // Log Water Handler
  const handleLogWater = async (amountMl: number) => {
    const res = await fetch('/api/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: activeMemberId,
        amount_ml: amountMl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setWaterMl(data.total_water);
    }
  };

  // Log Sleep Handler
  const handleLogSleep = async (hours: number, quality: 'Excellent' | 'Good' | 'Fair' | 'Poor') => {
    const res = await fetch('/api/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: activeMemberId,
        hours,
        quality,
      }),
    });

    if (res.ok) {
      setSleepHours(hours);
    }
  };

  // Update Reminders Handler
  const handleUpdateReminders = async (updated: ReminderSetting[]) => {
    await fetch('/api/reminders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: activeMemberId,
        reminders: updated,
      }),
    });
  };

  const activeMember = familyMembers.find(m => m.id === activeMemberId) || {
    id: activeMemberId,
    name: 'Riyas Demo',
    relationship: 'Self',
    is_primary: true,
    created_at: new Date().toISOString(),
    user_id: 'usr-demo-1',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Header with Navigation and AI Status */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        aiStatus={aiStatus}
        modelName={modelName}
        isRefreshingStatus={isRefreshingStatus}
        onRefreshStatus={fetchAiStatus}
        loggedMealsCount={meals.length}
        familyMembers={familyMembers}
        activeMemberId={activeMemberId}
        onSwitchMember={handleSwitchMember}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        language={language}
        onChangeLanguage={setLanguage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'dashboard' && (
          <Dashboard
            totals={totals}
            meals={meals}
            member={activeMember}
            profile={profile}
            targets={targets}
            waterMl={waterMl}
            sleepHours={sleepHours}
            onLogWater={handleLogWater}
            onLogSleep={handleLogSleep}
            onDeleteMeal={handleDeleteMeal}
            onGoToScanner={() => setActiveTab('scan')}
            onGoToMealPlan={() => setActiveTab('meal_plan')}
            onGoToSearch={() => setActiveTab('search')}
            onGoToDiary={() => setActiveTab('diary')}
            language={language}
          />
        )}

        {activeTab === 'meal_plan' && (
          <MealPlanner
            member={activeMember}
            profile={profile}
            targets={targets}
            language={language}
            onMealLogged={() => fetchMemberHealthData(activeMemberId)}
            onGoToProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'scan' && (
          <FoodScanner
            aiStatus={aiStatus}
            setAiStatus={setAiStatus}
            modelName={modelName}
            onMealLogged={handleMealLogged}
            onGoToGuide={() => setActiveTab('guide')}
          />
        )}

        {activeTab === 'search' && (
          <NutritionSearch
            language={language}
            onMealLogged={handleMealLogged}
            onAddToFavorites={handleAddToFavorites}
          />
        )}

        {activeTab === 'diary' && (
          <DailyDiary
            meals={meals}
            history={history}
            favorites={favorites}
            totals={totals}
            targets={targets}
            onDeleteMeal={handleDeleteMeal}
            onLogMeal={handleMealLogged}
            onRemoveFavorite={handleRemoveFavorite}
            onGoToScanner={() => setActiveTab('scan')}
            language={language}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressAnalytics
            member={activeMember}
            profile={profile}
            targets={targets}
            language={language}
          />
        )}

        {activeTab === 'family' && (
          <FamilyProfiles
            members={enrichedMembers}
            activeMemberId={activeMemberId}
            onSwitchMember={handleSwitchMember}
            onRefreshFamily={fetchFamily}
            language={language}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfile
            member={activeMember}
            profile={profile}
            targets={targets}
            onProfileUpdated={() => {
              fetchMemberProfile(activeMemberId);
              fetchFamily();
            }}
            language={language}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            language={language}
            onChangeLanguage={setLanguage}
            aiStatus={aiStatus}
            modelName={modelName}
            onRefreshAiStatus={fetchAiStatus}
            reminders={reminders}
            onUpdateReminders={handleUpdateReminders}
          />
        )}

        {activeTab === 'tests' && <TestingLab />}

        {activeTab === 'guide' && (
          <SetupGuide onGoToScanner={() => setActiveTab('scan')} />
        )}

        {activeTab === 'login' && (
          <LoginPage
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            onContinueAsGuest={() => setActiveTab('dashboard')}
            language={language}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 py-6 mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            PNMP • Personalized Nutrition &amp; Meal Planner with Google Gemini Multimodal Engine
          </span>
          <span className="text-[11px] text-slate-400">
            Current Profile: <strong>{activeMember.name}</strong> ({profile.dietary_preference})
          </span>
        </div>
      </footer>
    </div>
  );
}
