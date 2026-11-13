import React, { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Briefcase, Sparkles, Copy, Check } from 'lucide-react';

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
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimeoutRef = useRef<number | null>(null);

  const isInfoOpen = isHovered || isPinned;

  const clearHoverTimeout = () => {
    if (hoverCloseTimeoutRef.current !== null) {
      window.clearTimeout(hoverCloseTimeoutRef.current);
      hoverCloseTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearHoverTimeout();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    clearHoverTimeout();
    hoverCloseTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const handleTogglePin = () => {
    clearHoverTimeout();
    setIsPinned((prev) => {
      const next = !prev;
      if (!next) {
        setIsHovered(false);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isInfoOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPinned(false);
        setIsHovered(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPinned(false);
        setIsHovered(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInfoOpen]);

  useEffect(() => {
    return () => clearHoverTimeout();
  }, []);

  return (
    <header className="no-print glass-header md:sticky md:top-0 z-30 border-b transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 md:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-6">
        {/* Top Row on Mobile / Left + Right on Desktop Wrapper */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Zone 1: Brand Title with custom logo.jpg and Creator '?' Info Trigger */}
          <div className="flex items-center gap-2 shrink-0">
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

            <div
              ref={popoverRef}
              className="relative flex items-center shrink-0"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={handleTogglePin}
                aria-label="About TailorCV Studio creator"
                aria-expanded={isInfoOpen}
                aria-haspopup="dialog"
                className={`w-[19px] h-[19px] rounded-full flex items-center justify-center text-[11px] font-light leading-none border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 ${
                  isInfoOpen
                    ? 'border-slate-500/70 dark:border-white/60 bg-white/60 dark:bg-white/20 text-slate-800 dark:text-white shadow-xs'
                    : 'border-slate-400/55 dark:border-white/35 bg-white/25 dark:bg-white/8 text-slate-600 dark:text-slate-200/80 hover:border-slate-500/75 dark:hover:border-white/55 hover:bg-white/45 dark:hover:bg-white/15 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ?
              </button>

              {isInfoOpen && (
                <div
                  role="dialog"
                  aria-label="About the creator"
                  className="glass-popover fixed left-4 right-4 top-14 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2.5 sm:w-[390px] rounded-2xl p-4 sm:p-5 z-50 transition-all duration-150 ease-out"
                >
                  <p className="text-[13px] sm:text-[13.5px] font-light leading-relaxed tracking-[0.01em] text-slate-700 dark:text-slate-100/90">
                    Hi, I&apos;m Dhananjay Varma, a passionate engineer playing with AI tools to solve everyday problems. I created TailorCV Studio to take the guesswork and repetitive formatting out of job applications helping candidates turn their real experience into tailored, ATS-ready resumes in seconds. Outside of building projects, I enjoy Video Games. Feel free to connect me on LinkedIn:{' '}
                    <a
                      href="https://www.linkedin.com/in/dhananjayvarma2000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-normal text-indigo-700 dark:text-sky-300 underline decoration-indigo-400/60 dark:decoration-sky-300/60 underline-offset-2 hover:text-indigo-900 dark:hover:text-white transition-colors"
                    >
                      Dhananjay Varma
                    </a>{' '}
                    or Email:{' '}
                    <span className="inline-flex items-center gap-1 align-baseline">
                      <a
                        href="https://mail.google.com/mail/?view=cm&fs=1&to=dhananjayvarma12@gmail.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-normal text-indigo-700 dark:text-sky-300 underline decoration-indigo-400/60 dark:decoration-sky-300/60 underline-offset-2 hover:text-indigo-900 dark:hover:text-white transition-colors"
                      >
                        dhananjayvarma12@gmail.com
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText('dhananjayvarma12@gmail.com').then(() => {
                            setCopiedEmail(true);
                            window.setTimeout(() => setCopiedEmail(false), 1800);
                          }).catch(() => {});
                        }}
                        aria-label="Copy email address"
                        title={copiedEmail ? 'Copied!' : 'Copy email address'}
                        className="inline-flex items-center justify-center p-0.5 rounded text-slate-500 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedEmail ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </span>
                    .
                  </p>
                  <p className="mt-2.5 text-[13px] sm:text-[13.5px] font-light leading-relaxed tracking-[0.01em] text-slate-700 dark:text-slate-100/90">
                    Enjoy the site with 🫰 from Dhananjay
                  </p>
                </div>
              )}
            </div>
          </div>

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
