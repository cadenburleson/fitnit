import { PoseDetector } from './poseDetection.js';
import { ExerciseDetector } from './exerciseDetection.js';
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

let app = null;

class App {
    constructor() {
        this.poseDetector = new PoseDetector();
        this.exerciseDetector = new ExerciseDetector();
        this.isTracking = false;
        this.currentExercise = 'pushup';
        this.initialized = false;
    }

    async initialize() {
        try {
            // Get DOM elements
            this.repCounter = document.getElementById('repCounter');
            this.formFeedback = document.getElementById('formFeedback');
            this.exerciseType = document.getElementById('exerciseType');
            this.startButton = document.getElementById('startWorkout');
            this.exerciseSelect = document.getElementById('exerciseSelect');
            this.loginButton = document.getElementById('login');
            this.signupButton = document.getElementById('signup');
            this.userProfile = document.querySelector('.user-profile');
            this.userIcon = document.getElementById('userIcon');
            this.userDropdown = document.getElementById('userDropdown');
            this.logoutButton = document.getElementById('logoutButton');

            // Setup event listeners
            this.setupEventListeners();
            this.setupAuthListeners();

            // Initialize the exercise detector with the default exercise
            this.exerciseDetector.setExercise(this.currentExercise);

            // Set up pose detection callback
            this.poseDetector.onPoseDetected = (pose) => {
                if (this.isTracking && pose) {
                    this.onPoseDetected(pose);
                }
            };

            // Check initial auth state
            await this.checkAuthState();

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

        // User profile dropdown
        this.userIcon?.addEventListener('click', () => {
            this.userDropdown?.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.userDropdown?.classList.contains('active') &&
                !this.userProfile?.contains(e.target)) {
                this.userDropdown.classList.remove('active');
            }
        });

        // Logout button
        this.logoutButton?.addEventListener('click', async () => {
            try {
                await supabase.auth.signOut();
                window.location.reload();
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }

    setupAuthListeners() {
        supabase.auth.onAuthStateChange((event, session) => {
            this.updateAuthUI(session);
        });
    }

    async checkAuthState() {
        const { data: { session } } = await supabase.auth.getSession();
        this.updateAuthUI(session);
    }

    updateAuthUI(session) {
        if (session) {
            // User is logged in
            if (this.loginButton) this.loginButton.style.display = 'none';
            if (this.signupButton) this.signupButton.style.display = 'none';
            if (this.userProfile) this.userProfile.style.display = 'block';
        } else {
            // User is logged out
            if (this.loginButton) this.loginButton.style.display = 'block';
            if (this.signupButton) this.signupButton.style.display = 'block';
            if (this.userProfile) this.userProfile.style.display = 'none';
        }
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
        this.startButton.textContent = 'Stop Tracking';
        this.exerciseDetector.resetState();
        this.repCounter.textContent = 'Reps: 0';
        this.formFeedback.textContent = 'Form: Ready';
    }

    stopTracking() {
        this.isTracking = false;
        this.startButton.textContent = 'Start Tracking';
    }

    onPoseDetected(pose) {
        const result = this.exerciseDetector.detectExercise(pose);
        if (result) {
            this.repCounter.textContent = `Reps: ${result.reps}`;
            this.formFeedback.textContent = `Form: ${result.feedback}`;
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new App();
        const success = await app.initialize();
        if (!success) {
            console.error('Failed to initialize application');
        }
    } catch (error) {
        console.error('Error during application startup:', error);
    }
}); 