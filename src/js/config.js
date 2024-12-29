// Supabase configuration
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log environment variable status for debugging
console.log('Environment variables status:', {
    VITE_SUPABASE_URL: !!VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!VITE_SUPABASE_ANON_KEY,
    import_meta_env: import.meta.env
});

// Export with fallback values for development
export const SUPABASE_URL = VITE_SUPABASE_URL || 'https://gigipaudayfboltnsnwi.supabase.co';
export const SUPABASE_ANON_KEY = VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ2lwYXVkYXlmYm9sdG5zbndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NTI3MDgsImV4cCI6MjA1MTAyODcwOH0.JnQI48XvZiPKTkUQp6eORpQmELUBVMgu9thb2u5jugY';

export const SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY
};

// PoseNet configuration
export const POSENET_CONFIG = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.75,
    quantBytes: 2
};

// Exercise configuration
export const EXERCISE_CONFIG = {
    pushup: {
        repThreshold: 0.25,
        confidenceThreshold: 0.3,
        keyPoints: ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist']
    },
    squat: {
        repThreshold: 0.2,
        confidenceThreshold: 0.3,
        keyPoints: ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle']
    },
    crunch: {
        repThreshold: 0.15,
        confidenceThreshold: 0.3,
        keyPoints: ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip']
    },
    dumbbellCurl: {
        repThreshold: 0.3,
        confidenceThreshold: 0.3,
        keyPoints: ['leftShoulder', 'leftElbow', 'leftWrist', 'rightShoulder', 'rightElbow', 'rightWrist']
    }
};

// Camera configuration
export const CAMERA_CONFIG = {
    width: 640,
    height: 480,
    facingMode: 'user',
    frameRate: { ideal: 30 }
};

// UI configuration
export const UI_CONFIG = {
    confidenceThreshold: 0.3,
    lineWidth: 2,
    repCounterUpdateInterval: 100,
    formFeedbackUpdateInterval: 500
}; 