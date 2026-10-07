import React from 'react';
import {
  Activity,
  Camera,
  Calendar,
  Search,
  BookOpen,
  LineChart,
  Users,
  User,
  Settings,
  FlaskConical,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { AIStatusType, FamilyMember, AuthUser } from '../types.ts';
import { LanguageCode, t } from '../utils/translations.ts';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  aiStatus: AIStatusType;
  modelName: string;
  isRefreshingStatus: boolean;
  onRefreshStatus: () => void;
  loggedMealsCount: number;
  familyMembers: FamilyMember[];
  activeMemberId: string;
  onSwitchMember: (id: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  aiStatus,
  modelName,
  isRefreshingStatus,
  onRefreshStatus,
  loggedMealsCount,
  familyMembers,
  activeMemberId,
  onSwitchMember,
  theme,
  onToggleTheme,
  language,
  onChangeLanguage,
  currentUser,
  onLogout,
}) => {
  const activeMember = familyMembers.find(m => m.id === activeMemberId) || familyMembers[0];

  const getStatusBadge = () => {
    switch (aiStatus) {
      case 'AI Ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Gemini AI Ready
          </span>
        );
      case 'AI Configuration Missing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Gemini Setup Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            {aiStatus}
          </span>
        );
    }
  };

  const navItems = [
    { id: 'dashboard', label: t('dashboard', language), icon: Activity },
    { id: 'meal_plan', label: t('meal_plan', language), icon: Calendar, badge: 'AI' },
    { id: 'scan', label: t('food_scan', language), icon: Camera },
    { id: 'search', label: t('search', language), icon: Search },
    { id: 'diary', label: t('diary', language), icon: BookOpen, count: loggedMealsCount },
    { id: 'progress', label: t('progress', language), icon: LineChart },
    { id: 'family', label: t('family', language), icon: Users, count: familyMembers.length },
    { id: 'profile', label: t('profile', language), icon: User },
    { id: 'settings', label: t('settings', language), icon: Settings },
    { id: 'login', label: currentUser ? (currentUser.name.split(' ')[0] || 'Account') : t('login', language), icon: LogIn, badge: currentUser ? 'User' : undefined },
    { id: 'tests', label: t('tests', language), icon: FlaskConical },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-black text-lg tracking-wider">
              PN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  PNMP Health
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="w-2.5 h-2.5" /> v2.4 AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-xs">
                {t('app_title', language)}
              </p>
            </div>
          </div>

          {/* Right Controls: AI status, Member Switcher, Lang, Theme */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Status Badge */}
            <div className="hidden md:flex items-center" title={`Gemini Model: ${modelName}`}>
              {getStatusBadge()}
            </div>

            {/* Active Family Member Selector */}
            {familyMembers.length > 0 && (
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {activeMember?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{activeMember?.name || 'Member'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-1 w-52 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 hidden group-hover:block z-50 animate-fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                    {t('switch_member', language)}
                  </div>
                  {familyMembers.map(m => (
                    <button
                      key={m.id}
                      onClick={() => onSwitchMember(m.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-slate-700 ${
                        m.id === activeMemberId ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-slate-700/50' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[11px] font-bold">
                          {m.name.charAt(0)}
                        </div>
                        <span className="truncate">{m.name}</span>
                      </div>
                      {m.is_primary && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                          Self
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                  <button
                    onClick={() => setActiveTab('family')}
                    className="w-full text-left px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-slate-700"
                  >
                    + {t('add_member', language)}
                  </button>
                </div>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={`px-2 py-1 rounded transition ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('ta')}
                className={`px-2 py-1 rounded transition ${
                  language === 'ta'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('hi')}
                className={`px-2 py-1 rounded transition ${
                  language === 'hi'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700"
              title={theme === 'dark' ? t('light_mode', language) : t('dark_mode', language)}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Account / Login Page Button */}
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : currentUser
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title={currentUser ? `Account: ${currentUser.email}` : 'Sign In / Account'}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {currentUser ? (currentUser.name.split(' ')[0] || 'Account') : t('login', language)}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Scrollable on mobile) */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-100 dark:border-slate-800/80">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
