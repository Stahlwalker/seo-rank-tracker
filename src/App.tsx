import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import RankingTable from './components/RankingTable';
import RankingChart from './components/RankingChart';
import ActionBar from './components/ActionBar';
import { Button } from './components/ui/button';
import { LogIn, Lock, Share2, LogOut } from 'lucide-react';
import { UrlKeywordPair } from './types';
import { getAllUrlKeywordPairs, updateUrlKeywordPair, addUrlKeywordPair, bulkAddRankingHistory, createSharedViewToken } from './services/supabaseService';
import { supabase } from './lib/supabase';
import { Database } from './types/supabase';
import { useTheme } from './context/ThemeContext';
import { toast } from './components/ui/use-toast';
import { Toaster } from 'sonner';

function App() {
  const [data, setData] = useState<UrlKeywordPair[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  const { isDark } = useTheme();
  const { role, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Force a fresh fetch from Supabase
        const { data: pairs, error } = await supabase
          .from('url_keyword_pairs')
          .select(`
                        *,
                        ranking_history (
                            month,
                            position
                        )
                    `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to match UrlKeywordPair type
        const transformedPairs = (pairs || []).map(pair => ({
          id: pair.id,
          url: pair.url,
          keyword: pair.keyword,
          monthlySearchVolume: typeof pair.monthly_search_volume === 'number' ? pair.monthly_search_volume : undefined,
          currentRanking: pair.current_ranking || null,
          note: pair.note || undefined,
          status: pair.status as 'Testing' | 'Needs Improvement' | '' || undefined,
          lastUpdated: pair.last_updated || undefined,
          rankingHistory: (pair.ranking_history as Database['public']['Tables']['ranking_history']['Row'][] || []).map(h => ({
            month: h.month,
            position: h.position
          })) || []
        }));

        setData(transformedPairs);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load data. Please try again.'
        );
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (role === 'admin') {
      loadData();
    }
  }, [role]);

  const handleRefreshRankings = async () => {
    if (role !== 'admin') return;

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
              lastUpdated: new Date().toISOString()
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
    link.setAttribute('download', `seo-rankings-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddUrl = async (newPair: UrlKeywordPair) => {
    if (role !== 'admin') return;

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
    if (role !== 'admin') return;

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
    if (role !== 'admin') return;

    const currentMonth = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });

    try {
      // Create entries only for items that have a current ranking
      const monthlyEntries = data
        .filter(item => item.currentRanking !== null)
        .map(item => ({
          urlKeywordId: item.id,
          month: currentMonth,
          position: item.currentRanking || 0
        }));

      if (monthlyEntries.length === 0) {
        setError('No current rankings available to record for this month.');
        return;
      }

      // Bulk add/update the current month's rankings
      await bulkAddRankingHistory(monthlyEntries);

      // Update UI, preserving historical data except for current month
      setData(prevData => prevData.map(item => {
        // Only add/update history if the item has a current ranking
        if (item.currentRanking === null) return item;

        return {
          ...item,
          rankingHistory: [
            ...item.rankingHistory.filter(h => h.month !== currentMonth), // Keep all other months
            { month: currentMonth, position: item.currentRanking || 0 }   // Add/update current month
          ]
        };
      }));

      setError(null);
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
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SERP Tracker</h1>
          <div className="flex items-center gap-4">
            {role === 'admin' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : role === 'viewer' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        </div>

        {!role ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Lock className="h-12 w-12 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-500 mb-4">Please log in to access the SERP Tracker.</p>
            <Button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <div className="flex gap-2">
                <Button
                  variant={activeView === 'table' ? 'default' : 'outline'}
                  onClick={() => setActiveView('table')}
                >
                  Table View
                </Button>
                <Button
                  variant={activeView === 'chart' ? 'default' : 'outline'}
                  onClick={() => setActiveView('chart')}
                >
                  Chart View
                </Button>
              </div>
            </div>

            <ActionBar
              onRefresh={handleRefreshRankings}
              onExport={handleExport}
              onMonthlyUpdate={handleMonthlyUpdate}
              data={data}
              onAddUrl={handleAddUrl}
              onImport={handleImport}
              isAdmin={role === 'admin'}
            />

            <div className="mt-8">
              {activeView === 'table' ? (
                <RankingTable
                  data={data}
                  setData={setData}
                  isLoading={isLoading}
                  isAdmin={role === 'admin'}
                />
              ) : (
                <RankingChart
                  data={data}
                  setData={setData}
                  isLoading={isLoading}
                  isAdmin={role === 'admin'}
                />
              )}
            </div>
          </>
        )}
      </div>

      {isLoginModalOpen && (
        <AuthModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </div>
  );
}

export default App;