// Import the Supabase client constructor
import { createClient } from '@supabase/supabase-js';

// Get environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;        // Your project's hosted URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;  // Public API key

// Validate environment variables exist
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Create and export a single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
