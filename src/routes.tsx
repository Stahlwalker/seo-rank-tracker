import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SharedDataProvider } from './context/SharedDataContext';

// Lazy load components
const App = lazy(() => import('./App'));
const SharedView = lazy(() => import('./components/SharedView'));

// Loading fallback
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
);

// Error element
const ErrorElement = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-md w-full space-y-8">
            <div className="text-center">
                <h2 className="mt-6 text-3xl font-extrabold text-white">
                    Page Not Found
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                    The page you're looking for doesn't exist or you don't have permission to access it.
                </p>
                <div className="mt-6">
                    <a
                        href="/"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    </div>
);

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                    <App />
                </Suspense>
            </ErrorBoundary>
        ),
        errorElement: <ErrorElement />,
    },
    {
        path: '/shared/:token',
        element: (
            <ErrorBoundary>
                <SharedDataProvider>
                    <Suspense fallback={<LoadingFallback />}>
                        <SharedView />
                    </Suspense>
                </SharedDataProvider>
            </ErrorBoundary>
        ),
    },
    {
        path: '/shared/:token/:view',
        element: (
            <ErrorBoundary>
                <SharedDataProvider>
                    <Suspense fallback={<LoadingFallback />}>
                        <SharedView />
                    </Suspense>
                </SharedDataProvider>
            </ErrorBoundary>
        ),
    },
]); 