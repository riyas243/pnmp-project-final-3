import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Calendar,
  Search,
  Users,
  LogOut,
  Heart,
  ChevronRight,
  KeyRound,
} from 'lucide-react';
import { AuthUser } from '../types.ts';
import { LanguageCode, t } from '../utils/translations.ts';

interface LoginPageProps {
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser, activeMemberId?: string) => void;
  onLogout: () => void;
  onContinueAsGuest: () => void;
  language: LanguageCode;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  onLoginSuccess,
  onLogout,
  onContinueAsGuest,
  language,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('Vegetarian');
  const [fitnessGoal, setFitnessGoal] = useState('Weight Loss');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pre-fill demo credentials
  const handleQuickDemoLogin = async () => {
    setEmail('demo@pnmp.com');
    setPassword('Password123!');
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@pnmp.com', password: 'Password123!' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to sign in.');
      } else {
        setSuccessMessage('Welcome back, Riyas Demo!');
        setTimeout(() => {
          onLoginSuccess(data.user, data.active_member_id);
        }, 350);
      }
    } catch {
      setErrorMessage('Network error connecting to login service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickUserLogin = async () => {
    setEmail('lovelyriyas20@gmail.com');
    setPassword('Password123!');
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'lovelyriyas20@gmail.com', password: 'Password123!' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to sign in.');
      } else {
        setSuccessMessage('Welcome back!');
        setTimeout(() => {
          onLoginSuccess(data.user, data.active_member_id);
        }, 350);
      }
    } catch {
      setErrorMessage('Network error connecting to login service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      if (tab === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMessage(data.error || 'Invalid email or password.');
        } else {
          setSuccessMessage(`Welcome back, ${data.user.name}!`);
          setTimeout(() => {
            onLoginSuccess(data.user, data.active_member_id);
          }, 400);
        }
      } else {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name.');
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: trimmedEmail,
            password,
            dietary_preference: dietaryPreference,
            fitness_goal: fitnessGoal,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMessage(data.error || 'Registration failed.');
        } else {
          setSuccessMessage(`Account created successfully! Welcome, ${data.user.name}.`);
          setTimeout(() => {
            onLoginSuccess(data.user, data.active_member_id);
          }, 400);
        }
      }
    } catch {
      setErrorMessage('Network error connecting to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  // If already logged in, show user profile card with Switch / Sign Out options
  if (currentUser) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-emerald-500/30">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Authenticated Session
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {currentUser.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentUser.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-semibold">User ID:</span>
              <span className="font-mono text-slate-900 dark:text-white">{currentUser.id}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Preferred Language:</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">{language}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-semibold">Security Status:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Active &amp; Verified
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-600 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Switch User</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Brand & Feature Highlights */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-8 sm:p-10 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl tracking-wider shadow-inner">
                PN
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight">PNMP Health</span>
                <p className="text-xs text-emerald-100 font-medium">Personalized Nutrition &amp; Meal Planner</p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                Fuel Your Body with Intelligent Nutrition.
              </h2>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Log meals with multimodal AI photo scans, track isolated family profiles, and receive doctor-grade 7-day meal plans.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <Camera className="w-5 h-5 text-emerald-200 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">AI Food Plate Recognition</h4>
                  <p className="text-[11px] text-emerald-100/80">Snap food photos to estimate calories, macros, and ingredients instantly.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <Calendar className="w-5 h-5 text-emerald-200 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">7-Day Personalized Meal Plans</h4>
                  <p className="text-[11px] text-emerald-100/80">Tailored to your dietary preferences, BMI, TDEE, and fitness targets.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <Users className="w-5 h-5 text-emerald-200 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Family Profile Isolation</h4>
                  <p className="text-[11px] text-emerald-100/80">Separate food logs, hydration metrics, and plans for each family member.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-200" /> 100% Private &amp; Secure
            </span>
            <span className="font-mono text-[11px] opacity-80">v2.4 AI Active</span>
          </div>
        </div>

        {/* Right Column: Form Container */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Quick 1-Click Access Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Instant Access Options
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={isLoading}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-emerald-50/30 dark:hover:bg-slate-700/50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                      R
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        Riyas Demo User
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">demo@pnmp.com</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleQuickUserLogin}
                  disabled={isLoading}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-emerald-50/30 dark:hover:bg-slate-700/50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold shrink-0">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                        lovelyriyas20
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">lovelyriyas20@gmail.com</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-3 text-slate-400 dark:text-slate-500 font-semibold text-[11px]">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Error & Success Messages */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Riyas Ahmed"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-emerald-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setPassword('Password123!');
                        setErrorMessage('Password prefilled as Password123! for demo.');
                      }}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Fill demo password
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tab === 'register' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Dietary Preference
                    </label>
                    <select
                      value={dietaryPreference}
                      onChange={e => setDietaryPreference(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
                    >
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Eggetarian">Eggetarian</option>
                      <option value="Keto">Keto</option>
                      <option value="Jain">Jain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Primary Fitness Goal
                    </label>
                    <select
                      value={fitnessGoal}
                      onChange={e => setFitnessGoal(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-emerald-500"
                    >
                      <option value="Weight Loss">Weight Loss (Deficit)</option>
                      <option value="Weight Maintenance">Weight Maintenance</option>
                      <option value="Weight Gain">Muscle &amp; Weight Gain</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {isLoading
                    ? 'Processing...'
                    : tab === 'login'
                    ? 'Sign In to PNMP'
                    : 'Create Account & Begin'}
                </span>
              </button>
            </form>
          </div>

          {/* Guest / Skip Option */}
          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Want to test without signing in?</span>
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Continue as Guest</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
