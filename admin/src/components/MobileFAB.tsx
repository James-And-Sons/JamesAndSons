'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface FABAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
}

interface MobileFABProps {
  /** The primary action (shown as the main FAB button) */
  primaryAction: FABAction;
  /** Optional secondary actions that radiate out when expanded */
  secondaryActions?: FABAction[];
}

/**
 * Mobile Floating Action Button
 * 
 * Positioned above the bottom nav bar using the .mobile-fab CSS class.
 * Only visible on mobile (lg:hidden). For pages with a single CTA,
 * pass only `primaryAction`. For multiple actions, pass `secondaryActions`
 * which will animate in a vertical stack above the main FAB.
 */
export default function MobileFAB({ primaryAction, secondaryActions = [] }: MobileFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSecondary = secondaryActions.length > 0;

  const handlePrimaryClick = () => {
    if (hasSecondary) {
      setIsExpanded(s => !s);
    } else {
      primaryAction.onClick();
    }
  };

  return (
    <div className="mobile-fab lg:hidden flex flex-col items-end gap-3">
      {/* Secondary actions — animate in above the FAB */}
      {hasSecondary && secondaryActions.map((action, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-2 transition-all duration-300 origin-bottom-right ${
            isExpanded
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
          }`}
          style={{ transitionDelay: isExpanded ? `${idx * 50}ms` : '0ms' }}
        >
          {/* Label chip */}
          <span className="bg-surface/95 backdrop-blur-sm border border-border font-mono text-[10px] uppercase tracking-wider text-primary px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            {action.label}
          </span>
          {/* Action button */}
          <button
            onClick={() => {
              action.onClick();
              setIsExpanded(false);
            }}
            className="w-11 h-11 rounded-full bg-surface border border-border shadow-lg flex items-center justify-center text-accent hover:bg-surface-muted transition-colors touch-target"
            aria-label={action.label}
          >
            {action.icon}
          </button>
        </div>
      ))}

      {/* Primary FAB */}
      <button
        onClick={handlePrimaryClick}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 touch-target ${
          isExpanded
            ? 'bg-surface-muted border-2 border-border rotate-45'
            : 'bg-accent hover:bg-accent-hover shadow-accent/30'
        }`}
        aria-label={hasSecondary ? (isExpanded ? 'Close actions' : 'Open actions') : primaryAction.label}
        aria-expanded={hasSecondary ? isExpanded : undefined}
      >
        {hasSecondary ? (
          isExpanded ? <X size={22} className="text-primary" /> : <Plus size={22} className="text-black" />
        ) : (
          primaryAction.icon
        )}
      </button>
    </div>
  );
}
