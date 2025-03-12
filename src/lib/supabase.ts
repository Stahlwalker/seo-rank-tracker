import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please ensure both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// Create and export the Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Initialize connection test
let connectionTested = false;
let connectionError: Error | null = null;

// Test the connection and cache the result
export const testConnection = async () => {
  if (connectionTested) {
    if (connectionError) {
      throw connectionError;
    }
    return;
  }

  try {
    // First check if we can connect at all
    const { error: healthError } = await supabase.from('url_keyword_pairs').select('count').limit(0);

    if (healthError) {
      if (healthError.message.includes('Invalid API key')) {
        connectionError = new Error(
          'Invalid Supabase API key. Please check your VITE_SUPABASE_ANON_KEY environment variable.'
        );
      } else if (healthError.message.includes('JWT')) {
        connectionError = new Error(
          'Authentication error. Please check your Supabase configuration and ensure you are using the correct API key.'
        );
      } else {
        connectionError = new Error(
          `Failed to connect to Supabase: ${healthError.message}. Please check your configuration.`
        );
      }
      throw connectionError;
    }

    // If we get here, the connection is working
    connectionTested = true;
  } catch (error) {
    // Handle network errors or other unexpected issues
    connectionError = error instanceof Error
      ? error
      : new Error('Failed to connect to Supabase. Please check your configuration.');

    console.error('Supabase connection error:', error);
    throw connectionError;
  }
};