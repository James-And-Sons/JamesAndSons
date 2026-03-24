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
    <div style={{ display: 'flex', gap: '8px' }}>
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: theme === opt.value ? 'var(--gold)' : 'transparent',
            color: theme === opt.value ? '#1a1010' : 'var(--text-muted)',
            border: `1px solid ${theme === opt.value ? 'var(--gold)' : 'var(--border)'}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: '14px' }}>{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
