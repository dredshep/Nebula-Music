import React from 'react';

type CardElevation = 1 | 2 | 3 | 4;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    elevation?: CardElevation;
    hover?: boolean;
    glow?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

const elevationClasses: Record<CardElevation, string> = {
    1: `
    bg-white/80 backdrop-blur-md
    border border-neutral-200
    dark:bg-neutral-900/40 dark:border-white/5
    shadow-[0_2px_8px_rgba(0,0,0,0.1)]
  `,
    2: `
    bg-white/85 backdrop-blur-lg
    border border-neutral-200/80
    dark:bg-neutral-900/60 dark:border-white/8
    shadow-[0_4px_16px_rgba(0,0,0,0.15)]
  `,
    3: `
    bg-white/90 backdrop-blur-xl
    border border-neutral-200/70
    dark:bg-neutral-900/75 dark:border-white/10
    shadow-[0_8px_32px_rgba(0,0,0,0.25)]
  `,
    4: `
    bg-white/95 backdrop-blur-2xl
    border border-neutral-200/60
    dark:bg-neutral-900/85 dark:border-white/12
    shadow-[0_16px_48px_rgba(0,0,0,0.35)]
  `,
};

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
    elevation = 1,
    hover = true,
    glow = false,
    padding = 'md',
    children,
    className = '',
    ...props
}) => {
    return (
        <div
            className={`
        rounded-2xl
        transition-all duration-300 ease-out
        ${elevationClasses[elevation]}
        ${paddingClasses[padding]}
        ${hover ? 'hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] dark:hover:border-white/15 dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]' : ''}
        ${glow ? 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]' : ''}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
