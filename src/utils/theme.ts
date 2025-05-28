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
