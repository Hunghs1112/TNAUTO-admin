import { memo } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`app-toggle-button ${className}`.trim()}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
    >
      {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
    </button>
  );
}

export default memo(ThemeToggle);
