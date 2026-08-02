'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const OPTIONS = [
  { value: 'system', icon: 'ti-device-laptop', label: 'System' },
  { value: 'light',  icon: 'ti-sun',           label: 'Light'  },
  { value: 'dark',   icon: 'ti-moon',           label: 'Dark'   },
];

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div style={{ 
      display: 'flex', 
      background: 'var(--surface2)', 
      border: '0.5px solid var(--border)', 
      borderRadius: '12px', 
      padding: '4px',
      gap: '2px',
      flexShrink: 0,
    }}>
      {OPTIONS.map(opt => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? '0' : '6px',
              padding: compact ? '8px 10px' : '8px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: isActive ? 'var(--gold)' : 'transparent',
              color: isActive ? '#0A0905' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              fontWeight: isActive ? 600 : 400,
            }}
          >
            <i className={`ti ${opt.icon}`} style={{ fontSize: '16px', opacity: isActive ? 1 : 0.6 }} />
            {!compact && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
