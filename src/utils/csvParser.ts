import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { UrlKeywordPair } from '../types';

interface CsvRow {
  url: string;
  keyword: string;
  monthlySearchVolume?: string;
  currentRanking?: string;
  status?: '' | 'Testing' | 'Needs Improvement';
  note?: string;
}

export const parseCSV = (file: File): Promise<UrlKeywordPair[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData = results.data as CsvRow[];
          
          const urlKeywordPairs: UrlKeywordPair[] = parsedData.map(row => {
            // Validate URL
            try {
              new URL(row.url);
            } catch (e) {
              throw new Error(`Invalid URL: ${row.url}`);
            }
            
            // Validate status
            let status: '' | 'Testing' | 'Needs Improvement' | undefined = undefined;
            if (row.status) {
              if (row.status === 'Testing' || row.status === 'Needs Improvement') {
                status = row.status;
              } else {
                status = '';
              }
            }
            
            // Create new entry
            return {
              id: uuidv4(),
              url: row.url,
              keyword: row.keyword,
              monthlySearchVolume: row.monthlySearchVolume ? parseInt(row.monthlySearchVolume, 10) || undefined : undefined,
              currentRanking: row.currentRanking ? parseInt(row.currentRanking, 10) || null : null,
              rankingHistory: [],
              status,
              note: row.note || undefined
            };
          });
          
          resolve(urlKeywordPairs);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const generateCsvTemplate = (): string => {
  return 'url,keyword,monthlySearchVolume,currentRanking,status,note\nhttps://example.com/page,example keyword,1200,5,"Testing","This is an example note"';
};