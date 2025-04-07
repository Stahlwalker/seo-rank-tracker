import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { UrlKeywordPair } from '../types';
import { getSharedViewData } from '../services/supabaseService';

interface SharedDataContextType {
    data: UrlKeywordPair[];
    isLoading: boolean;
    error: string | null;
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

export function SharedDataProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<UrlKeywordPair[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useParams<{ token: string }>();

    useEffect(() => {
        const loadSharedData = async () => {
            if (!token) {
                setError('No share token provided');
                setIsLoading(false);
                return;
            }

            try {
                const sharedData = await getSharedViewData(token);
                if (!sharedData) {
                    setError('Shared view not found or has expired');
                    return;
                }
                setData(sharedData);
            } catch (err) {
                setError('Failed to load shared data');
                console.error('Error loading shared data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSharedData();
    }, [token]);

    return (
        <SharedDataContext.Provider value={{ data, isLoading, error }}>
            {children}
        </SharedDataContext.Provider>
    );
}

export function useSharedData() {
    const context = useContext(SharedDataContext);
    if (context === undefined) {
        throw new Error('useSharedData must be used within a SharedDataProvider');
    }
    return context;
} 