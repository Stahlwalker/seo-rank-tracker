import React, { useState, useRef } from 'react';
import { Upload, Download, X, FileText } from 'lucide-react';
import { parseCSV, generateCsvTemplate } from '../utils/csvParser';
import { UrlKeywordPair } from '../types';
import { addUrlKeywordPair } from '../services/supabaseService';

interface ImportModalProps {
  onImport: (data: UrlKeywordPair[]) => void;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{total: number, added: number, duplicates: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setImportStats(null);
    }
  };
  
  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setImportStats(null);
    
    try {
      const importedData = await parseCSV(file);
      
      // Add each URL/keyword pair to the database
      const results = await Promise.all(
        importedData.map(pair => addUrlKeywordPair(pair))
      );
      
      // Filter out failed imports (null results)
      const successfulImports = results.filter((result): result is UrlKeywordPair => result !== null);
      
      // Set import statistics
      setImportStats({
        total: importedData.length,
        added: successfulImports.length,
        duplicates: importedData.length - successfulImports.length
      });
      
      if (successfulImports.length === 0) {
        setError('No new items were imported. They may already exist in the database.');
        setIsLoading(false);
        return;
      }
      
      // Update state via parent component
      onImport(successfulImports);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadTemplate = () => {
    const csvContent = generateCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'seo-rank-tracker-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col max-h-[90vh]">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Import URLs</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto flex-1">
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Upload a CSV file with your URLs and keywords. The file should have the following columns: 
            <code className="bg-gray-100 px-2 py-1 rounded mx-1">url</code>, 
            <code className="bg-gray-100 px-2 py-1 rounded mx-1">keyword</code>, and optionally 
            <code className="bg-gray-100 px-2 py-1 rounded mx-1">currentRanking</code>,
            <code className="bg-gray-100 px-2 py-1 rounded mx-1">status</code>, and
            <code className="bg-gray-100 px-2 py-1 rounded mx-1">note</code>.
          </p>
          
          <button
            onClick={downloadTemplate}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm mb-4"
          >
            <Download className="h-4 w-4 mr-1" />
            Download CSV template
          </button>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            
            {file ? (
              <div className="flex items-center justify-center text-gray-700">
                <FileText className="h-4 w-4 mr-2" />
                <span>{file.name}</span>
              </div>
            ) : (
              <p className="text-gray-500">
                Click to select or drag and drop a CSV file
              </p>
            )}
          </div>
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          
          {importStats && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Import Summary</h3>
              <ul className="text-sm text-blue-700">
                <li>Total records in file: {importStats.total}</li>
                <li>New records added: {importStats.added}</li>
                <li>Duplicate records skipped: {importStats.duplicates}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end">
          {importStats ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!file || isLoading}
                className={`px-4 py-2 rounded-md text-white flex items-center ${
                  !file || isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;