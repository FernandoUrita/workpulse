import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeToggle({ className = 'icon-btn' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = `Switch to ${isDark ? 'light' : 'dark'} mode`;

  return (
    <button type="button" className={`${className} theme-switch`} onClick={toggleTheme} aria-label={label} title={label}>
      <svg key={theme} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {isDark ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></> : <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />}
      </svg>
    </button>
  );
}
