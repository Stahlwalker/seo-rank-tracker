import { supabase } from '../lib/supabase';
import { fetchGoogleRankings } from './serpApi';
import { UrlKeywordPair } from '../types';
import { format } from 'date-fns';

export const checkAndUpdateRanking = async (pair: UrlKeywordPair): Promise<UrlKeywordPair> => {
  try {
    // Get current ranking from Google
    const response = await fetchGoogleRankings(pair.keyword, pair.url);
    
    // If no target position was found, update with null ranking
    const newRanking = response.targetPosition ?? null;
    
    // Store the previous ranking
    const prevRank = pair.currentRanking;
    
    // Create new SERP ranking record
    const { error: serpError } = await supabase
      .from('serp_rankings')
      .insert({
        url_keyword_id: pair.id,
        prev_rank: prevRank,
        curr_rank: newRanking,
        checked_at: new Date().toISOString()
      });

    if (serpError) {
      console.warn('Failed to save SERP ranking history:', serpError);
      // Don't throw here - continue with the update even if history fails
    }

    // Update the URL/keyword pair with new ranking
    const { data: updatedPair, error: updateError } = await supabase
      .from('url_keyword_pairs')
      .update({
        current_ranking: newRanking,
        last_updated: new Date().toISOString()
      })
      .eq('id', pair.id)
      .select('*')
      .single();

    if (updateError || !updatedPair) {
      throw new Error(
        `Failed to update URL/keyword pair: ${updateError?.message || 'No data returned'}`
      );
    }

    // Get ranking history for the updated pair
    const { data: history, error: historyError } = await supabase
      .from('ranking_history')
      .select('*')
      .eq('url_keyword_id', pair.id)
      .order('month', { ascending: true });

    if (historyError) {
      console.warn('Failed to fetch ranking history:', historyError);
      // Don't throw - return existing history if fetch fails
    }

    // Return updated pair with history
    return {
      ...pair,
      currentRanking: newRanking,
      lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      rankingHistory: history?.map(h => ({
        month: h.month,
        position: h.position
      })) || pair.rankingHistory
    };
  } catch (error) {
    const message = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    console.error(`Error updating ranking for ${pair.url}:`, message);
    throw new Error(
      `Failed to check ranking for "${pair.keyword}". ${message}`
    );
  }
};