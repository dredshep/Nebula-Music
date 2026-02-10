import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    glow?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-white/10 text-neutral-300 border-white/10',
    primary: 'bg-primary/20 text-primary border-primary/30',
    secondary: 'bg-secondary/20 text-secondary border-secondary/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const glowClasses: Record<BadgeVariant, string> = {
    default: '',
    primary: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]',
    secondary: 'shadow-[0_0_12px_rgba(139,92,246,0.3)]',
    success: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    warning: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    error: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]',
};

const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
};

export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    size = 'md',
    glow = false,
    icon,
    children,
    className = '',
}) => {
    return (
        <span
            className={`
        inline-flex items-center gap-1.5
        rounded-full border font-bold uppercase tracking-wider
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${glow ? glowClasses[variant] : ''}
        ${className}
      `}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </span>
    );
};

export default Badge;
