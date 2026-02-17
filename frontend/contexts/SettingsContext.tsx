
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAPI } from '../api';

interface SettingsContextType {
    settings: Record<string, string>;
    loading: boolean;
    updateSetting: (key: string, value: string) => Promise<void>;
    refreshSettings: () => Promise<void>;
    darkMode: boolean;
    toggleDarkMode: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    const fetchSettings = async () => {
        try {
            const data = await adminAPI.getSettings();
            setSettings(data);

            // Apply primary color if exists
            if (data.PRIMARY_COLOR) {
                document.documentElement.style.setProperty('--color-primary', data.PRIMARY_COLOR);
            }
            // Apply App Name if exists (can be done in title)
            if (data.APP_NAME) {
                document.title = data.APP_NAME;
            }
        } catch (error) {
            // Silently fail if 401 to avoid loops on login page
            console.warn('Failed to load settings (likely not auth):', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if authenticated (admin) - or if endpoint is public?
        // Admin settings likely require auth. 
        // If we are on login page, we might not have token.
        // Let's check if we have a token before fetching, OR make the fetch fail silently.
        const token = localStorage.getItem('token');
        if (token) {
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, []);

    const updateSetting = async (key: string, value: string) => {
        try {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings); // Optimistic update

            await adminAPI.updateSettings({ [key]: value });

            if (key === 'APP_NAME') document.title = value;
            // if (key === 'PRIMARY_COLOR') ... already handled by re-render or explicit set needed?
            // Since specific logic is in fetchSettings, we might want a useEffect on settings change or just apply here
            if (key === 'PRIMARY_COLOR') {
                document.documentElement.style.setProperty('--color-primary', value);
            }

        } catch (error) {
            console.error('Failed to update setting:', error);
            fetchSettings(); // Revert on error
            throw error;
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, updateSetting, refreshSettings: fetchSettings, darkMode, toggleDarkMode }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
