import { SUPABASE_URL, SUPABASE_ANON_KEY, POSENET_CONFIG } from './config.js';
import { Auth } from './auth.js';
import { PoseDetector } from './poseDetection.js';
import { ExerciseDetector } from './exerciseDetection.js';
import { App } from './app.js';

// Initialize Supabase client
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize TensorFlow and PoseNet
async function initializeTF() {
    console.log('Starting initialization...');

    try {
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

        // Load PoseNet model
        console.log('Loading PoseNet model...');
        const net = await window.posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 640, height: 480 },
            multiplier: 0.75,
            quantBytes: 2
        });

        // Store the model globally
        window.poseNetModel = net;
        console.log('✅ PoseNet model loaded successfully');

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