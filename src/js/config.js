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

// Camera configuration
export const CAMERA_CONFIG = {
    width: 640,
    height: 480,
    facingMode: 'user',
    frameRate: 30
};

// UI configuration
export const UI_CONFIG = {
    drawKeypoints: true,
    drawSkeleton: true,
    minConfidence: 0.2,
    lineWidth: 2,
    pointRadius: 4,
    pointColor: '#00ff88',
    lineColor: 'rgba(0, 255, 136, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)'
};

export const MEDIAPIPE_CONFIG = {
    modelType: 'lite', // 'lite', 'full', or 'heavy'
    delegate: 'GPU', // 'GPU' or 'CPU'
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    modelComplexity: 1,
    numPoses: 1
};

export const EXERCISE_CONFIG = {
    pushup: {
        name: 'Push-up',
        keyPoints: ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'],
        confidenceThreshold: 0.3,
        repThreshold: 0.2
    },
    squat: {
        name: 'Squat',
        keyPoints: ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'],
        confidenceThreshold: 0.3,
        repThreshold: 0.2
    },
    crunch: {
        name: 'Crunch',
        keyPoints: ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'],
        confidenceThreshold: 0.3,
        repThreshold: 0.15
    },
    dumbbellCurl: {
        name: 'Dumbbell Curl',
        keyPoints: ['leftShoulder', 'leftElbow', 'leftWrist', 'rightShoulder', 'rightElbow', 'rightWrist'],
        confidenceThreshold: 0.3,
        repThreshold: 0.2
    }
}; 