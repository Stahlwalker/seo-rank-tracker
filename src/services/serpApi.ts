import axios from 'axios';
import { GoogleSearchResponse, GoogleSearchResult } from '../types';

// SERP API integration for real Google search results
// You'll need to sign up at https://serpapi.com/ to get an API key

// Replace with your actual API key from SERP API
const SERP_API_KEY = 'your_serpapi_key_here';

export const fetchGoogleRankings = async (keyword: string, targetUrl: string): Promise<GoogleSearchResponse> => {
  try {
    // Extract domain from URL for easier matching
    const targetDomain = new URL(targetUrl).hostname;
    
    // For demo purposes, simulate the API call
    // In production, uncomment the real API call below
    
    // Simulated response for development without API key
    return simulateSearchResults(keyword, targetUrl, targetDomain);
    
    /* Real API call - uncomment and use in production
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: SERP_API_KEY,
        q: keyword,
        engine: 'google',
        num: 100, // Get up to 100 results to find the target URL
        gl: 'us', // Country (US by default, can be changed)
        hl: 'en'  // Language
      }
    });
    
    // Process the SERP API response
    const organicResults = response.data.organic_results || [];
    const results: GoogleSearchResult[] = [];
    let targetPosition: number | null = null;
    
    // Process each organic result
    organicResults.forEach((result: any, index: number) => {
      const position = index + 1;
      const link = result.link;
      
      // Check if this result matches our target domain
      const resultDomain = new URL(link).hostname;
      const isTarget = resultDomain.includes(targetDomain) || targetDomain.includes(resultDomain);
      
      // If this is our target URL and we haven't found it yet, record the position
      if (isTarget && targetPosition === null) {
        targetPosition = position;
      }
      
      // Only include the first 10 results in our display
      if (position <= 10) {
        results.push({
          position,
          title: result.title,
          link: result.link,
          snippet: result.snippet || ''
        });
      }
    });
    
    return {
      keyword,
      results,
      totalResults: response.data.search_information?.total_results || 0,
      targetPosition
    };
    */
  } catch (error) {
    console.error('Error fetching Google rankings from SERP API:', error);
    throw new Error('Failed to fetch Google rankings. Please check your API key and try again.');
  }
};

// Simulation function for development without API key
const simulateSearchResults = (keyword: string, targetUrl: string, targetDomain: string): GoogleSearchResponse => {
  // Determine if and where the target domain should appear
  let targetPosition: number | null = null;
  
  // 80% chance the domain appears in the results
  if (Math.random() < 0.8) {
    // Position is weighted towards the top but can be anywhere in top 30
    const weights = [
      15, 12, 10, 8, 7, // Positions 1-5
      6, 5, 5, 4, 4,    // Positions 6-10
      3, 3, 3, 2, 2,    // Positions 11-15
      2, 1, 1, 1, 1,    // Positions 16-20
      1, 1, 1, 1, 1,    // Positions 21-25
      1, 1, 1, 1, 1     // Positions 26-30
    ];
    
    // Select a position based on weights
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        targetPosition = i + 1;
        break;
      }
    }
  }
  
  // Generate 10 search results
  const results: GoogleSearchResult[] = [];
  for (let i = 1; i <= 10; i++) {
    const isTargetDomain = i === targetPosition;
    
    if (isTargetDomain) {
      // This is our target domain
      results.push({
        position: i,
        title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - ${targetDomain}`,
        link: targetUrl + '/' + keyword.replace(/\s+/g, '-').toLowerCase(),
        snippet: `Find the best information about ${keyword} on our website. We provide comprehensive guides, tips, and resources related to ${keyword} for all your needs.`
      });
    } else {
      // Generate a random competitor result
      const competitorDomain = generateRandomDomain(targetDomain);
      results.push({
        position: i,
        title: generateRandomTitle(keyword, competitorDomain),
        link: `https://${competitorDomain}/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
        snippet: generateRandomSnippet(keyword)
      });
    }
  }
  
  return {
    keyword,
    results,
    totalResults: 100 + Math.floor(Math.random() * 900),
    targetPosition
  };
};

// Helper function to generate a random domain name
const generateRandomDomain = (excludeDomain: string): string => {
  const topDomains = ['example.com', 'competitor.com', 'industry-leader.com', 'best-info.com', 'top-results.com'];
  let domain;
  
  do {
    domain = topDomains[Math.floor(Math.random() * topDomains.length)];
  } while (domain.includes(excludeDomain));
  
  return domain;
};

// Helper function to generate a random title
const generateRandomTitle = (keyword: string, domain: string): string => {
  const prefixes = ['Ultimate Guide to', 'Everything About', 'Complete Resource for', 'Top 10', 'Best Practices for'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  return `${prefix} ${keyword} | ${domain}`;
};

// Helper function to generate a random snippet
const generateRandomSnippet = (keyword: string): string => {
  const snippets = [
    `Discover everything you need to know about ${keyword}. Our comprehensive guide covers all aspects and provides expert insights.`,
    `Looking for information on ${keyword}? We've compiled the most complete resource with tips, tricks, and best practices.`,
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} experts share their knowledge. Learn from the best and improve your understanding.`,
    `The definitive guide to ${keyword}. We break down complex topics into easy-to-understand information.`,
    `Explore our in-depth analysis of ${keyword}. Updated regularly with the latest information and research.`
  ];
  
  return snippets[Math.floor(Math.random() * snippets.length)];
};