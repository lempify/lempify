const THEME_KEY = 'lempify-theme';

export type Theme = 'light' | 'dark' | 'system';

export function getSystemTheme(): 'light' | 'dark' {
  return window?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getSavedTheme(): Theme {
  return localStorage.getItem(THEME_KEY) as Theme || 'system';
}

export function applyTheme(theme: Theme = 'system') {
  const root = document.documentElement;

  if (theme === 'system') {
    theme = getSystemTheme();
    return;
  }

  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  // Optional: custom attr or variable
  root.setAttribute('data-theme', theme);
}

export function toggleTheme() {
  const current = getSavedTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

class ThemeManager {
  private static readonly THEME_KEY = 'lempify-theme';
  theme: Theme;

  constructor() {
    this.theme = getSavedTheme();
    this.eventListener();
    this.applyTheme();
  }

  eventListener() {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.onchange = (e) => {
      this.theme = e.matches ? 'dark' : 'light';
      setTheme(this.theme);
    };
  }

  applyTheme() {
    // applyTheme(this.theme);
  }

  static getSystemTheme(): 'light' | 'dark' {
    return window?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}