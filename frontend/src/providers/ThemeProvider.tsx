/**
 * ThemeProvider.tsx
 * Owns ONLY theme state and persistence.
 * DOM class synchronization (document.body / documentElement) is route-aware
 * and handled in App.tsx so public pages never inherit the dashboard theme.
 * Must NEVER access Supabase, manage authentication, or perform routing.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: 'dark' | 'light';
}

// ThemeProvider owns ONLY theme state + persistence.
// DOM class synchronization (document.body / documentElement) is handled
// route-aware by App.tsx so public pages never inherit the dashboard theme.
export const ThemeProvider = ({ children, initialTheme }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (initialTheme) return initialTheme;
    return (typeof window !== 'undefined' && (localStorage.getItem('trustlink_theme') as 'dark' | 'light')) || 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('trustlink_theme', next);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};