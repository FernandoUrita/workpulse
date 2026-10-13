import { createContext, useContext, useEffect, useState } from 'react';

<<<<<<< HEAD
import { normalizeTheme, nextTheme } from '../utils/themes.js';

=======
>>>>>>> cfe308f0e4c7181f662947f40efa60a124262d45
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
<<<<<<< HEAD
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
=======
    return localStorage.getItem('workpulse_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('workpulse_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
>>>>>>> cfe308f0e4c7181f662947f40efa60a124262d45
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
