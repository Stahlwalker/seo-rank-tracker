import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { UrlKeywordPair } from './types';
import { getAllUrlKeywordPairs, updateUrlKeywordPair, addUrlKeywordPair, bulkAddRankingHistory } from './services/supabaseService';
import ActionBar from './components/ActionBar';
import { generateMockData } from './utils/mockData';
import Header from './components/Header';

function App() {
  const [data, setData] = useState<UrlKeywordPair[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const pairs = await getAllUrlKeywordPairs();
        setData(pairs.length > 0 ? pairs : generateMockData());
      } catch (error) {
        console.error('Error loading data:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load data. Please try again.'
        );
        // Load mock data as fallback
        setData(generateMockData());
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRefreshRankings = async () => {
    setIsLoading(true);
    try {
      const updatedData = await Promise.all(
        data.map(async (item) => {
          try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(item.keyword)}`);
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
    } finally {
      setIsLoading(false);
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

  const handleAddUrl = async (newPair: UrlKeywordPair) => {
    try {
      const addedPair = await addUrlKeywordPair(newPair);
      if (addedPair) {
        setData(prevData => [...prevData, addedPair]);
      } else {
        throw new Error('Failed to add URL to database');
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

  const handleImport = async (importedData: UrlKeywordPair[]) => {
    try {
      const addedPairs = await Promise.all(
        importedData.map(pair => addUrlKeywordPair(pair))
      );
      const validPairs = addedPairs.filter((pair): pair is UrlKeywordPair => pair !== null);
      setData(prevData => [...prevData, ...validPairs]);
    } catch (error) {
      console.error('Error importing URLs:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to import URLs. Please try again.'
      );
    }
  };

  const handleMonthlyUpdate = async () => {
    const currentMonth = format(new Date(), 'MMM yyyy');

    // Create entries for the current month's rankings
    const monthlyEntries = data.map(item => ({
      urlKeywordId: item.id,
      month: currentMonth,  // This will be "Apr 2024" in April
      position: item.currentRanking || 0
    }));

    // Bulk add only the current month's rankings
    await bulkAddRankingHistory(monthlyEntries);

    // Update UI, preserving all other months' data
    setData(prevData => prevData.map(item => ({
      ...item,
      rankingHistory: [
        ...item.rankingHistory.filter(h => h.month !== currentMonth), // Keep all other months
        { month: currentMonth, position: item.currentRanking || 0 }   // Add/update current month
      ]
    })));
  };

  const activeView = location.pathname === '/chart' ? 'chart' : 'table';
  const setActiveView = (view: 'table' | 'chart') => {
    navigate(view === 'table' ? '/' : '/chart');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeView={activeView} setActiveView={setActiveView} />

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <ActionBar
              onRefresh={handleRefreshRankings}
              onExport={handleExport}
              onMonthlyUpdate={handleMonthlyUpdate}
              data={data}
              onAddUrl={handleAddUrl}
              onImport={handleImport}
            />

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <Outlet context={{ data, setData, isLoading }} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;