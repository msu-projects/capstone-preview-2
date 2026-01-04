export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'sccdp_theme';

// Theme state using Svelte 5 runes
let theme = $state<Theme>('system');
let resolvedTheme = $state<'light' | 'dark'>('light');

// MediaQueryList for system preference
let mediaQuery: MediaQueryList | null = null;

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  resolvedTheme = resolved;
}

function handleSystemThemeChange(e: MediaQueryListEvent): void {
  if (theme === 'system') {
    applyTheme(e.matches ? 'dark' : 'light');
  }
}

function setTheme(newTheme: Theme): void {
  theme = newTheme;

  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }

  const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
  applyTheme(resolved);
}

function initializeTheme(): void {
  if (typeof window === 'undefined') return;

  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (!savedTheme) {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
  }
  theme = savedTheme || 'light';

  // Set up system theme listener
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', handleSystemThemeChange);

  // Apply the theme
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  applyTheme(resolved);
}

function cleanupTheme(): void {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleSystemThemeChange);
    mediaQuery = null;
  }
}

export const themeStore = {
  get theme() {
    return theme;
  },
  get resolvedTheme() {
    return resolvedTheme;
  },
  setTheme,
  initializeTheme,
  cleanupTheme
};
