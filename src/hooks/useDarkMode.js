import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mahalaxmi_dark_mode';

export default function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === '1';
    // Fall back to OS preference on first visit
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
  });

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark-mode');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.style.colorScheme = 'light';
    }
    localStorage.setItem(STORAGE_KEY, dark ? '1' : '0');
  }, [dark]);

  return { dark, toggleDark: () => setDark((v) => !v) };
}
