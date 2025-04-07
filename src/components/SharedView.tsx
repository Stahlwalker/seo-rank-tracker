import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { UrlKeywordPair } from '../types';
import RankingTable from './RankingTable';
import RankingChart from './RankingChart';
import { useSharedData } from '../context/SharedDataContext';
import { BarChart, LineChart } from 'lucide-react';

const SharedView: React.FC = () => {
    const { token, view = 'table' } = useParams<{ token: string; view: string }>();
    const { data, isLoading, error } = useSharedData();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-extrabold text-white">
                            Error Loading Data
                        </h2>
                        <p className="mt-2 text-sm text-gray-400">
                            {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <header className="bg-gray-900 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-white">SEO Rank Tracker - Shared View</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                to={`/shared/${token}/table`}
                                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${view === 'table'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                <BarChart className="h-4 w-4 mr-2" />
                                Table View
                            </Link>
                            <Link
                                to={`/shared/${token}/chart`}
                                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${view === 'chart'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                <LineChart className="h-4 w-4 mr-2" />
                                Chart View
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0 space-y-6">
                        {view === 'table' ? (
                            <RankingTable data={data} isLoading={isLoading} isAdmin={false} />
                        ) : (
                            <RankingChart data={data} isLoading={isLoading} isAdmin={false} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SharedView; 