import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { UrlKeywordPair } from '../types';
import { format } from 'date-fns';
import { Search, ArrowUpDown, Check, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RouteContext {
  data: UrlKeywordPair[];
  setData: React.Dispatch<React.SetStateAction<UrlKeywordPair[]>>;
  isLoading: boolean;
}

const RankingChart: React.FC = () => {
  const { data } = useOutletContext<RouteContext>();
  const { isDark } = useTheme();
  const [selectedUrls, setSelectedUrls] = useState<string[]>(
    data.length > 0 ? [data[0].id] : []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'url' | 'keyword' | 'volume'>('url');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSelectionPanel, setShowSelectionPanel] = useState(true);

  // Update selected URLs when data changes
  useEffect(() => {
    if (data.length > 0 && selectedUrls.length === 0) {
      setSelectedUrls([data[0].id]);
    }

    // Remove any selected URLs that no longer exist in the data
    setSelectedUrls(prev => prev.filter(id => data.some(item => item.id === id)));
  }, [data]);

  // Generate an array of month names from August 2023 to current month
  const generateMonths = () => {
    const months = [];
    const startDate = new Date(2023, 7); // August 2023 (0-indexed month)
    const currentDate = new Date();

    let currentMonth = startDate;
    while (currentMonth <= currentDate) {
      months.push(format(currentMonth, 'MMM yyyy'));
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    }

    return months;
  };

  const months = generateMonths();

  // Generate random color for each URL
  const getRandomColor = (index: number) => {
    // Use a predefined color palette for better visual consistency
    const colorPalette = [
      'rgb(53, 162, 235)',
      'rgb(255, 99, 132)',
      'rgb(75, 192, 192)',
      'rgb(255, 159, 64)',
      'rgb(153, 102, 255)',
      'rgb(255, 205, 86)',
      'rgb(201, 203, 207)',
      'rgb(54, 162, 235)',
      'rgb(255, 99, 132)',
      'rgb(75, 192, 192)'
    ];

    return colorPalette[index % colorPalette.length];
  };

  // Prepare chart data
  const chartData = {
    labels: months,
    datasets: data
      .filter(item => selectedUrls.includes(item.id))
      .map((item, index) => {
        const color = getRandomColor(index);

        // Map the data to match the months array
        const dataPoints = months.map(month => {
          const historyItem = item.rankingHistory.find(h => h.month === month);
          return historyItem ? historyItem.position : null;
        });

        return {
          label: `${item.url.replace(/^https?:\/\//, '').substring(0, 30)}${item.url.replace(/^https?:\/\//, '').length > 30 ? '...' : ''} (${item.keyword})`,
          data: dataPoints,
          borderColor: color,
          backgroundColor: color + '33', // Add transparency
          tension: 0.2,
        };
      }),
  };

  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        reverse: true, // Higher ranking = lower number = better
        beginAtZero: true,
        title: {
          display: true,
          text: 'Ranking Position',
          color: isDark ? '#e5e7eb' : '#374151',
        },
        ticks: {
          callback: function (value) {
            return value === 0 ? '' : value;
          },
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
        }
      },
      x: {
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          color: isDark ? '#e5e7eb' : '#374151',
        }
      },
      title: {
        display: true,
        text: 'Keyword Ranking History',
        color: isDark ? '#e5e7eb' : '#374151',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return `Month: ${tooltipItems[0].label}`;
          },
          label: (context) => {
            return `${context.dataset.label}: Position ${context.parsed.y || 'No data'}`;
          },
        },
        backgroundColor: isDark ? '#1f2937' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#e5e7eb' : '#111827',
        bodyColor: isDark ? '#e5e7eb' : '#111827',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
      },
    },
  };

  const toggleUrlSelection = (id: string) => {
    setSelectedUrls(prev =>
      prev.includes(id)
        ? prev.filter(urlId => urlId !== id)
        : [...prev, id]
    );
  };

  const selectSingleUrl = (id: string) => {
    setSelectedUrls([id]);
  };

  const filteredData = data.filter(item => {
    const urlMatch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
    const keywordMatch = item.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    return urlMatch || keywordMatch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'url') {
      comparison = a.url.localeCompare(b.url);
    } else if (sortBy === 'keyword') {
      comparison = a.keyword.localeCompare(b.keyword);
    } else if (sortBy === 'volume') {
      const volumeA = a.monthlySearchVolume || 0;
      const volumeB = b.monthlySearchVolume || 0;
      comparison = volumeA - volumeB;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'url' | 'keyword' | 'volume') => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow p-6`}>
      <div className={`transition-all duration-300 ${showSelectionPanel ? 'mb-6' : 'mb-2'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-medium ${isDark ? 'text-gray-100' : 'text-gray-700'}`}>URL Selection</h3>
          <button
            onClick={() => setShowSelectionPanel(!showSelectionPanel)}
            className={`flex items-center text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
          >
            {showSelectionPanel ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide Selection Panel
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show Selection Panel ({selectedUrls.length} selected)
              </>
            )}
          </button>
        </div>

        {showSelectionPanel && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div className="flex space-x-2 mb-2 md:mb-0">
                <button
                  onClick={() => setSelectedUrls(data.map(item => item.id))}
                  className={`px-3 py-1 text-sm rounded-md ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors flex items-center`}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Select All
                </button>
                <button
                  onClick={() => setSelectedUrls([])}
                  className={`px-3 py-1 text-sm rounded-md ${isDark ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-600 text-white hover:bg-gray-700'} transition-colors flex items-center`}
                  disabled={selectedUrls.length === 0}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Selection
                </button>
              </div>
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  placeholder="Search URLs or keywords..."
                  className={`pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark
                      ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className={`overflow-hidden border rounded-lg mb-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <button
                        className="flex items-center focus:outline-none"
                        onClick={() => handleSort('url')}
                      >
                        URL
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortBy === 'url' ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <button
                        className="flex items-center focus:outline-none"
                        onClick={() => handleSort('keyword')}
                      >
                        Keyword
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortBy === 'keyword' ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <button
                        className="flex items-center focus:outline-none"
                        onClick={() => handleSort('volume')}
                      >
                        Search Volume
                        <ArrowUpDown className={`ml-1 h-3 w-3 ${sortBy === 'volume' ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${isDark ? 'bg-gray-900' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {sortedData.length > 0 ? (
                    sortedData.map(item => (
                      <tr key={item.id} className={`${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} ${selectedUrls.includes(item.id) ? isDark ? 'bg-blue-900/20' : 'bg-blue-50' : ''}`}>
                        <td className={`px-6 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 mr-2 rounded border flex items-center justify-center cursor-pointer ${selectedUrls.includes(item.id)
                                  ? 'bg-blue-600 border-blue-600'
                                  : isDark
                                    ? 'border-gray-600 hover:border-blue-400'
                                    : 'border-gray-300 hover:border-blue-400'
                                }`}
                              onClick={() => toggleUrlSelection(item.id)}
                            >
                              {selectedUrls.includes(item.id) && <Check className="h-3 w-3 text-white" />}
                            </div>
                            {item.url.replace(/^https?:\/\//, '').substring(0, 30)}
                            {item.url.replace(/^https?:\/\//, '').length > 30 ? '...' : ''}
                          </div>
                        </td>
                        <td className={`px-6 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          {item.keyword}
                        </td>
                        <td className={`px-6 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          {item.monthlySearchVolume !== undefined ? item.monthlySearchVolume.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => selectSingleUrl(item.id)}
                              className={`px-2 py-1 text-xs rounded ${selectedUrls.includes(item.id) && selectedUrls.length === 1
                                  ? 'bg-blue-600 text-white'
                                  : isDark
                                    ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                            >
                              View Only
                            </button>
                            <button
                              onClick={() => toggleUrlSelection(item.id)}
                              className={`px-2 py-1 text-xs rounded ${selectedUrls.includes(item.id)
                                  ? isDark
                                    ? 'bg-red-900/50 text-red-300 hover:bg-red-800'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : isDark
                                    ? 'bg-green-900/50 text-green-300 hover:bg-green-800'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                            >
                              {selectedUrls.includes(item.id) ? 'Remove' : 'Add'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className={`px-6 py-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        No URLs match your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Selected URLs ({selectedUrls.length}):</span>
              {selectedUrls.length > 0 ? (
                data
                  .filter(item => selectedUrls.includes(item.id))
                  .map(item => (
                    <div
                      key={item.id}
                      className={`px-3 py-1 text-sm rounded-full flex items-center ${isDark
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                    >
                      {item.url.replace(/^https?:\/\//, '').substring(0, 20)}
                      {item.url.replace(/^https?:\/\//, '').length > 20 ? '...' : ''}
                      <button
                        onClick={() => toggleUrlSelection(item.id)}
                        className={`ml-1 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
              ) : (
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No URLs selected</span>
              )}
            </div>
          </>
        )}
      </div>

      {selectedUrls.length > 0 ? (
        <div className="h-[500px]">
          <Line data={chartData} options={options} />
        </div>
      ) : (
        <div className={`flex items-center justify-center h-[500px] rounded-lg border ${isDark
            ? 'bg-gray-800 border-gray-700 text-gray-400'
            : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}>
          <p>Select at least one URL to display the chart</p>
        </div>
      )}
    </div>
  );
};

export default RankingChart;