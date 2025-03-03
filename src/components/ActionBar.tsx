import React, { useState } from 'react';
import { Plus, Upload, Download, RefreshCw } from 'lucide-react';
import AddUrlForm from './AddUrlForm';
import ImportModal from './ImportModal';
import { UrlKeywordPair } from '../types';

interface ActionBarProps {
  onAddUrl: (newPair: UrlKeywordPair) => void;
  onImport: (data: UrlKeywordPair[]) => void;
  onExport: () => void;
  onRefresh: () => void;
  data: UrlKeywordPair[];
}

const ActionBar: React.FC<ActionBarProps> = ({ 
  onAddUrl, 
  onImport, 
  onExport,
  onRefresh,
  data 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex space-x-2 mb-2 sm:mb-0">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add URL
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            title="Simulate refreshing current rankings"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Rankings
          </button>
          
          <button
            onClick={onExport}
            disabled={data.length === 0}
            className={`px-4 py-2 rounded-md flex items-center ${
              data.length === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </button>
        </div>
      </div>
      
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <AddUrlForm 
              onAdd={(newPair) => {
                onAddUrl(newPair);
                setShowAddForm(false);
              }}
              onClose={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
      
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <ImportModal
              onImport={onImport}
              onClose={() => setShowImportModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionBar;