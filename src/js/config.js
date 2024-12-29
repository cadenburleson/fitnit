// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// PoseNet Configuration
export const POSENET_CONFIG = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    multiplier: 0.75,
    quantBytes: 2
};

// Exercise Detection Configuration
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

// UI Configuration
export const UI_CONFIG = {
    repCounterUpdateInterval: 100,
    formFeedbackUpdateInterval: 500,
    cameraSettings: {
        width: 640,
        height: 480,
        facingMode: 'user',
        frameRate: { ideal: 30 }
    }
}; 