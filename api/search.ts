import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // Only allow GET requests
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { q, engine = 'google', num = 100 } = request.query;

    if (!q) {
        return response.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) {
        return response.status(500).json({ error: 'SERP API key is not configured' });
    }

    try {
        const searchUrl = new URL('https://serpapi.com/search');
        searchUrl.searchParams.append('api_key', apiKey);
        searchUrl.searchParams.append('q', q as string);
        searchUrl.searchParams.append('engine', engine as string);
        searchUrl.searchParams.append('num', num as string);

        const serpResponse = await fetch(searchUrl.toString());
        const data = await serpResponse.json();

        return response.status(200).json(data);
    } catch (error) {
        console.error('Error fetching from SERP API:', error);
        return response.status(500).json({
            error: 'Failed to fetch search results',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 