import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { Auth } from './auth.js';
import { PoseDetector } from './poseDetection.js';
import { ExerciseDetector } from './exerciseDetection.js';
import { App } from './app.js';

// Initialize Supabase client
async function initializeSupabase() {
    try {
        if (!window.supabase) {
            console.error('Supabase client not loaded. Make sure the Supabase script is loaded first.');
            return false;
        }

        console.log('Initializing Supabase with:', {
            url: SUPABASE_URL ? 'URL present' : 'URL missing',
            key: SUPABASE_ANON_KEY ? 'Key present' : 'Key missing'
        });

        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
        return true;
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return false;
    }
}

// Initialize TensorFlow and PoseNet
async function initializeTF() {
    console.log('Starting initialization...');

    try {
        // Initialize Supabase first
        await initializeSupabase();

        // Ensure TensorFlow is loaded
        if (!window.tf) {
            throw new Error('TensorFlow not loaded');
        }
        console.log('✅ TensorFlow.js is ready');

        // Ensure PoseNet is loaded
        if (!window.posenet) {
            throw new Error('PoseNet not loaded');
        }
        console.log('✅ PoseNet library is ready');

        // Initialize the application
        console.log('Initializing application...');
        window.app = new App();
        console.log('✅ Application initialized');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
}

// Wait for everything to be loaded
window.addEventListener('load', () => {
    console.log('Window loaded, starting initialization...');
    initializeTF().catch(error => {
        console.error('Failed to initialize:', error);
    });
}); 