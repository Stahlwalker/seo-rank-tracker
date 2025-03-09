import React, { useState, useRef } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  FilterFn,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { ArrowUpDown, Trash2, ExternalLink, Filter, Search, X, Edit, Save, XCircle, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { UrlKeywordPair } from '../types';
import { format } from 'date-fns';
import GoogleSearchModal from './GoogleSearchModal';
import { deleteUrlKeywordPair, updateUrlKeywordPair } from '../services/supabaseService';
import { useOutletContext } from 'react-router-dom';

interface RouteContext {
  data: UrlKeywordPair[];
  setData: React.Dispatch<React.SetStateAction<UrlKeywordPair[]>>;
  isLoading: boolean;
}

const RankingTable: React.FC = () => {
  const { data, setData, isLoading } = useOutletContext<RouteContext>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [selectedPair, setSelectedPair] = useState<UrlKeywordPair | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  const columnHelper = createColumnHelper<UrlKeywordPair>();

  // Generate an array of month names from August 2023 to current month
  const generateMonthColumns = () => {
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

  const monthColumns = generateMonthColumns();

  const handleDelete = async (id: string) => {
    try {
      setDeletingIds(prev => new Set([...prev, id]));
      setError(null);

      await deleteUrlKeywordPair(id);
      setData(prevData => prevData.filter(item => item.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete item');
      console.error('Error deleting item:', error);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUpdateNote = async (id: string, note: string | undefined) => {
    try {
      const item = data.find(item => item.id === id);
      if (!item) return;

      const updatedItem = { ...item, note };
      const result = await updateUrlKeywordPair(updatedItem);

      if (result) {
        setData(prevData => prevData.map(item =>
          item.id === id ? result : item
        ));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update note');
      console.error('Error updating note:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Testing' | 'Needs Improvement' | '') => {
    try {
      const item = data.find(item => item.id === id);
      if (!item) return;

      const updatedItem = { ...item, status };
      const result = await updateUrlKeywordPair(updatedItem);

      if (result) {
        setData(prevData => prevData.map(item =>
          item.id === id ? result : item
        ));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const columns = [
    columnHelper.accessor('url', {
      header: 'URL',
      cell: info => (
        <div className="flex items-center max-w-full">
          <a
            href={info.getValue()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center truncate"
          >
            <span className="truncate">
              {info.getValue().replace(/^https?:\/\//, '').substring(0, 30)}
              {info.getValue().replace(/^https?:\/\//, '').length > 30 ? '...' : ''}
            </span>
            <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
          </a>
        </div>
      ),
    }),
    columnHelper.accessor('keyword', {
      header: 'Keyword',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('monthlySearchVolume', {
      header: 'Monthly Search Volume',
      cell: info => {
        const value = info.getValue();
        return value !== undefined ? (
          <span className="font-medium">
            {value.toLocaleString()}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    }),
    ...monthColumns.map(month =>
      columnHelper.accessor(row => {
        const historyItem = row.rankingHistory.find(h => h.month === month);
        return historyItem ? historyItem.position : null;
      }, {
        id: `month-${month}`,
        header: month,
        cell: info => {
          const value = info.getValue();
          return value !== null ? (
            <span className={`font-medium ${value <= 10 ? 'text-green-600' :
              value <= 20 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
              {value}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      })
    ),
    columnHelper.accessor('currentRanking', {
      header: () => (
        <div className="flex items-center">
          Current Ranking
          <span className="ml-1 text-xs text-blue-600 font-normal">(click to check)</span>
        </div>
      ),
      cell: info => {
        const value = info.getValue();
        const lastUpdated = info.row.original.lastUpdated;

        return (
          <div className="flex items-center">
            {value !== null ? (
              <span className={`font-medium ${value <= 10 ? 'text-green-600' :
                value <= 20 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                {value}
              </span>
            ) : (
              <span className="text-gray-400">-</span>
            )}

            {lastUpdated && (
              <span className="ml-2 text-xs text-gray-400" title={`Last updated: ${lastUpdated}`}>
                {format(new Date(lastUpdated), 'MM/dd/yy')}
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const value = info.getValue();

        return (
          <div className="flex items-center">
            <select
              value={value || ''}
              onChange={(e) => handleUpdateStatus(
                info.row.original.id,
                e.target.value as 'Testing' | 'Needs Improvement' | ''
              )}
              className={`px-2 py-1 text-sm rounded-md border ${value === 'Testing'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : value === 'Needs Improvement'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
            >
              <option value="">None</option>
              <option value="Testing">Testing</option>
              <option value="Needs Improvement">Needs Improvement</option>
            </select>

            {value && (
              <div className="ml-2">
                {value === 'Testing' && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                {value === 'Needs Improvement' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
              </div>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('note', {
      header: 'Note',
      cell: info => {
        const id = info.row.original.id;
        const value = info.getValue();

        if (editingNoteId === id) {
          return (
            <div className="flex items-center">
              <textarea
                ref={noteInputRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                rows={2}
                placeholder="Add a note..."
              />
              <div className="flex flex-col ml-2">
                <button
                  onClick={() => {
                    handleUpdateNote(id, noteText || undefined);
                    setEditingNoteId(null);
                  }}
                  className="text-green-500 hover:text-green-700 p-1"
                  title="Save"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingNoteId(null)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Cancel"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-between group">
            <div className="flex-1 truncate">
              {value ? (
                <span className="text-gray-700">{value}</span>
              ) : (
                <span className="text-gray-400 italic">No note</span>
              )}
            </div>
            <button
              onClick={() => {
                setEditingNoteId(id);
                setNoteText(value || '');
                setTimeout(() => noteInputRef.current?.focus(), 0);
              }}
              className="text-blue-500 hover:text-blue-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit note"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      cell: info => {
        const isDeleting = deletingIds.has(info.row.original.id);
        return (
          <button
            onClick={() => handleDelete(info.row.original.id)}
            disabled={isDeleting}
            className={`p-1 rounded ${isDeleting
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-red-500 hover:text-red-700 hover:bg-red-50'
              }`}
            title="Delete"
          >
            <Trash2 className={`h-4 w-4 ${isDeleting ? 'animate-pulse' : ''}`} />
          </button>
        );
      },
    }),
  ];

  // Custom filter function for global search
  const globalFilterFn: FilterFn<UrlKeywordPair> = (row, columnId, value) => {
    const searchValue = value.toLowerCase();

    // Search in URL
    if (row.original.url.toLowerCase().includes(searchValue)) return true;

    // Search in keyword
    if (row.original.keyword.toLowerCase().includes(searchValue)) return true;

    // Search in note
    if (row.original.note && row.original.note.toLowerCase().includes(searchValue)) return true;

    // Search in status
    if (row.original.status && row.original.status.toLowerCase().includes(searchValue)) return true;

    return false;
  };

  // Custom filter function for ranking filters
  const rankingFilterFn: FilterFn<UrlKeywordPair> = (row, columnId, filterValue) => {
    if (activeFilters.length === 0) return true;

    const currentRanking = row.original.currentRanking;

    if (currentRanking === null) return false;

    if (activeFilters.includes('top10') && currentRanking <= 10) return true;
    if (activeFilters.includes('top20') && currentRanking > 10 && currentRanking <= 20) return true;
    if (activeFilters.includes('top30') && currentRanking > 20 && currentRanking <= 30) return true;
    if (activeFilters.includes('below30') && currentRanking > 30) return true;

    return false;
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: searchTerm,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn,
    filterFns: {
      ranking: rankingFilterFn,
    },
  });

  // Apply the ranking filter
  React.useEffect(() => {
    if (activeFilters.length > 0) {
      table.getColumn('currentRanking')?.setFilterValue(activeFilters);
    } else {
      table.getColumn('currentRanking')?.setFilterValue(undefined);
    }
  }, [activeFilters, table]);

  // Toggle a filter
  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleFilter('top10')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${activeFilters.includes('top10')
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              Top 10
            </button>
            <button
              onClick={() => toggleFilter('top20')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${activeFilters.includes('top20')
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              11-20
            </button>
            <button
              onClick={() => toggleFilter('top30')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${activeFilters.includes('top30')
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              21-30
            </button>
            <button
              onClick={() => toggleFilter('below30')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${activeFilters.includes('below30')
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              Below 30
            </button>
            {(activeFilters.length > 0 || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 flex items-center"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </button>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search URLs or keywords..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="m-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-x-auto shadow-sm">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                {table.getFlatHeaders().map(header => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-3 sm:px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50"
                    style={{ minWidth: header.id === 'url' ? '200px' : header.id === 'keyword' ? '150px' : 'auto' }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="px-3 sm:px-6 py-2 text-sm text-gray-500 truncate"
                      >
                        <div className="truncate">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={table.getAllColumns().length} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm || activeFilters.length > 0 ? 'No results match your search criteria' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GoogleSearchModal
            urlKeywordPair={selectedPair}
            onClose={() => setSelectedPair(null)}
            onUpdateRanking={(id, ranking) => {
              setData(prevData => prevData.map(item =>
                item.id === id
                  ? { ...item, currentRanking: ranking, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }
                  : item
              ));
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RankingTable;