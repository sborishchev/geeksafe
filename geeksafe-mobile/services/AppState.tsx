import React, { createContext, useState, useContext } from 'react';

// 1. Define what our "Brain" remembers
type AppState = {
    substance: 'alcohol' | 'cannabis' | 'both';
    setSubstance: (s: 'alcohol' | 'cannabis' | 'both') => void;
    activeTab: 'safety' | 'medication'; // 🆕 Track the tab
    setActiveTab: (tab: 'safety' | 'medication') => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
};

const AppContext = createContext<AppState | undefined>(undefined);

// 2. The Provider (The Wrapper for your App)
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [substance, setSubstance] = useState<'alcohol' | 'cannabis' | 'both'>('alcohol');
    const [activeTab, setActiveTab] = useState<'safety' | 'medication'>('safety');
    const [isLoading, setIsLoading] = useState(false);

    return (
        <AppContext.Provider value={{
            substance, setSubstance,
            activeTab, setActiveTab,
            isLoading, setIsLoading
        }}>
            {children}
        </AppContext.Provider>
    );
};

// 3. The Hook (How your screens "Talk" to the brain)
export const useAppState = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppState must be used within AppProvider');
    return context;
};