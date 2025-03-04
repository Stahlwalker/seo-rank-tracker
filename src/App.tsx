import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
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

  useEffect(() => {
    const loadDataFromSource = async () => {
      setIsLoading(true);
      
      try {
        // Try to load from Supabase
        const supabaseData = await getAllUrlKeywordPairs();
        if (supabaseData && supabaseData.length > 0) {
          setData(supabaseData);
        } else {
          // If no data, generate mock data
          const mockData = generateMockData();
          setData(mockData);
          
          // Save mock data to Supabase
          await Promise.all(mockData.map(pair => addUrlKeywordPair(pair)));
        }
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        // If error, use mock data but don't save it
        const mockData = generateMockData();
        setData(mockData);
      }
      
      setIsLoading(false);
    };
    
    loadDataFromSource();
  }, []);

  const handleRefresh = async () => {
    // Simulate refreshing current rankings with random data
    const updatedData = data.map(item => ({
      ...item,
      currentRanking: Math.floor(Math.random() * 30) + 1,
      lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    }));
    
    try {
      await Promise.all(
        updatedData.map(item => updateUrlKeywordPair(item))
      );
      setData(updatedData);
    } catch (error) {
      console.error('Error refreshing rankings:', error);
    }
  };

  const handleExport = () => {
    // Create CSV content
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
    
    // Create and download the file
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
    // Simulate monthly update - add current ranking to history
    const currentMonth = format(new Date(), 'MMM yyyy');
    
    const updatedData = data.map(item => {
      // Check if we already have this month in history
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
    
    try {
      // First update the URL/keyword pairs
      await Promise.all(
        updatedData.map(item => updateUrlKeywordPair(item))
      );
      
      // Then add the ranking history entries
      const historyEntries = updatedData
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
      
      setData(updatedData);
    } catch (error) {
      console.error('Error updating monthly rankings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />
      
      <main className="container mx-auto px-4 py-8">
        <ActionBar 
          onRefresh={handleRefresh}
          onExport={handleExport}
          onMonthlyUpdate={handleMonthlyUpdate}
          data={data}
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