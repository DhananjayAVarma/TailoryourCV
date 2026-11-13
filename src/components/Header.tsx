import React from 'react';
import { Moon, Sun, Briefcase, Sparkles } from 'lucide-react';

export type ActiveTab = 'vault' | 'studio';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="no-print glass-header md:sticky md:top-0 z-30 border-b transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 md:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-6">
        {/* Top Row on Mobile / Left + Right on Desktop Wrapper */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Zone 1: Brand Title with custom logo.jpg */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('vault');
            }}
            className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            <img
              src="/logo.jpg"
              alt="TailorCV Studio Logo"
              className="w-9 h-9 rounded-xl object-cover border border-white/40 shadow-md shrink-0"
            />
            <span>TailorCV Studio</span>
          </a>

          {/* Mobile-only Dark Mode Toggle (aligned on the top bar next to logo) */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex md:hidden items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg glass-tab-bar text-slate-800 dark:text-slate-100 hover:border-white/70 dark:hover:border-white/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Zone 2: Two Main Glassmorphism Overlay Navigation Tabs */}
        <nav
          aria-label="Main workspace navigation"
          className="glass-tab-bar grid grid-cols-2 md:flex items-center gap-1 sm:gap-1.5 p-1 w-full md:w-auto rounded-xl"
        >
          <button
            type="button"
            onClick={() => onSelectTab('vault')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 text-[11px] sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'vault'
                ? 'glass-tab-active'
                : 'text-slate-700 dark:text-slate-200/80 hover:text-slate-950 dark:hover:text-white hover:bg-white/25 dark:hover:bg-white/10'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>1. Master Profile Vault</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('studio')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 text-[11px] sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'studio'
                ? 'glass-tab-active'
                : 'text-slate-700 dark:text-slate-200/80 hover:text-slate-950 dark:hover:text-white hover:bg-white/25 dark:hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>2. Tailor &amp; Export Studio</span>
          </button>
        </nav>

        {/* Zone 3: Desktop Light / Dark Mode Toggle */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg glass-tab-bar text-slate-800 dark:text-slate-100 hover:border-white/80 dark:hover:border-white/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
