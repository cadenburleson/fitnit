import { Auth } from './auth.js';
import { PoseDetector } from './poseDetection.js';
import { ExerciseDetector } from './exerciseDetection.js';

export class App {
    constructor() {
        this.startWorkoutBtn = document.getElementById('startWorkout');
        this.cameraContainer = document.getElementById('cameraContainer');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.isWorkoutActive = false;

        // Initialize components
        this.auth = new Auth();
        this.poseDetector = new PoseDetector();
        this.exerciseDetector = new ExerciseDetector();

        // Make exerciseDetector globally available for pose detection
        window.exerciseDetector = this.exerciseDetector;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.startWorkoutBtn.addEventListener('click', () => {
            if (this.isWorkoutActive) {
                this.stopWorkout();
            } else {
                this.startWorkout();
            }
        });
    }

    async startWorkout() {
        try {
            // Check if user is logged in
            const user = await this.auth.getCurrentUser();
            if (!user) {
                alert('Please log in to start a workout');
                return;
            }

            // Start pose detection
            await this.poseDetector.start();

            // Update UI
            this.cameraContainer.classList.remove('hidden');
            this.welcomeScreen.classList.add('hidden');
            this.startWorkoutBtn.textContent = 'Stop Workout';
            this.isWorkoutActive = true;

        } catch (error) {
            console.error('Error starting workout:', error);
            alert('Failed to start workout. Please check camera permissions and try again.');
        }
    }

    stopWorkout() {
        // Stop pose detection
        this.poseDetector.stop();

        // Save workout data
        const exerciseData = this.exerciseDetector.getExerciseData();
        this.auth.saveUserData(exerciseData);

        // Update UI
        this.cameraContainer.classList.add('hidden');
        this.welcomeScreen.classList.remove('hidden');
        this.startWorkoutBtn.textContent = 'Start Workout';
        this.isWorkoutActive = false;
    }
} 