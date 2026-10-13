import { createContext, useContext, useEffect, useState } from 'react';

import { normalizeTheme, nextTheme } from '../utils/themes.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return normalizeTheme(localStorage.getItem('workpulse_theme')); } catch { return 'light'; }
  });

  useEffect(() => {
    if (theme !== 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem('workpulse_theme', theme); } catch { /* Theme still applies in this session. */ }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => nextTheme(prev));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: value => setTheme(normalizeTheme(value)), toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
