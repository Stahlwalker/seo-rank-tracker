export interface RankingData {
  month: string;
  position: number;
}

export interface UrlKeywordPair {
  id: string;
  url: string;
  keyword: string;
  monthlySearchVolume?: number;
  currentRanking: number | null;
  rankingHistory: RankingData[];
  note?: string;
  status?: 'Testing' | 'Needs Improvement' | '';
  lastUpdated?: string;
}

export interface GoogleSearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
}

export interface GoogleSearchResponse {
  keyword: string;
  results: GoogleSearchResult[];
  totalResults: number;
  targetPosition?: number | null;
}