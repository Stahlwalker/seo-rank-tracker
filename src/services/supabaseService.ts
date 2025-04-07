import { supabase, testConnection } from '../lib/supabase';
import { UrlKeywordPair, RankingData } from '../types';
import { Database } from '../types/supabase';

// Convert from app model to database model
const toDbUrlKeywordPair = (pair: Partial<UrlKeywordPair>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rankingHistory, ...rest } = pair;
  return {
    url: rest.url,
    keyword: rest.keyword,
    monthly_search_volume: typeof rest.monthlySearchVolume === 'number' ? rest.monthlySearchVolume : null,
    current_ranking: rest.currentRanking,
    note: rest.note || null,
    status: rest.status || null,
    last_updated: rest.lastUpdated || new Date().toISOString()
  };
};

// Convert from database model to app model
const fromDbUrlKeywordPair = (dbPair: Database['public']['Tables']['url_keyword_pairs']['Row'], rankingHistory: RankingData[] = []): UrlKeywordPair => {
  return {
    id: dbPair.id,
    url: dbPair.url,
    keyword: dbPair.keyword,
    monthlySearchVolume: typeof dbPair.monthly_search_volume === 'number' ? dbPair.monthly_search_volume : undefined,
    currentRanking: dbPair.current_ranking,
    rankingHistory,
    note: dbPair.note || undefined,
    status: dbPair.status as 'Testing' | 'Needs Improvement' | '' || undefined,
    lastUpdated: dbPair.last_updated || undefined
  };
};

// Ensure database connection before operations
const ensureConnection = async () => {
  try {
    await testConnection();
  } catch (error) {
    // Add more context to the error
    throw new Error(
      `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Please check your Supabase configuration and ensure you are connected to the internet.'
    );
  }
};

// Get all URL/keyword pairs
export const getAllUrlKeywordPairs = async (): Promise<UrlKeywordPair[]> => {
  try {
    await ensureConnection();

    // Get all URL/keyword pairs
    const { data: pairs, error: pairsError } = await supabase
      .from('url_keyword_pairs')
      .select('*')
      .order('created_at', { ascending: false });

    if (pairsError) {
      throw new Error(`Failed to fetch URL/keyword pairs: ${pairsError.message}`);
    }

    if (!pairs) {
      return [];
    }

    // Get all ranking history
    const { data: history, error: historyError } = await supabase
      .from('ranking_history')
      .select('*')
      .order('month', { ascending: true });

    if (historyError) {
      throw new Error(`Failed to fetch ranking history: ${historyError.message}`);
    }

    // Map the data to our app model
    return pairs.map(pair => {
      const pairHistory = history
        ? history
          .filter(h => h.url_keyword_id === pair.id)
          .map(h => ({ month: h.month, position: h.position }))
        : [];

      return fromDbUrlKeywordPair(pair, pairHistory);
    });
  } catch (error) {
    console.error('Error fetching URL/keyword pairs:', error);
    throw error;
  }
};

// Add a new URL/keyword pair
export const addUrlKeywordPair = async (pair: Partial<UrlKeywordPair>): Promise<UrlKeywordPair | null> => {
  try {
    await ensureConnection();

    const dbPair = toDbUrlKeywordPair(pair);

    // Check if the URL/keyword pair already exists
    const { data: existingPairs, error: checkError } = await supabase
      .from('url_keyword_pairs')
      .select('*')
      .eq('url', dbPair.url)
      .eq('keyword', dbPair.keyword);

    if (checkError) {
      throw new Error(`Failed to check for existing URL/keyword pair: ${checkError.message}`);
    }

    let finalPair: Database['public']['Tables']['url_keyword_pairs']['Row'];

    // If we found existing pairs with the same URL and keyword
    if (existingPairs && existingPairs.length > 0) {
      // If there are duplicates, keep only the most recent one and delete others
      if (existingPairs.length > 1) {
        // Sort by created_at in descending order
        const sortedPairs = existingPairs.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Keep the most recent one
        finalPair = sortedPairs[0];

        // Delete all others
        const idsToDelete = sortedPairs.slice(1).map(p => p.id);
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('url_keyword_pairs')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) {
            console.error('Error cleaning up duplicate entries:', deleteError);
          }
        }
      } else {
        // If there's exactly one existing pair
        finalPair = existingPairs[0];
      }
    } else {
      // If no existing pair was found, insert the new one
      const { data, error } = await supabase
        .from('url_keyword_pairs')
        .insert(dbPair)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add URL/keyword pair: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      finalPair = data;
    }

    // Insert or update ranking history if any
    if (pair.rankingHistory && pair.rankingHistory.length > 0) {
      const historyRecords = pair.rankingHistory.map(h => ({
        url_keyword_id: finalPair.id,
        month: h.month,
        position: h.position
      }));

      const { error: historyError } = await supabase
        .from('ranking_history')
        .upsert(historyRecords, {
          onConflict: 'url_keyword_id,month'
        });

      if (historyError) {
        throw new Error(`Failed to add ranking history: ${historyError.message}`);
      }
    }

    // Get the current ranking history
    const { data: history, error: historyError } = await supabase
      .from('ranking_history')
      .select('*')
      .eq('url_keyword_id', finalPair.id)
      .order('month', { ascending: true });

    if (historyError) {
      console.warn('Failed to fetch ranking history:', historyError);
    }

    // Convert the history to the app format
    const rankingHistory = history
      ? history.map(h => ({ month: h.month, position: h.position }))
      : pair.rankingHistory || [];

    return fromDbUrlKeywordPair(finalPair, rankingHistory);
  } catch (error) {
    console.error('Error adding URL/keyword pair:', error);
    throw error;
  }
};

// Update an existing URL/keyword pair
export const updateUrlKeywordPair = async (pair: UrlKeywordPair): Promise<UrlKeywordPair | null> => {
  try {
    await ensureConnection();

    const dbPair = {
      ...toDbUrlKeywordPair(pair),
      id: pair.id
    };

    const { data, error } = await supabase
      .from('url_keyword_pairs')
      .update(dbPair)
      .eq('id', pair.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update URL/keyword pair: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from update operation');
    }

    return fromDbUrlKeywordPair(data, pair.rankingHistory || []);
  } catch (error) {
    console.error('Error updating URL/keyword pair:', error);
    throw error;
  }
};

// Delete a URL/keyword pair
export const deleteUrlKeywordPair = async (id: string): Promise<boolean> => {
  try {
    await ensureConnection();

    const { error } = await supabase
      .from('url_keyword_pairs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete URL/keyword pair: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting URL/keyword pair:', error);
    throw error;
  }
};

// Add a new ranking history entry
export const addRankingHistory = async (urlKeywordId: string, month: string, position: number): Promise<boolean> => {
  try {
    await ensureConnection();

    const { error } = await supabase
      .from('ranking_history')
      .upsert({
        url_keyword_id: urlKeywordId,
        month,
        position
      }, {
        onConflict: 'url_keyword_id,month'
      });

    if (error) {
      throw new Error(`Failed to add ranking history: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error adding ranking history:', error);
    throw error;
  }
};

// Bulk add ranking history entries (for monthly updates)
export const bulkAddRankingHistory = async (entries: { urlKeywordId: string, month: string, position: number }[]): Promise<boolean> => {
  try {
    await ensureConnection();

    // Deduplicate entries by url_keyword_id and month, keeping the latest position
    const deduplicatedEntries = entries.reduce((acc, entry) => {
      const key = `${entry.urlKeywordId}-${entry.month}`;
      acc[key] = entry;
      return acc;
    }, {} as Record<string, typeof entries[0]>);

    const historyRecords = Object.values(deduplicatedEntries).map(entry => ({
      url_keyword_id: entry.urlKeywordId,
      month: entry.month,
      position: entry.position
    }));

    const { error } = await supabase
      .from('ranking_history')
      .upsert(historyRecords, {
        onConflict: 'url_keyword_id,month'
      });

    if (error) {
      throw new Error(`Failed to bulk add ranking history: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error bulk adding ranking history:', error);
    throw error;
  }
};

export async function createSharedViewToken(data: UrlKeywordPair[]) {
  try {
    console.log('Creating shared view with data:', data);

    // Check authentication state
    const storedAuth = localStorage.getItem('auth');
    const { data: { session } } = await supabase.auth.getSession();

    // In production, we need a valid Supabase session
    if (import.meta.env.PROD) {
      if (!session) {
        console.error('No Supabase session in production');
        throw new Error('Please log in to create a shared view.');
      }
    } else {
      // In development, check localStorage
      if (!storedAuth) {
        console.error('No authentication found in localStorage');
        throw new Error('Please log in to create a shared view.');
      }

      const { isAuthenticated } = JSON.parse(storedAuth);
      if (!isAuthenticated) {
        console.error('User is not authenticated');
        throw new Error('Please log in to create a shared view.');
      }
    }

    // First, check if the table exists
    const { error: tableCheckError } = await supabase
      .from('shared_views')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      console.error('Table check error:', tableCheckError);
      if (tableCheckError.code === '42P01') { // Table doesn't exist
        throw new Error('The shared_views table does not exist. Please create it in your Supabase database.');
      }
      throw tableCheckError;
    }

    // Log the data being inserted
    const insertData = {
      data: data,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };
    console.log('Attempting to insert data:', insertData);

    const { data: sharedView, error } = await supabase
      .from('shared_views')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating shared view:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      if (error.code === '42501') { // Permission denied
        throw new Error('Permission denied. Please check your RLS policies.');
      }
      throw error;
    }

    if (!sharedView) {
      console.error('No shared view returned after insert');
      throw new Error('Failed to create shared view: No data returned');
    }

    console.log('Created shared view:', sharedView);
    return sharedView.id;
  } catch (error) {
    console.error('Error creating shared view token:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create share link: ${error.message}`);
    }
    throw new Error('Failed to create share link. Please try again.');
  }
}

export async function getSharedViewData(token: string) {
  try {
    // Check authentication state
    const storedAuth = localStorage.getItem('auth');
    const { data: { session } } = await supabase.auth.getSession();

    // In production, we need a valid Supabase session
    if (import.meta.env.PROD) {
      if (!session) {
        console.error('No Supabase session in production');
        throw new Error('Please log in to view shared data.');
      }
    } else {
      // In development, check localStorage
      if (!storedAuth) {
        console.error('No authentication found in localStorage');
        throw new Error('Please log in to view shared data.');
      }

      const { isAuthenticated } = JSON.parse(storedAuth);
      if (!isAuthenticated) {
        console.error('User is not authenticated');
        throw new Error('Please log in to view shared data.');
      }
    }

    const { data: sharedView, error } = await supabase
      .from('shared_views')
      .select('*')
      .eq('id', token)
      .single();

    if (error) throw error;
    if (!sharedView) return null;
    if (new Date(sharedView.expires_at) < new Date()) return null;

    return sharedView.data;
  } catch (error) {
    console.error('Error getting shared view data:', error);
    throw error;
  }
}