import axios from 'axios';
import { GoogleSearchResponse, GoogleSearchResult } from '../types';

// This is a simulated API service since real Google Search API requires credentials
// and is not free to use. In a production environment, you would use a real API service.

const SIMULATED_DELAY = 1500; // ms

export const fetchGoogleRankings = async (keyword: string, domain: string): Promise<GoogleSearchResponse> => {
  try {
    // In a real implementation, you would call an actual API endpoint
    // For example:
    // const response = await axios.get('https://api.example.com/search', {
    //   params: { keyword, domain },
    //   headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
    // });
    
    // For demonstration, we'll simulate a response with a delay
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
    
    // Generate simulated search results
    const results: GoogleSearchResult[] = generateSimulatedResults(keyword, domain);
    
    return {
      keyword,
      results,
      totalResults: 100 + Math.floor(Math.random() * 900)
    };
  } catch (error) {
    console.error('Error fetching Google rankings:', error);
    throw new Error('Failed to fetch Google rankings');
  }
};

// Helper function to generate simulated search results
const generateSimulatedResults = (keyword: string, domain: string): GoogleSearchResult[] => {
  const results: GoogleSearchResult[] = [];
  const domainWithoutProtocol = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
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
  for (let i = 1; i <= 10; i++) {
    const isTargetDomain = i === targetPosition;
    
    if (isTargetDomain) {
      // This is our target domain
      results.push({
        position: i,
        title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - ${domainWithoutProtocol}`,
        link: domain + '/' + keyword.replace(/\s+/g, '-').toLowerCase(),
        snippet: `Find the best information about ${keyword} on our website. We provide comprehensive guides, tips, and resources related to ${keyword} for all your needs.`
      });
    } else {
      // Generate a random competitor result
      const competitorDomain = generateRandomDomain(domainWithoutProtocol);
      results.push({
        position: i,
        title: generateRandomTitle(keyword, competitorDomain),
        link: `https://${competitorDomain}/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
        snippet: generateRandomSnippet(keyword)
      });
    }
  }
  
  return results;
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