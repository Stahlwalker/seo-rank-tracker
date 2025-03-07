import { GoogleSearchResponse, GoogleSearchResult } from '../types';

interface OrganicResult {
  title?: string;
  link: string;
  snippet?: string;
}

const SERP_API_KEY = import.meta.env.VITE_SERP_API_KEY;

// Validate API key on module load
if (!SERP_API_KEY) {
  throw new Error(
    'SERP API key is not configured. Please add VITE_SERP_API_KEY to your .env file.'
  );
}

export const fetchGoogleRankings = async (
  keyword: string,
  targetUrl: string
): Promise<GoogleSearchResponse> => {
  try {
    // Extract domain and path from target URL for matching
    const targetUrlObj = new URL(targetUrl);
    const targetDomain = targetUrlObj.hostname;
    const targetPath = targetUrlObj.pathname;

    // Make the API call to our proxy endpoint
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(keyword)}&num=100`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Search request failed (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Search error: ${data.error}`);
    }

    if (!data.organic_results || !Array.isArray(data.organic_results)) {
      throw new Error('Invalid response: No organic results found');
    }

    // Get all organic results
    const organicResults = data.organic_results as OrganicResult[];
    let targetPosition: number | null = null;

    // Process first 10 results for display
    const processedResults: GoogleSearchResult[] = organicResults
      .slice(0, 10)
      .map((result, index: number) => {
        const position = index + 1;

        try {
          const resultUrl = new URL(result.link);
          const resultDomain = resultUrl.hostname;
          const resultPath = resultUrl.pathname;

          // Check if this is our target URL by comparing both domain and path
          if (!targetPosition && resultDomain === targetDomain) {
            // For exact URL match, check if paths match (ignoring trailing slashes)
            const normalizedTargetPath = targetPath.replace(/\/$/, '');
            const normalizedResultPath = resultPath.replace(/\/$/, '');

            if (normalizedTargetPath === normalizedResultPath) {
              targetPosition = position;
            }
          }

          return {
            position,
            title: result.title || '',
            link: result.link,
            snippet: result.snippet || ''
          };
        } catch {
          console.warn(`Invalid URL in search result: ${result.link}`);
          return {
            position,
            title: result.title || '',
            link: result.link || '',
            snippet: result.snippet || ''
          };
        }
      });

    // If target URL wasn't in top 10, check remaining results
    if (!targetPosition) {
      for (let i = 10; i < organicResults.length; i++) {
        try {
          const result = organicResults[i];
          const resultUrl = new URL(result.link);
          const resultDomain = resultUrl.hostname;
          const resultPath = resultUrl.pathname;

          if (resultDomain === targetDomain) {
            // For exact URL match, check if paths match (ignoring trailing slashes)
            const normalizedTargetPath = targetPath.replace(/\/$/, '');
            const normalizedResultPath = resultPath.replace(/\/$/, '');

            if (normalizedTargetPath === normalizedResultPath) {
              targetPosition = i + 1;
              break;
            }
          }
        } catch {
          console.warn(`Invalid URL in search result: ${organicResults[i].link}`);
          continue;
        }
      }
    }

    return {
      keyword,
      results: processedResults,
      totalResults: data.search_information?.total_results || 0,
      targetPosition
    };
  } catch (error) {
    // Enhance error message with more context
    const message = error instanceof Error
      ? error.message
      : 'Unknown error occurred';

    console.error(`Error fetching search data for "${keyword}":`, message);

    throw new Error(
      `Failed to check ranking for "${keyword}": ${message}. ` +
      'Please verify the service is working correctly.'
    );
  }
};