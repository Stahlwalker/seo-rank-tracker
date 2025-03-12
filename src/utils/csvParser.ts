import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { UrlKeywordPair, RankingData } from '../types';
import { format } from 'date-fns';

interface CsvRow {
  url: string;
  keyword: string;
  monthlySearchVolume?: string;
  currentRanking?: string;
  status?: '' | 'Testing' | 'Needs Improvement';
  note?: string;
  [key: string]: string | undefined; // Allow for dynamic monthly ranking columns
}

function parseNumber(value: string): number | undefined {
  if (!value) return undefined;
  // Remove commas and any whitespace
  const cleanValue = value.replace(/,/g, '').trim();
  const parsed = parseInt(cleanValue, 10);
  return isNaN(parsed) ? undefined : parsed;
}

function parseMonthlySearchVolume(value: string | undefined): number | undefined {
  if (!value) return 0;
  if (value.toLowerCase() === 'n/a') return 0;

  const parsed = parseNumber(value);
  return parsed ?? 0; // Return 0 if parsing failed
}

function parseCurrentRanking(value: string | undefined): number | null {
  if (!value) return null;
  if (value.toLowerCase() === 'n/a') return null;

  const parsed = parseNumber(value);
  return parsed ?? null; // Return null if parsing failed
}

export const parseCSV = (file: File): Promise<UrlKeywordPair[]> => {
  return new Promise((resolve, reject) => {
    console.log('Starting CSV parse for file:', file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          console.log('Raw Papa Parse results:', results);
          const parsedData = results.data as CsvRow[];
          console.log('First row of data:', parsedData[0]);

          const headers = Object.keys(parsedData[0] || {});
          console.log('CSV Headers:', headers);

          // Identify monthly ranking columns (format: MMM YYYY)
          const monthlyColumns = headers.filter(header => {
            console.log('Checking header:', header);
            // Updated regex to match "Aug 2023" format more loosely
            const monthRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]+\d{4}$/;
            const isMonthly = monthRegex.test(header);
            console.log(`Header "${header}" is monthly:`, isMonthly);
            if (isMonthly) {
              console.log('Found monthly column:', header);
            }
            return isMonthly;
          });

          console.log('Detected monthly columns:', monthlyColumns);

          if (monthlyColumns.length === 0) {
            console.warn('No monthly columns detected! Headers were:', headers);
          }

          const urlKeywordPairs: UrlKeywordPair[] = parsedData.map((row, index) => {
            console.log(`Processing row ${index + 1}:`, row);

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

            const monthlySearchVolume = parseMonthlySearchVolume(row.monthlySearchVolume);
            const currentRanking = parseCurrentRanking(row.currentRanking);

            // Parse monthly ranking history
            const rankingHistory: RankingData[] = monthlyColumns
              .map(month => {
                const monthValue = row[month];
                console.log(`Parsing month ${month} for URL ${row.url}:`, monthValue);
                if (monthValue === undefined || monthValue === '') {
                  console.log(`No value found for month ${month}`);
                  return null;
                }
                const position = parseNumber(monthValue);
                console.log(`Parsed position for ${month}:`, position);
                return position !== undefined ? {
                  month,
                  position
                } : null;
              })
              .filter((entry): entry is RankingData => entry !== null);

            console.log('Final ranking history for URL', row.url, ':', rankingHistory);

            // Create new entry
            return {
              id: uuidv4(),
              url: row.url,
              keyword: row.keyword,
              monthlySearchVolume,
              currentRanking,
              rankingHistory,
              status,
              note: row.note || undefined
            };
          });

          console.log('Final processed data:', urlKeywordPairs);
          resolve(urlKeywordPairs);
        } catch (error) {
          console.error('Error parsing CSV:', error);
          console.error('Error details:', {
            error,
            stack: error instanceof Error ? error.stack : undefined
          });
          reject(error);
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        reject(error);
      }
    });
  });
};

export const generateCsvTemplate = (): string => {
  const headers = ['url', 'keyword', 'monthlySearchVolume', 'currentRanking', 'status', 'note'];

  // Add monthly columns from Aug 2023 to current month
  const startDate = new Date(2023, 7); // August 2023
  const currentDate = new Date();
  let currentMonth = startDate;
  while (currentMonth <= currentDate) {
    // Format to match "Aug 2023" style
    const monthStr = format(currentMonth, 'MMM yyyy').replace('MMM', format(currentMonth, 'MMM'));
    headers.push(monthStr);
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  }

  const example = [
    'https://example.com',
    'example keyword',
    '5,400',
    '5',
    'Testing',
    'Example note'
  ];

  // Add example ranking data for each month
  const startMonthCount = headers.length - example.length;
  for (let i = 0; i < startMonthCount; i++) {
    example.push('10'); // Example ranking for each month
  }

  return `${headers.join(',')}\n${example.join(',')}\n` +
    `https://example.com/page2,another keyword,5400,10,Needs Improvement,Example without comma${',10'.repeat(startMonthCount)}`;
};