import React from 'react';
import { LineChart, BarChart } from 'lucide-react';

interface HeaderProps {
  activeView: 'table' | 'chart';
  setActiveView: (view: 'table' | 'chart') => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient animate-gradient-x"></div>
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg shadow-lg animate-float">
              <LineChart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold ml-3 gradient-text">
              SEO Rank Tracker
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="glass-panel rounded-lg p-1">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveView('table')}
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${
                    activeView === 'table' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                      : 'hover:bg-white/50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center">
                    <BarChart className="h-4 w-4 mr-2" />
                    Table View
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveView('chart')}
                  className={`px-4 py-2 rounded-md transition-all duration-200 ${
                    activeView === 'chart' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                      : 'hover:bg-white/50 text-slate-700'
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
        </div>
      </div>
    </header>
  );
};

export default Header;