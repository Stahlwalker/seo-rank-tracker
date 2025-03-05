import React, { useState, useEffect } from 'react';
import { X, Search, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { fetchGoogleRankings } from '../services/serpApi';
import { GoogleSearchResult, UrlKeywordPair } from '../types';
import { format } from 'date-fns';

interface GoogleSearchModalProps {
  urlKeywordPair: UrlKeywordPair;
  onClose: () => void;
  onUpdateRanking: (id: string, ranking: number) => void;
}

const GoogleSearchModal: React.FC<GoogleSearchModalProps> = ({ 
  urlKeywordPair, 
  onClose,
  onUpdateRanking
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GoogleSearchResult[]>([]);
  const [foundPosition, setFoundPosition] = useState<number | null>(null);
  
  const domain = new URL(urlKeywordPair.url).hostname;
  
  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchGoogleRankings(urlKeywordPair.keyword, urlKeywordPair.url);
      setResults(response.results);
      
      if (response.targetPosition) {
        setFoundPosition(response.targetPosition);
        onUpdateRanking(urlKeywordPair.id, response.targetPosition);
      } else {
        setFoundPosition(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch search results';
      setError(message);
      console.error('Error fetching rankings:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    handleSearch();
  }, []);
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Google Search Results</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex flex-col md:flex-row md:items-center mb-2">
          <div className="font-medium text-gray-700 mb-1 md:mb-0 md:mr-2">URL:</div>
          <a 
            href={urlKeywordPair.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
          >
            {urlKeywordPair.url}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="font-medium text-gray-700 mb-1 md:mb-0 md:mr-2">Keyword:</div>
          <div className="text-gray-800">{urlKeywordPair.keyword}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          {foundPosition !== null ? (
            <div className="flex items-center">
              <span className="font-medium mr-2">Current Ranking:</span>
              <span className={`font-bold ${
                foundPosition <= 10 ? 'text-green-600' : 
                foundPosition <= 20 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                Position {foundPosition}
              </span>
            </div>
          ) : results.length > 0 ? (
            <div className="flex items-center text-gray-600">
              <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
              Your URL was not found in the top 100 results
            </div>
          ) : null}
        </div>
        
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className={`px-3 py-1 rounded-md text-white flex items-center ${
            isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Results
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="overflow-y-auto flex-grow">
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => {
              const isOurDomain = result.link.includes(domain);
              
              return (
                <div 
                  key={result.position}
                  className={`p-3 rounded-lg ${
                    isOurDomain 
                      ? 'bg-green-50 border border-green-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`flex items-center justify-center h-6 w-6 rounded-full mr-3 text-xs font-medium ${
                      isOurDomain 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {result.position}
                    </div>
                    <div className="flex-1">
                      <a 
                        href={result.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center"
                      >
                        {result.title}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                      <div className="text-green-800 text-sm mb-1">
                        {result.link}
                      </div>
                      <p className="text-gray-600 text-sm">
                        {result.snippet}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !isLoading && !error ? (
          <div className="text-center py-8 text-gray-500">
            No results found. Try refreshing the search.
          </div>
        ) : null}
        
        {isLoading && results.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Searching Google for results...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-500 flex justify-between items-center">
        <div>
          {results.length > 0 && !isLoading && (
            <span>Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}</span>
          )}
        </div>
        <div>
          <span className="text-xs text-gray-400">
            Powered by SERP API
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoogleSearchModal;