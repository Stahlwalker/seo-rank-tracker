import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Header from './components/Header';
import ActionBar from './components/ActionBar';
import RankingTable from './components/RankingTable';
import RankingChart from './components/RankingChart';
import { UrlKeywordPair, RankingData } from './types';
import { generateMockData } from './utils/mockData';
import { 
  getAllUrlKeywordPairs, 
  addUrlKeywordPair, 
  updateUrlKeywordPair, 
  deleteUrlKeywordPair,
  bulkAddRankingHistory
} from './services/supabaseService';

function App() {
  const [data, setData] = useState<UrlKeywordPair[]>([]);
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDataFromSource();
  }, []);

  const loadDataFromSource = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabaseData = await getAllUrlKeywordPairs();
      
      if (supabaseData && supabaseData.length > 0) {
        setData(supabaseData);
      } else {
        const mockData = generateMockData();
        const savedData = await Promise.all(
          mockData.map(pair => addUrlKeywordPair(pair))
        );
        const validData = savedData.filter((item): item is UrlKeywordPair => item !== null);
        setData(validData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to load data. Please check your Supabase configuration.'
      );
      setData(generateMockData());
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUrl = async (newPair: UrlKeywordPair) => {
    try {
      const result = await addUrlKeywordPair(newPair);
      if (result) {
        setData(prevData => [...prevData, result]);
      }
    } catch (error) {
      console.error('Error adding URL:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to add URL. Please try again.'
      );
    }
  };

  const handleImportUrls = async (importedData: UrlKeywordPair[]) => {
    try {
      setData(prevData => [...prevData, ...importedData]);
    } catch (error) {
      console.error('Error importing URLs:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to import URLs. Please try again.'
      );
    }
  };

  const handleRefresh = async () => {
    try {
      const updatedData = await Promise.all(
        data.map(async (item) => {
          try {
            const response = await fetch(`https://serpapi.com/search?api_key=${import.meta.env.VITE_SERP_API_KEY}&q=${encodeURIComponent(item.keyword)}&engine=google&num=100`);
            const result = await response.json();
            
            const organicResults = result.organic_results || [];
            const targetDomain = new URL(item.url).hostname;
            let position = null;
            
            for (let i = 0; i < organicResults.length; i++) {
              const resultUrl = organicResults[i].link;
              const resultDomain = new URL(resultUrl).hostname;
              
              if (resultDomain.includes(targetDomain) || targetDomain.includes(resultDomain)) {
                position = i + 1;
                break;
              }
            }
            
            return {
              ...item,
              currentRanking: position,
              lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
            };
          } catch (error) {
            console.error(`Error updating ranking for ${item.url}:`, error);
            return item;
          }
        })
      );
      
      const results = await Promise.all(
        updatedData.map(item => updateUrlKeywordPair(item))
      );
      
      const validData = results.filter((item): item is UrlKeywordPair => item !== null);
      setData(validData);
    } catch (error) {
      console.error('Error refreshing rankings:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to refresh rankings. Please try again.'
      );
    }
  };

  const handleExport = () => {
    const headers = ['url', 'keyword', 'monthlySearchVolume', 'currentRanking', 'status', 'note'];
    const csvRows = [headers.join(',')];
    
    data.forEach(item => {
      const row = [
        `"${item.url}"`,
        `"${item.keyword}"`,
        item.monthlySearchVolume !== undefined ? item.monthlySearchVolume : '',
        item.currentRanking !== null ? item.currentRanking : '',
        item.status ? `"${item.status}"` : '',
        item.note ? `"${item.note.replace(/"/g, '""')}"` : ''
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `seo-rankings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMonthlyUpdate = async () => {
    try {
      const currentMonth = format(new Date(), 'MMM yyyy');
      
      const updatedData = data.map(item => {
        const monthExists = item.rankingHistory.some(
          history => history.month === currentMonth
        );
        
        if (monthExists || item.currentRanking === null) {
          return item;
        }
        
        const newRankingData: RankingData = {
          month: currentMonth,
          position: item.currentRanking
        };
        
        return {
          ...item,
          rankingHistory: [...item.rankingHistory, newRankingData]
        };
      });
      
      const results = await Promise.all(
        updatedData.map(item => updateUrlKeywordPair(item))
      );
      
      const validData = results.filter((item): item is UrlKeywordPair => item !== null);
      
      const historyEntries = validData
        .filter(item => item.currentRanking !== null)
        .filter(item => !item.rankingHistory.some(h => h.month === currentMonth))
        .map(item => ({
          urlKeywordId: item.id,
          month: currentMonth,
          position: item.currentRanking as number
        }));
      
      if (historyEntries.length > 0) {
        await bulkAddRankingHistory(historyEntries);
      }
      
      setData(validData);
    } catch (error) {
      console.error('Error updating monthly rankings:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to update monthly rankings. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />
      
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <ActionBar 
          onRefresh={handleRefresh}
          onExport={handleExport}
          onMonthlyUpdate={handleMonthlyUpdate}
          data={data}
          onAddUrl={handleAddUrl}
          onImport={handleImportUrls}
        />
        
        {activeView === 'table' ? (
          <RankingTable 
            data={data}
            setData={setData}
            isLoading={isLoading}
          />
        ) : (
          <RankingChart 
            data={data}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}

export default App;