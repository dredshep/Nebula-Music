import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
    // Backgrounds
    bg: string;
    bgSecondary: string;
    bgTertiary: string;

    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;

    // Borders
    border: string;
    borderHover: string;

    // Interactive elements
    hover: string;
    active: string;

    // States
    muted: string;
}

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
    colors: ThemeColors;
}

const lightColors: ThemeColors = {
    bg: '#e8e8e8',
    bgSecondary: '#d4d4d4',
    bgTertiary: '#c0c0c0',
    text: '#0a0a0a',
    textSecondary: '#404040',
    textTertiary: '#737373',
    border: '#b0b0b0',
    borderHover: '#909090',
    hover: '#d0d0d0',
    active: '#b8b8b8',
    muted: '#888888'
};

const darkColors: ThemeColors = {
    bg: '#0a0a0a',
    bgSecondary: '#171717',
    bgTertiary: '#262626',
    text: '#fafafa',
    textSecondary: '#a3a3a3',
    textTertiary: '#525252',
    border: '#404040',
    borderHover: '#525252',
    hover: '#262626',
    active: '#404040',
    muted: '#525252'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('nebula_theme_mode') as ThemeMode | null;
        if (saved === 'light' || saved === 'dark') return saved;
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        localStorage.setItem('nebula_theme_mode', mode);

        // Update document class for Tailwind dark mode
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        document.documentElement.setAttribute('data-theme', mode);

        // Update CSS custom properties for dynamic colors
        const colors = mode === 'light' ? lightColors : darkColors;
        Object.entries(colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--theme-${key}`, value);
        });
    }, [mode]);

    const toggleTheme = () => {
        setMode(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const setTheme = (newMode: ThemeMode) => {
        setMode(newMode);
    };

    const colors = mode === 'light' ? lightColors : darkColors;

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, setTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
