import { PoseDetector } from './poseDetection.js';
import { ExerciseDetector } from './exerciseDetection.js';

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

            // Setup event listeners
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
            this.exerciseType.textContent = `Exercise: ${this.capitalizeFirstLetter(this.currentExercise)}s`;
            this.exerciseDetector.setExercise(this.currentExercise);
            if (this.isTracking) {
                this.stopTracking();
            }
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