/**
 * Theme exports - Separate file for constants to avoid fast refresh issues
 */

export type Theme = 'light' | 'dark';

export const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

export const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark-mode');
    root.style.setProperty('--bg-primary', '#1a1a1a');
    root.style.setProperty('--bg-secondary', '#2d2d2d');
    root.style.setProperty('--text-primary', '#ffffff');
    root.style.setProperty('--text-secondary', '#b3b3b3');
    root.style.setProperty('--border-color', '#404040');
  } else {
    root.classList.remove('dark-mode');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8f9fa');
    root.style.setProperty('--text-primary', '#212529');
    root.style.setProperty('--text-secondary', '#6c757d');
    root.style.setProperty('--border-color', '#dee2e6');
  }
  
  localStorage.setItem('theme', theme);
};