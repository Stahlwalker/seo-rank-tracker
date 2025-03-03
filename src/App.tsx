import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import Header from './components/Header';
import ActionBar from './components/ActionBar';
import RankingTable from './components/RankingTable';
import RankingChart from './components/RankingChart';
import { UrlKeywordPair, RankingData } from './types';
import { saveData, loadData } from './utils/storage';
import { generateMockData } from './utils/mockData';

function App() {
  const [data, setData] = useState<UrlKeywordPair[]>([]);
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const storedData = loadData();
    if (storedData.length > 0) {
      setData(storedData);
    } else {
      // Use mock data for demonstration
      setData(generateMockData());
    }
  }, []);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    saveData(data);
  }, [data]);
  
  const handleAddUrl = (newPair: UrlKeywordPair) => {
    setData(prevData => [...prevData, newPair]);
  };
  
  const handleImport = (importedData: UrlKeywordPair[]) => {
    setData(prevData => [...prevData, ...importedData]);
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
  
  const handleDelete = (id: string) => {
    setData(prevData => prevData.filter(item => item.id !== id));
  };
  
  const handleUpdateNote = (id: string, note: string | undefined) => {
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, note } : item
      )
    );
  };
  
  const handleUpdateStatus = (id: string, status: 'Testing' | 'Needs Improvement' | '') => {
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, status } : item
      )
    );
  };
  
  const handleRefresh = () => {
    // Simulate refreshing current rankings with random data
    setData(prevData => 
      prevData.map(item => ({
        ...item,
        currentRanking: Math.floor(Math.random() * 30) + 1
      }))
    );
  };
  
  const handleMonthlyUpdate = () => {
    // Simulate monthly update - add current ranking to history
    const currentMonth = format(new Date(), 'MMM yyyy');
    
    setData(prevData => 
      prevData.map(item => {
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
      })
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header activeView={activeView} setActiveView={setActiveView} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            SEO Keyword Ranking Tracker
          </h2>
          <p className="text-gray-600">
            Track your website's keyword rankings over time. Add URLs and keywords to monitor, 
            import data from CSV, or export your tracking data.
          </p>
        </div>
        
        <ActionBar
          onAddUrl={handleAddUrl}
          onImport={handleImport}
          onExport={handleExport}
          onRefresh={handleRefresh}
          data={data}
        />
        
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleMonthlyUpdate}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center"
            title="Simulate monthly update (1st of month)"
          >
            Simulate Monthly Update
          </button>
        </div>
        
        {activeView === 'table' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <RankingTable 
              data={data} 
              onDelete={handleDelete} 
              onUpdateNote={handleUpdateNote}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        ) : (
          <RankingChart data={data} />
        )}
      </main>
    </div>
  );
}

export default App;