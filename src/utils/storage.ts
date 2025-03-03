import { UrlKeywordPair } from '../types';

const STORAGE_KEY = 'seo-rank-tracker-data';

export const saveData = (data: UrlKeywordPair[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadData = (): UrlKeywordPair[] => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    return JSON.parse(storedData);
  }
  return [];
};