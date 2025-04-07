import React, { createContext, useContext, useState, useEffect } from 'react';
import { UrlKeywordPair } from '../types';
import { supabase } from '../lib/supabase';

interface SharedDataContextType {
    data: UrlKeywordPair[];
    isLoading: boolean;
    error: string | null;
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

export const SharedDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<UrlKeywordPair[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: pairs, error } = await supabase
                    .from('url_keyword_pairs')
                    .select(`
            *,
            ranking_history (
              month,
              position
            )
          `)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const transformedPairs = (pairs || []).map(pair => ({
                    id: pair.id,
                    url: pair.url,
                    keyword: pair.keyword,
                    monthlySearchVolume: typeof pair.monthly_search_volume === 'number' ? pair.monthly_search_volume : undefined,
                    currentRanking: pair.current_ranking || null,
                    note: pair.note || undefined,
                    status: pair.status as 'Testing' | 'Needs Improvement' | '' || undefined,
                    lastUpdated: pair.last_updated || undefined,
                    rankingHistory: (pair.ranking_history as any[] || []).map(h => ({
                        month: h.month,
                        position: h.position
                    })) || []
                }));

                setData(transformedPairs);
                setError(null);
            } catch (error) {
                console.error('Error loading shared data:', error);
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load data. Please try again.'
                );
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    return (
        <SharedDataContext.Provider value={{ data, isLoading, error }}>
            {children}
        </SharedDataContext.Provider>
    );
};

export const useSharedData = () => {
    const context = useContext(SharedDataContext);
    if (context === undefined) {
        throw new Error('useSharedData must be used within a SharedDataProvider');
    }
    return context;
}; 