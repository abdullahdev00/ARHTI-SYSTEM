import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
    const [isLoading, setIsLoading] = useState(true);

    // Load theme preference from storage on mount
    useEffect(() => {
        const loadThemePreference = async () => {
            try {
                const saved = await AsyncStorage.getItem('themeMode');
                if (saved) {
                    setThemeModeState(saved as ThemeMode);
                }
            } catch (error) {
                console.error('Error loading theme preference:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadThemePreference();
    }, []);

    // Determine if dark mode is active
    const isDark =
        themeMode === 'auto'
            ? systemColorScheme === 'dark'
            : themeMode === 'dark';

    // Save theme preference to storage
    const setThemeMode = async (mode: ThemeMode) => {
        try {
            setThemeModeState(mode);
            await AsyncStorage.setItem('themeMode', mode);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    if (isLoading) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
