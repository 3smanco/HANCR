'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'dark' | 'light';
const STORAGE_KEY = 'hancr_admin_theme';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'dark',
  setTheme: () => {},
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function applyTheme(t: Theme) {
  const el = document.documentElement;
  if (t === 'light') el.classList.add('light');
  else el.classList.remove('light');
}

/**
 * ThemeProvider — ثيم ثنائي (داكن افتراضي + فاتح) للوحة command-center.
 * يبدّل صنف `light` على <html> ويحفظ الاختيار. الطبقة الجديدة تستهلك
 * متغيّرات cmd-* فتعمل في الوضعين.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || 'dark';
    applyTheme(saved);
    setThemeState(saved);
  }, []);

  const setTheme = (t: Theme) => {
    applyTheme(t);
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  };

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
