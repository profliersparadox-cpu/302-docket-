import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SiteCustomization, SiteFontStyle, SiteThemePreset } from '../types.ts';

export const SITE_CUSTOMIZATION_STORAGE_KEY = 'docket_site_customization_v1';

export const THEME_PRESETS: Record<
  SiteThemePreset,
  {
    label: string;
    description: string;
    backgroundColor: string;
    panelColor: string;
    accentColor: string;
  }
> = {
  phosphor_noir: {
    label: 'Phosphor Noir',
    description: 'Classic 302 Docket emerald & dark steel',
    backgroundColor: '#060708',
    panelColor: '#121519',
    accentColor: '#34d399',
  },
  midnight_bureau: {
    label: 'Midnight Bureau',
    description: 'Deep federal navy with cyan telemetry',
    backgroundColor: '#050a14',
    panelColor: '#0f172a',
    accentColor: '#38bdf8',
  },
  amber_terminal: {
    label: 'Amber CRT',
    description: 'Warm monochrome 1980s amber monitor',
    backgroundColor: '#0a0702',
    panelColor: '#171106',
    accentColor: '#fbbf24',
  },
  parchment_dossier: {
    label: 'Espresso Dossier',
    description: 'Warm archival bronze & dark walnut',
    backgroundColor: '#110e0a',
    panelColor: '#1b1611',
    accentColor: '#f59e0b',
  },
  crimson_cold_case: {
    label: 'Crimson Cold Case',
    description: 'High-contrast scarlet investigative noir',
    backgroundColor: '#090507',
    panelColor: '#160b0f',
    accentColor: '#f87171',
  },
};

export const FONT_STYLE_MAP: Record<SiteFontStyle, { label: string; css: string }> = {
  tech: { label: 'Share Tech Mono (Retro)', css: "'Share Tech Mono', monospace" },
  typewriter: { label: 'Courier Prime (Typewriter)', css: "'Courier Prime', monospace" },
  serif: { label: 'Newsreader (Editorial)', css: "'Newsreader', Georgia, serif" },
  sans: { label: 'Clean Modern Sans', css: 'system-ui, -apple-system, sans-serif' },
};

export const DEFAULT_SITE_CUSTOMIZATION: SiteCustomization = {
  archiveTitle: 'THE 302 DOCKET',
  headerBadge: 'THE 302 DOCKET // OS v4.19',
  tagline: 'EVERY CASE LEAVES A PAPER TRAIL.',
  introHeading: 'SYSTEM DOCKET TERMINAL — FORM FD-302 INVESTIGATIVE SERIES',
  introBody:
    'Welcome to THE 302 DOCKET terminal. Every interview leaves a record. Every case leaves a paper trail. Access classified dossiers, inspect logged physical exhibits, analyze suspect network diagrams, and trace legal precedents across landmark criminal investigations.',
  disclaimer:
    'The 302 Docket is an independent cyber-investigative archive inspired by 1990s law enforcement terminals, Form FD-302 casework, and public judicial records. Not affiliated with the FBI, the Department of Justice, or any law enforcement agency.',
  themePreset: 'phosphor_noir',
  accentColor: '#34d399',
  backgroundColor: '#060708',
  panelColor: '#121519',
  fontStyle: 'tech',
  wallpaperUrl: '',
  wallpaperOpacity: 0.18,
  defaultCrtEnabled: true,
  skipBootScreen: false,
  showHeroWatermark: true,
};

interface SiteCustomizationContextType {
  customization: SiteCustomization;
  updateCustomization: (patch: Partial<SiteCustomization>) => void;
  applyThemePreset: (preset: SiteThemePreset) => void;
  resetCustomization: () => void;
  saveToServer: (next?: SiteCustomization) => Promise<boolean>;
  isSaving: boolean;
}

const SiteCustomizationContext = createContext<SiteCustomizationContextType | undefined>(undefined);

function loadInitialCustomization(): SiteCustomization {
  try {
    const raw = localStorage.getItem(SITE_CUSTOMIZATION_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SITE_CUSTOMIZATION, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SITE_CUSTOMIZATION;
}

export const SiteCustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customization, setCustomization] = useState<SiteCustomization>(loadInitialCustomization);
  const [isSaving, setIsSaving] = useState(false);

  // Sync initial server settings if user hasn't customized locally yet
  useEffect(() => {
    let active = true;
    const syncFromServer = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        const hasLocalOverride = Boolean(localStorage.getItem(SITE_CUSTOMIZATION_STORAGE_KEY));
        if (!hasLocalOverride && data) {
          const merged: SiteCustomization = {
            ...DEFAULT_SITE_CUSTOMIZATION,
            ...(data.archiveTitle ? { archiveTitle: data.archiveTitle } : {}),
            ...(data.tagline ? { tagline: data.tagline } : {}),
            ...(data.disclaimer ? { disclaimer: data.disclaimer } : {}),
            ...(data.introHeading ? { introHeading: data.introHeading } : {}),
            ...(data.introBody ? { introBody: data.introBody } : {}),
            ...(data.customization || {}),
          };
          setCustomization(merged);
        }
      } catch {}
    };
    syncFromServer();
    return () => {
      active = false;
    };
  }, []);

  // Apply live CSS variables and document title whenever customization changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--crt-bg', customization.backgroundColor);
    root.style.setProperty('--crt-window-bg', customization.panelColor);
    root.style.setProperty('--crt-phosphor', customization.accentColor);
    root.style.setProperty(
      '--docket-body-font',
      FONT_STYLE_MAP[customization.fontStyle]?.css || FONT_STYLE_MAP.tech.css
    );

    if (customization.archiveTitle?.trim()) {
      document.title = `${customization.archiveTitle.trim()} — Digital Investigative Case Archive`;
    }

    try {
      localStorage.setItem(SITE_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(customization));
      localStorage.setItem(
        'docket_skip_boot_permanent',
        customization.skipBootScreen ? 'true' : 'false'
      );
    } catch {}
  }, [customization]);

  const saveToServer = useCallback(
    async (nextState?: SiteCustomization): Promise<boolean> => {
      const target = nextState || customization;
      setIsSaving(true);
      try {
        const res = await fetch('/api/settings/customize', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            archiveTitle: target.archiveTitle,
            tagline: target.tagline,
            disclaimer: target.disclaimer,
            introHeading: target.introHeading,
            introBody: target.introBody,
            customization: target,
          }),
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [customization]
  );

  const updateCustomization = useCallback((patch: Partial<SiteCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyThemePreset = useCallback((preset: SiteThemePreset) => {
    const p = THEME_PRESETS[preset];
    if (!p) return;
    setCustomization((prev) => ({
      ...prev,
      themePreset: preset,
      backgroundColor: p.backgroundColor,
      panelColor: p.panelColor,
      accentColor: p.accentColor,
    }));
  }, []);

  const resetCustomization = useCallback(() => {
    setCustomization(DEFAULT_SITE_CUSTOMIZATION);
    try {
      localStorage.removeItem(SITE_CUSTOMIZATION_STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <SiteCustomizationContext.Provider
      value={{
        customization,
        updateCustomization,
        applyThemePreset,
        resetCustomization,
        saveToServer,
        isSaving,
      }}
    >
      {children}
    </SiteCustomizationContext.Provider>
  );
};

export const useSiteCustomization = (): SiteCustomizationContextType => {
  const ctx = useContext(SiteCustomizationContext);
  if (!ctx) {
    throw new Error('useSiteCustomization must be used within SiteCustomizationProvider');
  }
  return ctx;
};
