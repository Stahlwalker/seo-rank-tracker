import React, { useState } from 'react';
import { Plus, Upload, Download, RefreshCw, Calendar } from 'lucide-react';
import AddUrlForm from './AddUrlForm';
import ImportModal from './ImportModal';
import { UrlKeywordPair } from '../types';
import GoogleSearchModal from './GoogleSearchModal';

interface ActionBarProps {
  onRefresh: () => Promise<void>;
  onExport: () => void;
  onMonthlyUpdate: () => Promise<void>;
  data: UrlKeywordPair[];
  onAddUrl: (newPair: UrlKeywordPair) => Promise<void>;
  onImport: (importedData: UrlKeywordPair[]) => Promise<void>;
  isAdmin: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onRefresh,
  onExport,
  onMonthlyUpdate,
  data,
  onAddUrl,
  onImport,
  isAdmin
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (!isAdmin) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMonthlyUpdate = async () => {
    if (!isAdmin) return;

    setIsUpdating(true);
    try {
      await onMonthlyUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as UrlKeywordPair[];
        onImport(importedData);
        setImportError(null);
      } catch (error) {
        console.error('Error parsing imported file:', error);
        setImportError('Invalid file format. Please import a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="dark-card rounded-lg shadow-lg border">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md hover:from-green-600 hover:to-emerald-700 flex items-center justify-center sm:justify-start"
            >
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Add URL</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center sm:justify-start"
            >
              <Upload className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Import URLs</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isAdmin && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`px-3 py-1 text-sm rounded-md flex items-center ${isRefreshing
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-900/50 text-blue-200 hover:bg-blue-800'
                    }`}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Rankings
                </button>

                <button
                  onClick={handleMonthlyUpdate}
                  disabled={isUpdating}
                  className={`px-3 py-1 text-sm rounded-md flex items-center ${isUpdating
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-green-900/50 text-green-200 hover:bg-green-800'
                    }`}
                >
                  <Calendar className={`h-4 w-4 mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
                  Monthly Update
                </button>
              </>
            )}

            <button
              onClick={onExport}
              disabled={!data || data.length === 0}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-md flex items-center justify-center sm:justify-start ${!data || data.length === 0
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
                }`}
            >
              <Download className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <AddUrlForm
              onAdd={onAddUrl}
              onClose={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <ImportModal
              onImport={(data) => {
                onImport(data);
                setShowImportModal(false);
              }}
              onClose={() => setShowImportModal(false)}
            />
          </div>
        </div>
      )}

      {importError && (
        <div className="text-red-500 text-sm">{importError}</div>
      )}

      {showAddForm && (
        <GoogleSearchModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onAdd={onAddUrl}
        />
      )}
    </div>
  );
};

export default ActionBar;