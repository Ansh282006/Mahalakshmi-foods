import useDarkMode from '../hooks/useDarkMode';

export default function DarkModeToggle() {
  const { dark, toggleDark } = useDarkMode();

  return (
    <button
      className="dark-mode-toggle"
      onClick={toggleDark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <span className="dark-toggle-label">{dark ? 'Light Mode' : 'Dark Mode'}</span>
      <span className={`dark-toggle-switch ${dark ? 'on' : ''}`}>
        <span className="dark-toggle-knob"></span>
      </span>
    </button>
  );
}
