import React from 'react';
import { LIQUID_GLASS_TOKENS } from '../../theme/liquidGlassTokens';

/**
 * B3. Static Backdrop Component
 * Rendered once behind all content; never animated.
 */
export const GlassBackdrop: React.FC = () => {
  return <div className="liquid-glass-backdrop" aria-hidden="true" />;
};

/**
 * B4. Glass Surface Component
 * Implements the exact Liquid Glass recipe:
 * 135deg gradient fill, 1dp border, 1.5dp top inner highlight, specular radial overlay,
 * and elevation shadow.
 */
interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 'card' | 'floating' | 'dialog' | 'capsule';
  className?: string;
  isInteractive?: boolean;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  variant = 'card',
  className = '',
  isInteractive = false,
  ...props
}) => {
  let baseClass = 'glass-surface rounded-[28px]';
  if (variant === 'floating') {
    baseClass = 'glass-surface-floating rounded-[9999px]';
  } else if (variant === 'dialog') {
    baseClass = 'glass-surface-dialog rounded-[32px]';
  } else if (variant === 'capsule') {
    baseClass = 'glass-surface rounded-[9999px]';
  }

  const interactiveClass = isInteractive ? 'glass-pressable' : '';

  return (
    <div className={`${baseClass} ${interactiveClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * B9. Primary & Secondary Buttons
 */
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  if (variant === 'primary') {
    return (
      <button className={`glass-btn-primary glass-pressable ${className}`} {...props}>
        {children}
      </button>
    );
  }

  return (
    <button
      className={`h-[56px] px-6 rounded-[9999px] glass-surface glass-pressable inline-flex items-center justify-center gap-2 font-bold text-base text-[var(--lg-ink)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * B9. Icon Button (46px or 54px circle with >=48px touch target)
 */
interface GlassIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'normal' | 'important';
  children: React.ReactNode;
  className?: string;
  label: string; // Accessibility requirement: text label for screen readers
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  size = 'normal',
  children,
  className = '',
  label,
  ...props
}) => {
  const dimensionClass = size === 'important' ? 'h-[54px] w-[54px]' : 'h-[46px] w-[46px] min-w-[48px] min-h-[48px]';

  return (
    <button
      aria-label={label}
      title={label}
      className={`${dimensionClass} rounded-full glass-surface glass-pressable flex items-center justify-center text-[var(--lg-ink)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * B9. Chip Component (48px capsule)
 */
interface GlassChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  count?: number;
}

export const GlassChip: React.FC<GlassChipProps> = ({
  label,
  selected = false,
  onClick,
  count,
}) => {
  if (selected) {
    return (
      <button
        onClick={onClick}
        className="h-[48px] px-6 rounded-[9999px] bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] text-[var(--lg-on-accent)] font-bold text-sm shadow-[0_8px_8px_rgba(79,91,213,0.35)] border border-white/50 glass-pressable inline-flex items-center gap-2 shrink-0 transition-transform"
      >
        <span>{label}</span>
        {count !== undefined && (
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">{count}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="h-[48px] px-6 rounded-[9999px] glass-surface glass-pressable text-[var(--lg-ink-muted)] hover:text-[var(--lg-ink)] font-semibold text-sm inline-flex items-center gap-2 shrink-0 transition-colors"
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="text-xs text-[var(--lg-ink-muted)] opacity-75 font-mono">({count})</span>
      )}
    </button>
  );
};

/**
 * B9. Status / Semantic Tag Pill
 */
interface GlassTagProps {
  variant: 'success' | 'info' | 'neutral' | 'error';
  children: React.ReactNode;
  className?: string;
}

export const GlassTag: React.FC<GlassTagProps> = ({ variant, children, className = '' }) => {
  let styleClasses = 'bg-[var(--lg-neutral-bg)] text-[var(--lg-neutral)]';
  if (variant === 'success') {
    styleClasses = 'bg-[var(--lg-success-bg)] text-[var(--lg-success)]';
  } else if (variant === 'info') {
    styleClasses = 'bg-[var(--lg-info-bg)] text-[var(--lg-info)]';
  } else if (variant === 'error') {
    styleClasses = 'bg-[var(--lg-error-bg)] text-[var(--lg-error)]';
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-[13px] text-xs font-semibold tracking-wide ${styleClasses} ${className}`}
    >
      {children}
    </span>
  );
};

/**
 * B9. Interactive Toggle
 */
interface GlassToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const GlassToggle: React.FC<GlassToggleProps> = ({ checked, onChange, label }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[32px] w-[56px] shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-200 ease-in-out glass-pressable ${
        checked
          ? 'bg-gradient-to-r from-[var(--lg-accent-start)] to-[var(--lg-accent-end)] border border-white/40'
          : 'glass-surface'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-[26px] w-[26px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-[24px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
};
