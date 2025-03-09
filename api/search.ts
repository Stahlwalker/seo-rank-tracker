import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';

// Initialize CORS middleware
const corsMiddleware = cors({
    methods: ['GET'],
    origin: '*' // You might want to restrict this in production
});

// Wrap middleware to work with Vercel
const runMiddleware = (
    req: VercelRequest,
    res: VercelResponse,
    fn: ReturnType<typeof cors>
): Promise<void> => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: Error | unknown) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve();
        });
    });
};

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    try {
        // Run CORS middleware
        await runMiddleware(request, response, corsMiddleware);

        // Only allow GET requests
        if (request.method !== 'GET') {
            return response.status(405).json({ error: 'Method not allowed' });
        }

        const { q, engine = 'google', num = 100 } = request.query;

        if (!q) {
            return response.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const apiKey = process.env.SERP_API_KEY || process.env.VITE_SERP_API_KEY;
        if (!apiKey) {
            return response.status(500).json({ error: 'SERP API key is not configured' });
        }

        const searchUrl = new URL('https://serpapi.com/search');
        searchUrl.searchParams.append('api_key', apiKey);
        searchUrl.searchParams.append('q', q as string);
        searchUrl.searchParams.append('engine', engine as string);
        searchUrl.searchParams.append('num', num as string);

        const serpResponse = await fetch(searchUrl.toString());

        if (!serpResponse.ok) {
            const errorData = await serpResponse.json().catch(() => null);
            throw new Error(
                errorData?.error || `SERP API responded with status ${serpResponse.status}`
            );
        }

        const data = await serpResponse.json();
        return response.status(200).json(data);
    } catch (error) {
        console.error('Error in search API:', error);
        return response.status(500).json({
            error: 'Failed to fetch search results',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 