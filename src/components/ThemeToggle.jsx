import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={
        'w-9 h-9 rounded-lg flex items-center justify-center text-lg transition ' +
        (isDark
          ? 'bg-slate-700 hover:bg-slate-600 text-amber-300'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-700') +
        ' ' + className
      }
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
