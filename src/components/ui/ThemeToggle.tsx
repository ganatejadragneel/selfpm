import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
    }}>
      <Sun 
        className="w-4 h-4" 
        style={{ 
          color: isDark ? '#6b7280' : '#f59e0b',
          transition: 'color 0.3s ease'
        }} 
      />
      
      {/* iOS Style Switch */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        style={{
          position: 'relative',
          width: '48px',
          height: '28px',
          background: isDark 
            ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' 
            : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
          borderRadius: '999px',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          transition: 'background 0.3s ease',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: isDark ? '22px' : '2px',
            width: '24px',
            height: '24px',
            background: 'white',
            borderRadius: '50%',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isDark ? (
            <Moon className="w-3 h-3" style={{ color: '#7c3aed' }} />
          ) : (
            <Sun className="w-3 h-3" style={{ color: '#f59e0b' }} />
          )}
        </div>
      </button>
      
      <Moon 
        className="w-4 h-4" 
        style={{ 
          color: isDark ? '#a855f7' : '#9ca3af',
          transition: 'color 0.3s ease'
        }} 
      />
    </div>
  );
};