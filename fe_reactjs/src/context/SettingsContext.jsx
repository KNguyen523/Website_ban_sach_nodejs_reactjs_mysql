import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

const SettingsContext = createContext({
    settings: {},
    loading: true,
    refreshSettings: () => {}
});

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await api.get('/public/settings');
            if (res.data.success) {
                setSettings(res.data.data || {});
            }
        } catch (err) {
            console.error('Error loading site settings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        const title = settings.site_title || settings.site_name;
        if (title) {
            document.title = title;
        }
    }, [settings.site_title, settings.site_name]);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
