import { useState, useEffect } from 'react';

export function useThemeSync() {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
    return (typeof window !== 'undefined'
      ? (localStorage.getItem('trustlink_theme') as 'dark' | 'light')
      : null) || 'dark';
  });

  useEffect(() => {
    const syncTheme = () => {
      const theme = (localStorage.getItem('trustlink_theme') as 'dark' | 'light') || 'dark';
      setCurrentTheme(theme);
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  return currentTheme;
}
