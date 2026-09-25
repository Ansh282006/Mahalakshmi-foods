import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const current =
    LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('mahalaxmi_lang', code);
    document.documentElement.lang = code;
    setOpen(false);
  };

  return (
    <div className="lang-dropdown" ref={wrapperRef}>
      {/* Trigger button */}
      <button
        className={`lang-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
      >
        <span className="lang-flag">{current.flag}</span>
        <span className="lang-current">{current.native}</span>
        <span className={`lang-caret ${open ? 'up' : ''}`}>▾</span>
      </button>

      {/* Dropdown menu */}
      <div className={`lang-menu ${open ? 'open' : ''}`}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            className={`lang-item ${i18n.language === lang.code ? 'active' : ''}`}
            onClick={() => handleChange(lang.code)}
          >
            <span className="lang-item-flag">{lang.flag}</span>
            <span className="lang-item-labels">
              <span className="lang-item-native">{lang.native}</span>
              <span className="lang-item-english">{lang.label}</span>
            </span>
            {i18n.language === lang.code && (
              <span className="lang-item-check">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}