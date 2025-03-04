import { UrlKeywordPair } from '../types';

const STORAGE_KEY = 'seo-rank-tracker-data';

export const saveData = (data: UrlKeywordPair[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

export const loadData = (): UrlKeywordPair[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }
  return [];
};

export const deleteUrlData = (id: string): void => {
  try {
    const data = loadData();
    const updatedData = data.filter(item => item.id !== id);
    saveData(updatedData);
  } catch (error) {
    console.error('Error deleting URL data:', error);
  }
};

export const addUrlData = (newPair: UrlKeywordPair): void => {
  try {
    const data = loadData();
    saveData([...data, newPair]);
  } catch (error) {
    console.error('Error adding URL data:', error);
  }
};

export const updateUrlData = (updatedPair: UrlKeywordPair): void => {
  try {
    const data = loadData();
    const updatedData = data.map(item => 
      item.id === updatedPair.id ? updatedPair : item
    );
    saveData(updatedData);
  } catch (error) {
    console.error('Error updating URL data:', error);
  }
};

// Check if localStorage is available
export const isStorageAvailable = (): boolean => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};