import React from 'react';
import { LineChart, BarChart, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ShareButton from './ShareButton';

interface HeaderProps {
  activeView: 'table' | 'chart';
  setActiveView: (view: 'table' | 'chart') => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const { isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">SEO Rank Tracker</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-300 text-sm">
              <User className="h-4 w-4 mr-1" />
              {isAdmin ? 'Admin' : 'Read Only'}
            </div>

            <div className="flex space-x-1">
              <button
                onClick={() => setActiveView('table')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md transition-all duration-200 ${activeView === 'table'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                  : 'hover:bg-gray-800 text-gray-300'
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
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                  : 'hover:bg-gray-800 text-gray-300'
                  }`}
              >
                <div className="flex items-center justify-center sm:justify-start">
                  <LineChart className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Chart View</span>
                </div>
              </button>
            </div>

            <ShareButton />

            <button
              onClick={handleLogout}
              className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;