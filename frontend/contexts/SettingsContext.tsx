
import React, { createContext, useState, useEffect, useContext } from 'react';
import { settingsAPI, adminAPI } from '../api';

interface SettingsContextType {
    settings: any;
    loading: boolean;
    darkMode: boolean;
    updateSetting: (key: string, value: string) => Promise<void>;
    updateSettings: (newValues: Record<string, string>) => Promise<void>;
    refreshSettings: () => Promise<void>;
    toggleDarkMode: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    const fetchSettings = async () => {
        try {
            const data = await settingsAPI.getPublicSettings();
            setSettings(data);
            applySettings(data);
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const applySettings = (data: any) => {
        if (data.APP_NAME) document.title = data.APP_NAME;
        if (data.PRIMARY_COLOR) {
            // Function to convert hex to rgb channels (RRR GGG BBB)
            const hexToRgb = (hex: string) => {
                const r = parseInt(hex.substring(1, 3), 16);
                const g = parseInt(hex.substring(3, 5), 16);
                const b = parseInt(hex.substring(5, 7), 16);
                return `${r} ${g} ${b}`;
            };

            // Set the main primary color variable as RGB channels for Tailwind opacity support
            document.documentElement.style.setProperty('--color-primary', hexToRgb(data.PRIMARY_COLOR));

            // Calculate darker shade for hover
            const darkenColor = (hex: string, percent: number) => {
                let r = parseInt(hex.substring(1, 3), 16);
                let g = parseInt(hex.substring(3, 5), 16);
                let b = parseInt(hex.substring(5, 7), 16);

                r = Math.floor(r * (100 - percent) / 100);
                g = Math.floor(g * (100 - percent) / 100);
                b = Math.floor(b * (100 - percent) / 100);

                r = (r < 255) ? r : 255;
                g = (g < 255) ? g : 255;
                b = (b < 255) ? b : 255;

                const rr = ((r.toString(16).length === 1) ? '0' + r.toString(16) : r.toString(16));
                const gg = ((g.toString(16).length === 1) ? '0' + g.toString(16) : g.toString(16));
                const bb = ((b.toString(16).length === 1) ? '0' + b.toString(16) : b.toString(16));

                return `#${rr}${gg}${bb}`;
            };

            const darkerColor = darkenColor(data.PRIMARY_COLOR, 15); // Darken by 15%
            document.documentElement.style.setProperty('--color-primary-dark', darkerColor);
        }
        if (data.FAVICON_URL) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = data.FAVICON_URL;
        }
    };

    const updateSettings = async (newValues: Record<string, string>) => {
        try {
            const newSettings = { ...settings, ...newValues };
            setSettings(newSettings);
            applySettings(newSettings);
            await adminAPI.updateSettings(newValues);
        } catch (error) {
            console.error('Failed to update settings', error);
            fetchSettings();
            throw error;
        }
    };

    const toggleDarkMode = () => {
        setDarkMode((prev: boolean) => {
            const newValue = !prev;
            localStorage.setItem('darkMode', JSON.stringify(newValue));
            return newValue;
        });
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <SettingsContext.Provider value={{ settings, loading, darkMode, updateSetting: async (k, v) => updateSettings({ [k]: v }), updateSettings, refreshSettings: fetchSettings, toggleDarkMode }}>
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
