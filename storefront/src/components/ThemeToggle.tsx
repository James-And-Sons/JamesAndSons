'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const OPTIONS = [
  { value: 'system', label: 'System Default', icon: '⊙' },
  { value: 'light',  label: 'Light',          icon: '☀' },
  { value: 'dark',   label: 'Dark',            icon: '☽' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
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
      position: 'relative'
    }}>
      {OPTIONS.map(opt => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
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
            <span style={{ fontSize: '14px', opacity: isActive ? 1 : 0.6 }}>
              {opt.value === 'light' ? <i className="ti ti-sun"></i> : opt.value === 'dark' ? <i className="ti ti-moon"></i> : <i className="ti ti-device-laptop"></i>}
            </span>
            {opt.label.split(' ')[0]}
          </button>
        );
      })}
    </div>
  );
}
