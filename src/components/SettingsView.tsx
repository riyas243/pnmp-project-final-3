import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Sun,
  Moon,
  Globe,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import { AIStatusType, ReminderSetting } from '../types.ts';
import { LanguageCode } from '../utils/translations.ts';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  aiStatus: AIStatusType;
  modelName: string;
  onRefreshAiStatus: () => void;
  reminders: ReminderSetting[];
  onUpdateReminders: (updated: ReminderSetting[]) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onToggleTheme,
  language,
  onChangeLanguage,
  aiStatus,
  modelName,
  onRefreshAiStatus,
  reminders: initialReminders,
  onUpdateReminders,
}) => {
  const [reminders, setReminders] = useState<ReminderSetting[]>(initialReminders);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Browser notifications are not supported in this environment. In-app alerts will be used.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        showToast('Notification permission granted!');
        new Notification('PNMP Health Reminders Active', {
          body: 'You will receive reminders for water, meals, and wellness tracking.',
          icon: '/favicon.ico',
        });
      } else {
        showToast('Notification permission was not granted. In-app alerts active.');
      }
    } catch (err) {
      showToast('Using in-app notification toasts.');
    }
  };

  const handleToggleReminder = async (id: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    setReminders(updated);
    await onUpdateReminders(updated);
    showToast('Reminder setting updated');
  };

  const handleTimeChange = async (id: string, time: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, time } : r));
    setReminders(updated);
    await onUpdateReminders(updated);
  };

  const triggerTestNotification = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('PNMP Hydration Reminder', {
        body: 'Time to drink a glass of water (250ml)! Keep up with your hydration target.',
      });
    }
    showToast('💧 Test Reminder: Time to drink a glass of water (250ml)!');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-500">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-3">
          <Settings className="w-3.5 h-3.5 text-emerald-600" />
          System Preferences & Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
          Customize UI theme, interface localization, automated health reminders, and verify Gemini multimodal status.
        </p>
      </div>

      {/* Section 69: Dark Mode & Theme */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          Display Appearance (Dark / Light Mode)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose a theme optimized for daytime readability or night-time eye comfort. Your preference is automatically stored.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (theme !== 'light') onToggleTheme();
            }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
              theme === 'light'
                ? 'bg-emerald-50/60 border-emerald-500 text-slate-900 font-bold shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold block">Light Mode</span>
                <span className="text-[11px] text-slate-400">Crisp daytime contrast</span>
              </div>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (theme !== 'dark') onToggleTheme();
            }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
              theme === 'dark'
                ? 'bg-slate-700 border-emerald-500 text-white font-bold shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold block">Dark Mode</span>
                <span className="text-[11px] text-slate-400">Low-glare night palette</span>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Language Switching */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          Language & Regional Localization
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Switch between English, Tamil, and Hindi for full platform terms and dashboard metrics.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { code: 'en' as const, name: 'English', native: 'English' },
            { code: 'ta' as const, name: 'Tamil', native: 'தமிழ்' },
            { code: 'hi' as const, name: 'Hindi', native: 'हिंदी' },
          ].map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => onChangeLanguage(lang.code)}
              className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                language === lang.code
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              <div className="text-sm font-black">{lang.native}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{lang.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Section 68: Automated Health Reminder System */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              Automated Wellness & Meal Reminders
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Receive timely prompts for water hydration, structured meal windows, sleep wind-down, and weekly meal planning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestNotificationPermission}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Enable Browser Alerts
            </button>
            <button
              type="button"
              onClick={triggerTestNotification}
              className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200 transition"
            >
              Test Alert
            </button>
          </div>
        </div>

        {/* Reminders List */}
        <div className="space-y-3 pt-2">
          {reminders.map(r => (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{r.label}</h4>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Category: {r.type}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={r.time}
                  onChange={e => handleTimeChange(r.id, e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => handleToggleReminder(r.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    r.enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {r.enabled ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Engine & Diagnostics */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          Google Gemini AI Multimodal Engine Diagnostics
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Food recognition and weekly meal plan generation are executed via server-side Google GenAI SDK.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Status</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${aiStatus === 'AI Ready' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <strong className="text-sm text-slate-900 dark:text-white">{aiStatus}</strong>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Configured Model</span>
            <strong className="text-sm text-slate-900 dark:text-white">{modelName}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
