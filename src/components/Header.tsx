import React from 'react';
import { LineChart, BarChart } from 'lucide-react';

interface HeaderProps {
  activeView: 'table' | 'chart';
  setActiveView: (view: 'table' | 'chart') => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-[95%] xl:max-w-[90%] 2xl:max-w-[85%]">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              SEO Rank Tracker
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Track your keyword rankings over time
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <div className="glass-panel rounded-lg p-1 max-w-sm mx-auto sm:max-w-none">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveView('table')}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md transition-all duration-200 ${activeView === 'table'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'hover:bg-white/50 text-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-center sm:justify-start">
                    <BarChart className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Table View</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveView('chart')}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md transition-all duration-200 ${activeView === 'chart'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'hover:bg-white/50 text-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-center sm:justify-start">
                    <LineChart className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Chart View</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;