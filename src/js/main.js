import { PoseDetector } from './poseDetection.js';
import { ExerciseDetector } from './exerciseDetection.js';
import { supabase } from './supabaseClient.js';

// Handle auth callback
async function handleAuthCallback() {
    const hash = window.location.hash;
    console.log('Checking auth callback, hash:', hash);

    if (hash && hash.includes('access_token')) {
        // Parse the hash
        const params = new URLSearchParams(hash.substring(1));
        console.log('Auth params:', Object.fromEntries(params));

        try {
            // Get the current session
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('Auth session:', session, 'Error:', error);

            if (error) throw error;

            if (session) {
                if (params.get('type') === 'magiclink') {
                    console.log('Magic link detected, redirecting to app');
                    window.location.href = '/app.html';
                } else {
                    console.log('Email confirmation detected, redirecting to login');
                    window.location.href = '/login.html?confirmed=true';
                }
                return true;
            }
        } catch (error) {
            console.error('Error handling auth callback:', error.message);
            window.location.href = '/login.html?error=auth';
        }
    }
    return false;
}

let app = null;

class App {
    constructor() {
        this.poseDetector = new PoseDetector();
        this.exerciseDetector = new ExerciseDetector();
        this.isTracking = false;
        this.currentExercise = 'pushup';
        this.initialized = false;
        this.startTime = null;
    }

    async initialize() {
        try {
            // Get DOM elements
            this.repCounter = document.getElementById('repCounter');
            this.formFeedback = document.getElementById('formFeedback');
            this.exerciseType = document.getElementById('exerciseType');
            this.startButton = document.getElementById('startWorkout');
            this.exerciseSelect = document.getElementById('exerciseSelect');

            // Setup exercise event listeners
            this.setupEventListeners();

            // Initialize the exercise detector with the default exercise
            this.exerciseDetector.setExercise(this.currentExercise);

            // Set up pose detection callback
            this.poseDetector.onPoseDetected = (pose) => {
                if (this.isTracking && pose) {
                    this.onPoseDetected(pose);
                }
            };

            // Initialize and start pose detection
            await this.poseDetector.start();
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Error during initialization:', error);
            return false;
        }
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.toggleTracking());
        this.exerciseSelect.addEventListener('change', (e) => {
            this.currentExercise = e.target.value;
            this.exerciseDetector.setExercise(this.currentExercise);
            this.exerciseType.textContent = `Exercise: ${e.target.options[e.target.selectedIndex].text}`;
        });
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    toggleTracking() {
        if (this.isTracking) {
            this.stopTracking();
        } else {
            this.startTracking();
        }
    }

    startTracking() {
        this.isTracking = true;
        this.startTime = new Date();
        this.startButton.textContent = 'Stop Tracking';
        this.exerciseDetector.resetState();
        this.repCounter.textContent = 'Reps: 0';
        this.formFeedback.textContent = 'Form: Ready';
    }

    async stopTracking() {
        this.isTracking = false;
        this.startButton.textContent = 'Start Tracking';

        // Save exercise data if user is logged in
        await this.saveExerciseData();
    }

    onPoseDetected(pose) {
        if (!this.isTracking || !pose || !pose.keypoints) {
            return;
        }

        // Create a clean copy of the pose data to prevent mutation
        const poseData = {
            keypoints: [...pose.keypoints],
            score: pose.score
        };

        // Pass the clean pose data to exercise detector
        const result = this.exerciseDetector.detectExercise(poseData);
        if (result) {
            this.repCounter.textContent = `Reps: ${result.reps}`;
            this.formFeedback.textContent = `Form: ${result.feedback}`;
        }
    }

    async saveExerciseData() {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (!user) {
                console.log('User not logged in, skipping exercise data save');
                return;
            }

            const endTime = new Date();
            const duration = this.startTime ? Math.round((endTime - this.startTime) / 1000) : 0;

            const exerciseData = {
                user_id: user.id,
                exercise_type: this.currentExercise,
                reps: parseInt(this.repCounter.textContent.split(': ')[1]),
                duration: duration,
                form_score: this.calculateFormScore(),
                created_at: new Date().toISOString()
            };

            console.log('Saving exercise data:', exerciseData);

            const { error } = await supabase
                .from('exercise_history')
                .insert([{
                    user_id: exerciseData.user_id,
                    exercise_type: exerciseData.exercise_type,
                    reps: exerciseData.reps,
                    duration: Math.round(exerciseData.duration),
                    form_score: exerciseData.form_score,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            console.log('Exercise data saved successfully');

        } catch (error) {
            console.error('Error saving exercise data:', error.message);
        }
    }

    calculateFormScore() {
        // Extract form feedback and calculate a score based on feedback text
        const feedback = this.formFeedback.textContent.split(': ')[1];
        if (feedback.includes('Good')) return 100;
        if (feedback.includes('Adjust')) return 75;
        if (feedback.includes('Check')) return 50;
        return 25; // Default score for other cases
    }
}

// Initialize the app only if we're not handling an auth callback
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, checking for auth callback');
    const isAuthCallback = await handleAuthCallback();
    console.log('Auth callback result:', isAuthCallback);
    if (!isAuthCallback && !app) {
        console.log('Initializing app');
        app = new App();
        await app.initialize();
    }
}); 