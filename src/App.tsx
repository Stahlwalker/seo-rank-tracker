import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import Header from './components/Header';
import ActionBar from './components/ActionBar';
import RankingTable from './components/RankingTable';
import RankingChart from './components/RankingChart';
import { UrlKeywordPair, RankingData } from './types';
import { saveData, loadData, deleteUrlData, isStorageAvailable } from './utils/storage';
import { generateMockData } from './utils/mockData';
import DatabaseInfoModal from './components/DatabaseInfoModal';
import { Database } from 'lucide-react';
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
  const [showDatabaseInfo, setShowDatabaseInfo] = useState(false);
  const [storageWarning, setStorageWarning] = useState(!isStorageAvailable());
  const [isLoading, setIsLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  
  // Load data from Supabase or localStorage
  useEffect(() => {
    const loadDataFromSource = async () => {
      setIsLoading(true);
      
      try {
        // Try to load from Supabase first
        const supabaseData = await getAllUrlKeywordPairs();
        if (supabaseData && supabaseData.length > 0) {
          setData(supabaseData);
          setUseLocalStorage(false);
        } else {
          // If no data in Supabase, try localStorage
          const localData = loadData();
          if (localData.length > 0) {
            setData(localData);
            setUseLocalStorage(true);
          } else {
            // If no data anywhere, generate mock data
            const mockData = generateMockData();
            setData(mockData);
            
            // Try to save to Supabase first, fallback to localStorage
            try {
              await Promise.all(mockData.map(pair => addUrlKeywordPair(pair)));
              setUseLocalStorage(false);
            } catch (error) {
              console.error('Error saving mock data to Supabase:', error);
              saveData(mockData);
              setUseLocalStorage(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        // Fallback to localStorage
        const localData = loadData();
        if (localData.length > 0) {
          setData(localData);
        } else {
          const mockData = generateMockData();
          setData(mockData);
          saveData(mockData);
        }
        setUseLocalStorage(true);
      }
      
      setIsLoading(false);
    };
    
    loadDataFromSource();
  }, []);
  
  // Save data to localStorage as a backup when using localStorage
  useEffect(() => {
    if (useLocalStorage && data.length > 0) {
      saveData(data);
    }
  }, [data, useLocalStorage]);
  
  const handleAddUrl = async (newPair: UrlKeywordPair) => {
    if (!useLocalStorage) {
      // Add to Supabase
      try {
        const addedPair = await addUrlKeywordPair(newPair);
        if (addedPair) {
          setData(prevData => [...prevData, addedPair]);
        }
      } catch (error) {
        console.error('Error adding URL to Supabase:', error);
        // Fallback to localStorage
        setData(prevData => [...prevData, newPair]);
        saveData([...data, newPair]);
        setUseLocalStorage(true);
      }
    } else {
      // Add to local state and localStorage
      setData(prevData => [...prevData, newPair]);
      // The useEffect will handle saving to localStorage
    }
  };
  
  const handleImport = async (importedData: UrlKeywordPair[]) => {
    if (!useLocalStorage) {
      // Add to Supabase
      try {
        const addedPairs = await Promise.all(
          importedData.map(pair => addUrlKeywordPair(pair))
        );
        
        const validPairs = addedPairs.filter(pair => pair !== null) as UrlKeywordPair[];
        setData(prevData => [...prevData, ...validPairs]);
      } catch (error) {
        console.error('Error importing URLs to Supabase:', error);
        // Fallback to localStorage
        setData(prevData => [...prevData, ...importedData]);
        saveData([...data, ...importedData]);
        setUseLocalStorage(true);
      }
    } else {
      // Add to local state and localStorage
      setData(prevData => [...prevData, ...importedData]);
      // The useEffect will handle saving to localStorage
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
  
  const handleDelete = async (id: string) => {
    if (!useLocalStorage) {
      // Delete from Supabase
      try {
        const success = await deleteUrlKeywordPair(id);
        if (success) {
          setData(prevData => prevData.filter(item => item.id !== id));
        }
      } catch (error) {
        console.error('Error deleting URL from Supabase:', error);
        // Continue with local deletion
        setData(prevData => prevData.filter(item => item.id !== id));
        setUseLocalStorage(true);
      }
    } else {
      // Delete from local state and localStorage
      setData(prevData => prevData.filter(item => item.id !== id));
      deleteUrlData(id);
    }
  };
  
  const handleUpdateNote = async (id: string, note: string | undefined) => {
    const itemToUpdate = data.find(item => item.id === id);
    if (!itemToUpdate) return;
    
    const updatedItem = { ...itemToUpdate, note };
    
    if (!useLocalStorage) {
      // Update in Supabase
      try {
        const updated = await updateUrlKeywordPair(updatedItem);
        if (updated) {
          setData(prevData => 
            prevData.map(item => 
              item.id === id ? updated : item
            )
          );
        }
      } catch (error) {
        console.error('Error updating note in Supabase:', error);
        // Fallback to localStorage
        setData(prevData => 
          prevData.map(item => 
            item.id === id ? updatedItem : item
          )
        );
        setUseLocalStorage(true);
      }
    } else {
      // Update in local state and localStorage
      setData(prevData => 
        prevData.map(item => 
          item.id === id ? updatedItem : item
        )
      );
      // The RankingTable component directly updates localStorage
    }
  };
  
  const handleUpdateStatus = async (id: string, status: 'Testing' | 'Needs Improvement' | '') => {
    const itemToUpdate = data.find(item => item.id === id);
    if (!itemToUpdate) return;
    
    const updatedItem = { ...itemToUpdate, status };
    
    if (!useLocalStorage) {
      // Update in Supabase
      try {
        const updated = await updateUrlKeywordPair(updatedItem);
        if (updated) {
          setData(prevData => 
            prevData.map(item => 
              item.id === id ? updated : item
            )
          );
        }
      } catch (error) {
        console.error('Error updating status in Supabase:', error);
        // Fallback to localStorage
        setData(prevData => 
          prevData.map(item => 
            item.id === id ? updatedItem : item
          )
        );
        setUseLocalStorage(true);
      }
    } else {
      // Update in local state and localStorage
      setData(prevData => 
        prevData.map(item => 
          item.id === id ? updatedItem : item
        )
      );
      // The RankingTable component directly updates localStorage
    }
  };
  
  const handleUpdateRanking = async (id: string, ranking: number) => {
    const itemToUpdate = data.find(item => item.id === id);
    if (!itemToUpdate) return;
    
    const updatedItem = { 
      ...itemToUpdate, 
      currentRanking: ranking,
      lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };
    
    if (!useLocalStorage) {
      // Update in Supabase
      try {
        const updated = await updateUrlKeywordPair(updatedItem);
        if (updated) {
          setData(prevData => 
            prevData.map(item => 
              item.id === id ? updated : item
            )
          );
        }
      } catch (error) {
        console.error('Error updating ranking in Supabase:', error);
        // Fallback to localStorage
        setData(prevData => 
          prevData.map(item => 
            item.id === id ? updatedItem : item
          )
        );
        setUseLocalStorage(true);
      }
    } else {
      // Update in local state and localStorage
      setData(prevData => 
        prevData.map(item => 
          item.id === id ? updatedItem : item
        )
      );
      // The RankingTable component directly updates localStorage
    }
  };
  
  const handleRefresh = async () => {
    // Simulate refreshing current rankings with random data
    const updatedData = data.map(item => ({
      ...item,
      currentRanking: Math.floor(Math.random() * 30) + 1,
      lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    }));
    
    if (!useLocalStorage) {
      // Update in Supabase
      try {
        await Promise.all(
          updatedData.map(item => updateUrlKeywordPair(item))
        );
      } catch (error) {
        console.error('Error refreshing rankings in Supabase:', error);
        setUseLocalStorage(true);
      }
    }
    
    setData(updatedData);
    
    if (useLocalStorage) {
      // Only save to localStorage if using localStorage
      saveData(updatedData);
    }
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
    
    if (!useLocalStorage) {
      // Update in Supabase
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
      } catch (error) {
        console.error('Error updating monthly rankings in Supabase:', error);
        setUseLocalStorage(true);
      }
    }
    
    setData(updatedData);
    
    if (useLocalStorage) {
      // Only save to localStorage if using localStorage
      saveData(updatedData);
    }
  };
  
  const toggleStorageMode = () => {
    if (useLocalStorage) {
      // Try to migrate from localStorage to Supabase
      const migrateToSupabase = async () => {
        try {
          await Promise.all(data.map(pair => addUrlKeywordPair(pair)));
          setUseLocalStorage(false);
          alert('Successfully migrated data to Supabase!');
        } catch (error) {
          console.error('Error migrating to Supabase:', error);
          alert('Failed to migrate data to Supabase. Please try again later.');
        }
      };
      migrateToSupabase();
    } else {
      // Switch to localStorage
      saveData(data);
      setUseLocalStorage(true);
      alert('Switched to localStorage mode. Data will be stored in your browser.');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />
      
      <main className="container mx-auto px-4 py-8">
        {useLocalStorage && storageWarning && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  LocalStorage is not available or is disabled in your browser. Your data will not be saved between sessions.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Database className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Currently using: <strong>{useLocalStorage ? 'Browser Local Storage' : 'Supabase Cloud Database'}</strong>
                <button 
                  className="ml-2 font-medium text-blue-700 underline"
                  onClick={toggleStorageMode}
                >
                  Switch to {useLocalStorage ? 'Supabase' : 'Local Storage'}
                </button>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              SEO Keyword Ranking Tracker
            </h2>
            <p className="text-gray-600">
              Track your website's keyword rankings over time. Add URLs and keywords to monitor, 
              import data from CSV, or export your tracking data.
            </p>
          </div>
          
          <button
            onClick={() => setShowDatabaseInfo(true)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
            title="Database options"
          >
            <Database className="h-4 w-4 mr-2 text-blue-600" />
            Database Options
          </button>
        </div>
        
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 flex justify-center items-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading your data...</p>
            </div>
          </div>
        ) : (
          <>
            <ActionBar
              onAddUrl={handleAddUrl}
              onImport={handleImport}
              onExport={handleExport}
              onRefresh={handleRefresh}
              data={data}
              isAuthenticated={!useLocalStorage}
              useLocalStorage={useLocalStorage}
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
                  onUpdateRanking={handleUpdateRanking}
                />
              </div>
            ) : (
              <RankingChart data={data} />
            )}
          </>
        )}
      </main>
      
      {showDatabaseInfo && (
        <DatabaseInfoModal onClose={() => setShowDatabaseInfo(false)} />
      )}
    </div>
  );
}

export default App;