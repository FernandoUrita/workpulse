export const THEMES = ['light', 'dark', 'pink'];
export const normalizeTheme = value => THEMES.includes(value) ? value : 'light';
export const nextTheme = value => THEMES[(THEMES.indexOf(normalizeTheme(value)) + 1) % THEMES.length];
