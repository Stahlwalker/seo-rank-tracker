import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Lazy load components
const App = lazy(() => import('./App'));
const RankingTable = lazy(() => import('./components/RankingTable'));
const RankingChart = lazy(() => import('./components/RankingChart'));

// Loading fallback
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
);

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <Suspense fallback={<LoadingFallback />}>
                <App />
            </Suspense>
        ),
        children: [
            {
                path: '/',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <RankingTable />
                    </Suspense>
                ),
            },
            {
                path: '/chart',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <RankingChart />
                    </Suspense>
                ),
            },
        ],
    },
]); 