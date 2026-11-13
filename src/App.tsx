import { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { VaultTab } from './components/VaultTab';
import { StudioTab } from './components/StudioTab';
import {
  MasterProfile,
  StudioSettings,
  TailoredResumeData,
} from './types/cv';
import {
  DEFAULT_STUDIO_SETTINGS,
  SAMPLE_MASTER_PROFILE,
  createInitialTailoredData,
  normalizeMasterProfile,
} from './utils/cvLogic';

const STORAGE_KEYS = {
  PROFILE: 'tailorcv_master_profile_v1',
  TAILORED: 'tailorcv_tailored_data_v1',
  SETTINGS: 'tailorcv_studio_settings_v1',
  THEME: 'tailorcv_dark_mode_v1',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('vault');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [profile, setProfile] = useState<MasterProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        return normalizeMasterProfile(JSON.parse(saved));
      }
    } catch {
      // Fallback to sample profile
    }
    return SAMPLE_MASTER_PROFILE;
  });

  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...DEFAULT_STUDIO_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to defaults
    }
    return DEFAULT_STUDIO_SETTINGS;
  });

  const [tailoredData, setTailoredData] = useState<TailoredResumeData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAILORED);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback to initial tailored data
    }
    return createInitialTailoredData(
      profile,
      settings.targetCompany,
      settings.jobDescription
    );
  });

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(darkMode));
    } catch {
      // Ignore storage quota errors
    }
  }, [darkMode]);

  // Persist Master Profile
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
  }, [profile]);

  // Persist Studio Settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  // Persist Tailored Resume & Cover Letter Data
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TAILORED, JSON.stringify(tailoredData));
    } catch {
      // Ignore storage quota errors
    }
  }, [tailoredData]);

  const handleUpdateSettings = (patch: Partial<StudioSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="relative min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      {/* Responsive Site Background: logo.jpg scaled to fill any screen/device with 70% Gaussian blur */}
      <div
        aria-hidden="true"
        className="no-print fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-[#060D1A]"
      >
        <img
          src="/logo.jpg"
          alt=""
          className="w-full h-full object-cover object-center scale-125"
          style={{ filter: 'blur(56px) saturate(1.25)' }}
        />
        <div className="absolute inset-0 bg-slate-100/35 dark:bg-slate-950/35 transition-colors" />
      </div>

      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      <main className="relative z-10 flex-1">
        {activeTab === 'vault' ? (
          <VaultTab
            profile={profile}
            onChangeProfile={setProfile}
            onProceedToStudio={() => setActiveTab('studio')}
          />
        ) : (
          <StudioTab
            profile={profile}
            onChangeProfile={setProfile}
            tailoredData={tailoredData}
            onChangeTailoredData={setTailoredData}
            settings={settings}
            onChangeSettings={handleUpdateSettings}
          />
        )}
      </main>
    </div>
  );
}
