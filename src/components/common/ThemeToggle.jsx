import { motion, AnimatePresence } from 'motion/react';
import { nextTheme } from '../../utils/themes.js';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function ThemeToggle({ className = 'icon-btn' }) {
  const { theme, toggleTheme } = useTheme();
  const targetTheme=nextTheme(theme);
  const label = `Current theme: ${theme}. Switch to ${targetTheme} mode`;

  return (
    <motion.button
      type="button"
      className={`${className} theme-switch`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      style={{ position: 'relative' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={theme}
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {targetTheme==='pink' ? (<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>) : targetTheme==='light' ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </>
          ) : (
            <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
          )}
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  );
}
