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
}