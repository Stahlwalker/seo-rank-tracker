import { UrlKeywordPair } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, subMonths, parse } from 'date-fns';

// Generate mock data for demonstration purposes
export const generateMockData = (): UrlKeywordPair[] => {
  const mockUrls = [
    { 
      url: 'https://example.com/page1', 
      keyword: 'example keyword', 
      monthlySearchVolume: 1200,
      note: 'This page is performing well, continue optimizing for featured snippet',
      status: 'Testing' as const
    },
    { 
      url: 'https://example.com/blog/seo-tips', 
      keyword: 'seo tips', 
      monthlySearchVolume: 5400,
      note: 'Need to add more internal links to this page',
      status: '' as const
    },
    { 
      url: 'https://example.com/services', 
      keyword: 'professional services', 
      monthlySearchVolume: 720,
      note: 'Competitor ranking #1, analyze their content',
      status: 'Needs Improvement' as const
    },
  ];

  // Generate monthly data from August 2023 to current month
  const generateMonthlyData = () => {
    const months = [];
    const startDate = new Date(2023, 7); // August 2023 (0-indexed month)
    const currentDate = new Date();
    
    let currentMonth = startDate;
    while (currentMonth <= currentDate) {
      months.push({
        month: format(currentMonth, 'MMM yyyy'),
        position: Math.floor(Math.random() * 30) + 1 // Random position between 1-30
      });
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    }
    
    return months;
  };

  return mockUrls.map(item => {
    return {
      id: uuidv4(),
      url: item.url,
      keyword: item.keyword,
      monthlySearchVolume: item.monthlySearchVolume,
      currentRanking: Math.floor(Math.random() * 30) + 1,
      rankingHistory: generateMonthlyData(),
      note: item.note,
      status: item.status
    };
  });
};