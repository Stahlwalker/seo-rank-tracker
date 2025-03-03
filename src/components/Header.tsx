import React from 'react';
import { LineChart, BarChart } from 'lucide-react';

interface HeaderProps {
  activeView: 'table' | 'chart';
  setActiveView: (view: 'table' | 'chart') => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <LineChart className="h-8 w-8 mr-3" />
            <h1 className="text-2xl font-bold">SEO Rank Tracker</h1>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('table')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeView === 'table' 
                  ? 'bg-white text-indigo-700 font-medium' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Table View
              </div>
            </button>
            
            <button
              onClick={() => setActiveView('chart')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeView === 'chart' 
                  ? 'bg-white text-indigo-700 font-medium' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <div className="flex items-center">
                <LineChart className="h-4 w-4 mr-2" />
                Chart View
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;