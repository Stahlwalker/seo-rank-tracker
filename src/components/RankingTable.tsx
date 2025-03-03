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
import { ArrowUpDown, Trash2, ExternalLink, Filter, Search, X, Edit, Save, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { UrlKeywordPair } from '../types';
import { format, parseISO, isValid } from 'date-fns';

interface RankingTableProps {
  data: UrlKeywordPair[];
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string | undefined) => void;
  onUpdateStatus: (id: string, status: 'Testing' | 'Needs Improvement' | '') => void;
}

const RankingTable: React.FC<RankingTableProps> = ({ data, onDelete, onUpdateNote, onUpdateStatus }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
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
  
  const columns = [
    columnHelper.accessor('url', {
      header: 'URL',
      cell: info => (
        <div className="flex items-center">
          <a 
            href={info.getValue()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
          >
            {info.getValue().replace(/^https?:\/\//, '').substring(0, 30)}
            {info.getValue().replace(/^https?:\/\//, '').length > 30 ? '...' : ''}
            <ExternalLink className="h-3 w-3 ml-1" />
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
            <span className={`font-medium ${value <= 10 ? 'text-green-600' : value <= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
              {value}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      })
    ),
    columnHelper.accessor('currentRanking', {
      header: 'Current Ranking',
      cell: info => {
        const value = info.getValue();
        return value !== null ? (
          <span className={`font-medium ${value <= 10 ? 'text-green-600' : value <= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
            {value}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const id = info.row.original.id;
        const value = info.getValue();
        
        return (
          <div className="flex items-center">
            <select
              value={value || ''}
              onChange={(e) => onUpdateStatus(id, e.target.value as 'Testing' | 'Needs Improvement' | '')}
              className={`px-2 py-1 text-sm rounded-md border ${
                value === 'Testing' 
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
                    onUpdateNote(id, noteText || undefined);
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
                // Focus the textarea after rendering
                setTimeout(() => {
                  noteInputRef.current?.focus();
                }, 0);
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
      cell: info => (
        <button
          onClick={() => onDelete(info.row.original.id)}
          className="text-red-500 hover:text-red-700 p-1"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
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
  
  return (
    <div>
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div className="flex flex-wrap gap-2 mb-2 md:mb-0">
            <button
              onClick={() => toggleFilter('top10')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                activeFilters.includes('top10')
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              Top 10
            </button>
            <button
              onClick={() => toggleFilter('top20')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                activeFilters.includes('top20')
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              11-20
            </button>
            <button
              onClick={() => toggleFilter('top30')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                activeFilters.includes('top30')
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              21-30
            </button>
            <button
              onClick={() => toggleFilter('below30')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                activeFilters.includes('below30')
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
          <div className="relative w-full md:w-64">
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
        
        {(activeFilters.length > 0 || searchTerm) && (
          <div className="flex items-center text-sm text-gray-600 mt-2">
            <span className="mr-2">Active filters:</span>
            <div className="flex flex-wrap gap-1">
              {activeFilters.map(filter => (
                <span key={filter} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full flex items-center">
                  {filter === 'top10' && 'Top 10'}
                  {filter === 'top20' && 'Positions 11-20'}
                  {filter === 'top30' && 'Positions 21-30'}
                  {filter === 'below30' && 'Below 30'}
                  <button 
                    onClick={() => toggleFilter(filter)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {searchTerm && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full flex items-center">
                  Search: {searchTerm}
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  {activeFilters.length > 0 || searchTerm 
                    ? 'No data matches your filter criteria. Try adjusting your filters.'
                    : 'No data available. Add URLs to start tracking.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {table.getRowModel().rows.length} of {data.length} URLs
          </div>
          <div className="text-sm text-gray-500">
            {activeFilters.length > 0 && (
              <span className="text-blue-600 font-medium">
                Filtered by: {activeFilters.map(f => {
                  if (f === 'top10') return 'Top 10';
                  if (f === 'top20') return 'Positions 11-20';
                  if (f === 'top30') return 'Positions 21-30';
                  if (f === 'below30') return 'Below 30';
                  return f;
                }).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingTable;