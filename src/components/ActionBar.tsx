import React, { useState } from 'react';
import { Plus, Upload, Download, RefreshCw, Calendar } from 'lucide-react';
import AddUrlForm from './AddUrlForm';
import ImportModal from './ImportModal';
import { UrlKeywordPair } from '../types';

interface ActionBarProps {
  onRefresh: () => void;
  onExport: () => void;
  onMonthlyUpdate: () => void;
  data: UrlKeywordPair[];
  onAddUrl: (newPair: UrlKeywordPair) => void;
  onImport: (data: UrlKeywordPair[]) => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onRefresh,
  onExport,
  onMonthlyUpdate,
  data,
  onAddUrl,
  onImport
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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
            <button
              onClick={onRefresh}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center sm:justify-start"
              title="Refresh current rankings"
            >
              <RefreshCw className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Refresh Rankings</span>
            </button>

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

            <button
              onClick={onMonthlyUpdate}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-md hover:from-amber-600 hover:to-orange-700 flex items-center justify-center sm:justify-start"
              title="Simulate monthly update"
            >
              <Calendar className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Monthly Update</span>
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
    </div>
  );
};

export default ActionBar;