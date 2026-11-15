import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, useColorScheme, View } from 'react-native';

import type { ScenarioId, SignalMode } from '@/domain/types';
import { buildPalette, type Palette } from '@/theme/palette';

SplashScreen.preventAutoHideAsync().catch(() => {});

export type TextSize = 'normal' | 'grande' | 'enorme';
export const TEXT_SCALES: Record<TextSize, number> = { normal: 1, grande: 1.2, enorme: 1.4 };

export interface Settings {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  mode: SignalMode;
  scenario: ScenarioId;
}

const DEFAULTS: Settings = {
  textSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  mode: 'adaptive',
  scenario: 'pico-noite',
};

const STORAGE_KEY = 'ondaverde:settings';

interface SettingsValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  colors: Palette;
  scheme: 'light' | 'dark';
  /** Multiplicador de fonte (ajuste do app; o do sistema se soma a ele). */
  scale: number;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && alive) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
      } catch {
        // usa os padrões
      } finally {
        if (alive) {
          setReady(true);
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduceMotion, () => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduceMotion);
    return () => sub.remove();
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const scheme: 'light' | 'dark' = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = useMemo(
    () => buildPalette(scheme, settings.highContrast),
    [scheme, settings.highContrast],
  );

  const value = useMemo<SettingsValue>(
    () => ({
      settings: { ...settings, reduceMotion: settings.reduceMotion || systemReduceMotion },
      update,
      colors,
      scheme,
      scale: TEXT_SCALES[settings.textSize],
    }),
    [settings, systemReduceMotion, update, colors, scheme],
  );

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de <SettingsProvider>');
  return ctx;
}

/** Atalho para quem só precisa de cores e escala de fonte. */
export function useTheme() {
  const { colors, scale, scheme, settings } = useSettings();
  return { colors, scale, scheme, highContrast: settings.highContrast, reduceMotion: settings.reduceMotion };
}
