'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createStorage } from '../utils/storage';

type Theme = 'light' | 'dark' | 'system';

const themeStorage = createStorage<Theme>({
  key: 'theme',
  defaultValue: 'system',
});

interface DarkModeContextValue {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  valueByTheme: (
    light: string | string[],
    dark: string | string[]
  ) => string | string[];
}

const DarkModeContext = createContext<DarkModeContextValue | undefined>(
  undefined
);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
}

function applyHtmlClass(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  if (resolved === 'dark') {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
}

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return themeStorage.get();
  });

  const [isDark, setIsDark] = useState(() => {
    const initial =
      theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark');
    return initial;
  });

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setIsDark(resolved === 'dark');
    applyHtmlClass(theme);
    themeStorage.set(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      setIsDark(event.matches);
      applyHtmlClass('system');
    };

    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  const setThemeHandler = (newTheme: Theme) => setThemeState(newTheme);
  const toggleTheme = () =>
    setThemeState(prev =>
      prev === 'dark'
        ? 'light'
        : prev === 'light'
          ? 'dark'
          : getSystemTheme() === 'dark'
            ? 'light'
            : 'dark'
    );

  const valueByTheme = (light: string | string[], dark: string | string[]) =>
    isDark ? dark : light;

  return (
    <DarkModeContext.Provider
      value={{ theme, valueByTheme, isDark, setTheme: setThemeHandler, toggleTheme }}
    >
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context)
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  return context;
}
