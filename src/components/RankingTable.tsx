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
import { ArrowUpDown, Trash2, ExternalLink, Filter, Search, X, Edit, Save, XCircle, AlertTriangle, CheckCircle2, RefreshCw, Check, Undo2 } from 'lucide-react';
import { UrlKeywordPair } from '../types';
import { format } from 'date-fns';
import GoogleSearchModal from './GoogleSearchModal';
import { deleteUrlKeywordPair, updateUrlKeywordPair, bulkAddRankingHistory, addUrlKeywordPair } from '../services/supabaseService';
import { useOutletContext } from 'react-router-dom';

interface RouteContext {
  data: UrlKeywordPair[];
  setData: React.Dispatch<React.SetStateAction<UrlKeywordPair[]>>;
  isLoading: boolean;
}

interface EditingCell {
  id: string;
  field: 'url' | 'keyword' | 'monthlySearchVolume' | string;
  value: string;
  month?: string;
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
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [recentlyDeleted, setRecentlyDeleted] = useState<UrlKeywordPair[]>([]);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

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

  const handleRestore = async (item: UrlKeywordPair) => {
    try {
      const restoredItem = await addUrlKeywordPair(item);
      if (restoredItem) {
        setData(prevData => [...prevData, restoredItem]);
        setRecentlyDeleted(prev => prev.filter(i => i.id !== item.id));
        setError(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to restore item');
      console.error('Error restoring item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingIds(prev => new Set([...prev, id]));
      setError(null);

      const itemToDelete = data.find(item => item.id === id);
      if (!itemToDelete) return;

      await deleteUrlKeywordPair(id);

      setRecentlyDeleted(prev => [itemToDelete, ...prev].slice(0, 5));
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

  const handleStartEditing = (id: string, field: 'url' | 'keyword' | 'monthlySearchVolume' | string, value: string, month?: string) => {
    setEditingCell({ id, field, value, month });
  };

  const handleCancelEditing = () => {
    setEditingCell(null);
  };

  const handleSaveEditing = async () => {
    if (!editingCell) return;

    try {
      const item = data.find((item: UrlKeywordPair) => item.id === editingCell.id);
      if (!item) return;

      const updatedItem: UrlKeywordPair = { ...item };

      if (editingCell.field === 'monthlySearchVolume') {
        const value = parseInt(editingCell.value);
        if (isNaN(value) || value < 0) {
          setError('Monthly search volume must be a non-negative number');
          return;
        }
        updatedItem.monthlySearchVolume = value;
      } else if (editingCell.field.startsWith('month-') && editingCell.month) {
        const value = parseInt(editingCell.value);
        if (isNaN(value) || value < 0) {
          setError('Ranking must be a positive number');
          return;
        }

        const monthlyEntries = [{
          urlKeywordId: item.id,
          month: editingCell.month,
          position: value
        }];

        await bulkAddRankingHistory(monthlyEntries);

        updatedItem.rankingHistory = [
          ...item.rankingHistory.filter(h => h.month !== editingCell.month),
          { month: editingCell.month, position: value }
        ];

        setData((prevData: UrlKeywordPair[]) => prevData.map((i: UrlKeywordPair) =>
          i.id === item.id ? updatedItem : i
        ));
        setEditingCell(null);
        setError(null);
        return;
      } else if (editingCell.field === 'url' || editingCell.field === 'keyword') {
        updatedItem[editingCell.field] = editingCell.value;
      }

      updatedItem.lastUpdated = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

      const result = await updateUrlKeywordPair(updatedItem);
      if (result) {
        setData((prevData: UrlKeywordPair[]) => prevData.map((i: UrlKeywordPair) =>
          i.id === editingCell.id ? result : i
        ));
        setEditingCell(null);
        setError(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update field');
      console.error('Error updating field:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const selectedIds = Array.from(selectedRows);
      setDeletingIds(new Set(selectedIds));
      setError(null);

      const itemsToDelete = data.filter(item => selectedIds.includes(item.id));

      for (const id of selectedIds) {
        await deleteUrlKeywordPair(id);
      }

      setRecentlyDeleted(prev => [...itemsToDelete, ...prev].slice(0, 5));
      setData(prevData => prevData.filter(item => !selectedIds.includes(item.id)));
      setSelectedRows(new Set());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete selected items');
      console.error('Error deleting items:', error);
    } finally {
      setDeletingIds(new Set());
    }
  };

  const columns = [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => {
        const filteredRows = table.getFilteredRowModel().rows;
        const allSelected = filteredRows.length > 0 && filteredRows.every(row => selectedRows.has(row.original.id));
        const someSelected = filteredRows.some(row => selectedRows.has(row.original.id)) && !allSelected;

        return (
          <div className="px-1">
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${allSelected
                ? 'bg-blue-600 border-blue-600'
                : someSelected
                  ? 'bg-blue-300 border-blue-300'
                  : 'border-gray-300 hover:border-blue-400'
                }`}
              onClick={() => {
                if (allSelected) {
                  setSelectedRows(prev => {
                    const next = new Set(prev);
                    filteredRows.forEach(row => next.delete(row.original.id));
                    return next;
                  });
                } else {
                  setSelectedRows(prev => {
                    const next = new Set(prev);
                    filteredRows.forEach(row => next.add(row.original.id));
                    return next;
                  });
                }
              }}
            >
              {allSelected && <Check className="h-3 w-3 text-white" />}
              {someSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
            </div>
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="px-1">
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${selectedRows.has(row.original.id)
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300 hover:border-blue-400'
              }`}
            onClick={() => {
              setSelectedRows(prev => {
                const next = new Set(prev);
                if (next.has(row.original.id)) {
                  next.delete(row.original.id);
                } else {
                  next.add(row.original.id);
                }
                return next;
              });
            }}
          >
            {selectedRows.has(row.original.id) && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('url', {
      header: 'URL',
      cell: info => {
        const isEditing = editingCell?.id === info.row.original.id && editingCell.field === 'url';

        return isEditing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={editingCell.value}
              onChange={e => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveEditing();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEditing();
                }
              }}
              onBlur={() => handleSaveEditing()}
              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSaveEditing}
              className="p-1 text-green-600 hover:text-green-800"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelEditing}
              className="p-1 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center max-w-full group">
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
            <button
              type="button"
              onClick={() => handleStartEditing(info.row.original.id, 'url', info.getValue())}
              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-3 w-3" />
            </button>
          </div>
        );
      },
    }),
    columnHelper.accessor('keyword', {
      header: 'Keyword',
      cell: info => {
        const isEditing = editingCell?.id === info.row.original.id && editingCell.field === 'keyword';

        return isEditing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={editingCell.value}
              onChange={e => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveEditing();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEditing();
                }
              }}
              onBlur={() => handleSaveEditing()}
              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSaveEditing}
              className="p-1 text-green-600 hover:text-green-800"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelEditing}
              className="p-1 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center group">
            <span>{info.getValue()}</span>
            <button
              type="button"
              onClick={() => handleStartEditing(info.row.original.id, 'keyword', info.getValue())}
              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-3 w-3" />
            </button>
          </div>
        );
      },
    }),
    columnHelper.accessor('monthlySearchVolume', {
      header: 'Monthly Search Volume',
      cell: info => {
        const isEditing = editingCell?.id === info.row.original.id && editingCell.field === 'monthlySearchVolume';
        const value = info.getValue();

        return isEditing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="number"
              value={editingCell.value}
              onChange={e => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveEditing();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEditing();
                }
              }}
              onBlur={() => handleSaveEditing()}
              className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSaveEditing}
              className="p-1 text-green-600 hover:text-green-800"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelEditing}
              className="p-1 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center group">
            <span className="font-medium">
              {value !== undefined && value !== null ? value.toLocaleString() : '-'}
            </span>
            <button
              type="button"
              onClick={() => handleStartEditing(info.row.original.id, 'monthlySearchVolume', value?.toString() || '0')}
              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-3 w-3" />
            </button>
          </div>
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
          const isEditing = editingCell?.id === info.row.original.id && editingCell.month === month;

          if (isEditing) {
            return (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="number"
                  value={editingCell.value}
                  min="0"
                  onChange={e => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveEditing();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelEditing();
                    }
                  }}
                  onBlur={() => handleSaveEditing()}
                  className="w-20 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveEditing}
                  className="p-1 text-green-600 hover:text-green-800"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          }

          return (
            <div className="flex items-center group">
              <span className={`font-medium ${value !== null ? value <= 10 ? 'text-green-600' :
                value <= 20 ? 'text-yellow-600' :
                  'text-red-600'
                : 'text-gray-400'}`}>
                {value !== null ? value : '-'}
              </span>
              <button
                type="button"
                onClick={() => handleStartEditing(info.row.original.id, `month-${month}`, value?.toString() || '0', month)}
                className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              >
                <Edit className="h-3 w-3" />
              </button>
            </div>
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
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-2 text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 space-y-4">
          {recentlyDeleted.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-700">
                <Undo2 className="h-4 w-4" />
                <span>Recently deleted: {recentlyDeleted.length} item(s)</span>
              </div>
              <div className="flex items-center space-x-2">
                {recentlyDeleted.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => handleRestore(item)}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md flex items-center space-x-1"
                  >
                    <span className="truncate max-w-[200px]">Restore "{item.keyword}"</span>
                  </button>
                ))}
                <button
                  onClick={() => setRecentlyDeleted([])}
                  className="p-1 hover:bg-blue-200 rounded-md"
                  title="Clear undo history"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {selectedRows.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedRows.size} {selectedRows.size === 1 ? 'item' : 'items'} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={deletingIds.size > 0}
                    className={`px-3 py-1 text-sm rounded-md flex items-center ${deletingIds.size > 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                  >
                    <Trash2 className={`h-3 w-3 mr-1 ${deletingIds.size > 0 ? 'animate-pulse' : ''}`} />
                    Delete Selected
                  </button>
                </div>
              )}
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

          <div className="relative">
            <div className="overflow-x-auto shadow-sm max-h-[70vh] border border-gray-200 rounded-lg">
              <div className="inline-block min-w-full align-middle">
                <div className="relative">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        {/* Fixed columns */}
                        <th
                          className="px-3 sm:px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-0 z-20 bg-gray-50 border-r border-gray-200"
                          style={{ minWidth: '200px' }}
                        >
                          <div className="cursor-pointer select-none flex items-center" onClick={table.getColumn('url')?.getToggleSortingHandler()}>
                            URL
                            <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
                          </div>
                        </th>
                        <th
                          className="px-3 sm:px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-[200px] z-20 bg-gray-50 border-r border-gray-200"
                          style={{ minWidth: '150px' }}
                        >
                          <div className="cursor-pointer select-none flex items-center" onClick={table.getColumn('keyword')?.getToggleSortingHandler()}>
                            Keyword
                            <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
                          </div>
                        </th>
                        <th
                          className="px-3 sm:px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sticky left-[350px] z-20 bg-gray-50 border-r border-gray-200"
                          style={{ minWidth: '150px' }}
                        >
                          <div className="cursor-pointer select-none flex items-center" onClick={table.getColumn('monthlySearchVolume')?.getToggleSortingHandler()}>
                            Monthly Search Volume
                            <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
                          </div>
                        </th>
                        {/* Scrollable columns */}
                        {table.getFlatHeaders().slice(4).map(header => (
                          <th
                            key={header.id}
                            scope="col"
                            className="px-3 sm:px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50"
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
                            {/* Fixed columns */}
                            <td
                              className="px-3 sm:px-6 py-2 text-sm text-gray-500 truncate sticky left-0 bg-white border-r border-gray-200"
                              style={{ minWidth: '200px' }}
                            >
                              <div className="truncate">
                                {flexRender(row.getVisibleCells()[1].column.columnDef.cell, row.getVisibleCells()[1].getContext())}
                              </div>
                            </td>
                            <td
                              className="px-3 sm:px-6 py-2 text-sm text-gray-500 truncate sticky left-[200px] bg-white border-r border-gray-200"
                              style={{ minWidth: '150px' }}
                            >
                              <div className="truncate">
                                {flexRender(row.getVisibleCells()[2].column.columnDef.cell, row.getVisibleCells()[2].getContext())}
                              </div>
                            </td>
                            <td
                              className="px-3 sm:px-6 py-2 text-sm text-gray-500 truncate sticky left-[350px] bg-white border-r border-gray-200"
                              style={{ minWidth: '150px' }}
                            >
                              <div className="truncate">
                                {flexRender(row.getVisibleCells()[3].column.columnDef.cell, row.getVisibleCells()[3].getContext())}
                              </div>
                            </td>
                            {/* Scrollable columns */}
                            {row.getVisibleCells().slice(4).map(cell => (
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
      </div>
    </div>
  );
};

export default RankingTable;