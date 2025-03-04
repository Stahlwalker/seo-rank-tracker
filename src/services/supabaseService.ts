import { supabase } from '../lib/supabase';
import { UrlKeywordPair, RankingData } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Convert from app model to database model
const toDbUrlKeywordPair = (pair: UrlKeywordPair) => {
  return {
    id: pair.id,
    url: pair.url,
    keyword: pair.keyword,
    monthly_search_volume: pair.monthlySearchVolume || null,
    current_ranking: pair.currentRanking,
    note: pair.note || null,
    status: pair.status || null,
    last_updated: pair.lastUpdated || null
  };
};

// Convert from database model to app model
const fromDbUrlKeywordPair = (dbPair: any, rankingHistory: RankingData[]): UrlKeywordPair => {
  return {
    id: dbPair.id,
    url: dbPair.url,
    keyword: dbPair.keyword,
    monthlySearchVolume: dbPair.monthly_search_volume || undefined,
    currentRanking: dbPair.current_ranking,
    rankingHistory: rankingHistory,
    note: dbPair.note || undefined,
    status: dbPair.status as 'Testing' | 'Needs Improvement' | '' || undefined,
    lastUpdated: dbPair.last_updated
  };
};

// Get all URL/keyword pairs
export const getAllUrlKeywordPairs = async (): Promise<UrlKeywordPair[]> => {
  // Get all URL/keyword pairs
  const { data: pairs, error } = await supabase
    .from('url_keyword_pairs')
    .select('*');

  if (error) {
    console.error('Error fetching URL/keyword pairs:', error);
    return [];
  }

  // Get all ranking history
  const { data: history, error: historyError } = await supabase
    .from('ranking_history')
    .select('*');

  if (historyError) {
    console.error('Error fetching ranking history:', historyError);
    return [];
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
};

// Add a new URL/keyword pair
export const addUrlKeywordPair = async (pair: UrlKeywordPair): Promise<UrlKeywordPair | null> => {
  // Insert the URL/keyword pair
  const { data, error } = await supabase
    .from('url_keyword_pairs')
    .insert(toDbUrlKeywordPair(pair))
    .select()
    .single();

  if (error) {
    console.error('Error adding URL/keyword pair:', error);
    return null;
  }

  // Insert ranking history if any
  if (pair.rankingHistory && pair.rankingHistory.length > 0) {
    const historyRecords = pair.rankingHistory.map(h => ({
      id: uuidv4(),
      url_keyword_id: data.id,
      month: h.month,
      position: h.position
    }));

    const { error: historyError } = await supabase
      .from('ranking_history')
      .insert(historyRecords);

    if (historyError) {
      console.error('Error adding ranking history:', historyError);
    }
  }

  return fromDbUrlKeywordPair(data, pair.rankingHistory || []);
};

// Update an existing URL/keyword pair
export const updateUrlKeywordPair = async (pair: UrlKeywordPair): Promise<UrlKeywordPair | null> => {
  // Update the URL/keyword pair
  const { data, error } = await supabase
    .from('url_keyword_pairs')
    .update(toDbUrlKeywordPair(pair))
    .eq('id', pair.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating URL/keyword pair:', error);
    return null;
  }

  return fromDbUrlKeywordPair(data, pair.rankingHistory || []);
};

// Delete a URL/keyword pair
export const deleteUrlKeywordPair = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('url_keyword_pairs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting URL/keyword pair:', error);
    return false;
  }

  return true;
};

// Add a new ranking history entry
export const addRankingHistory = async (urlKeywordId: string, month: string, position: number): Promise<boolean> => {
  // Insert or update the ranking history
  const { error } = await supabase
    .from('ranking_history')
    .upsert({
      id: uuidv4(),
      url_keyword_id: urlKeywordId,
      month,
      position
    }, {
      onConflict: 'url_keyword_id,month'
    });

  if (error) {
    console.error('Error adding ranking history:', error);
    return false;
  }

  return true;
};

// Bulk add ranking history entries (for monthly updates)
export const bulkAddRankingHistory = async (entries: { urlKeywordId: string, month: string, position: number }[]): Promise<boolean> => {
  // Format the entries for insertion
  const historyRecords = entries.map(entry => ({
    id: uuidv4(),
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
    console.error('Error bulk adding ranking history:', error);
    return false;
  }

  return true;
};