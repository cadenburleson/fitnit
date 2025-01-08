import { Auth } from './auth.js';
import { PoseDetector } from './poseDetection.js';
import { ExerciseDetector } from './exerciseDetection.js';

export class App {
    constructor() {
        // Initialize DOM elements with null checks
        this.startWorkoutBtn = document.getElementById('startWorkout');
        this.cameraContainer = document.getElementById('cameraContainer');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.detailedStats = document.getElementById('detailedStats');

        // Validate required DOM elements
        if (!this.startWorkoutBtn || !this.cameraContainer) {
            console.error('Required DOM elements not found');
            return;
        }

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
        if (this.startWorkoutBtn) {
            this.startWorkoutBtn.addEventListener('click', () => {
                if (this.isWorkoutActive) {
                    this.stopWorkout();
                } else {
                    this.startWorkout();
                }
            });
        }
    }

    async startWorkout() {
        try {
            // Start pose detection first
            await this.poseDetector.start();

            // Update UI if elements exist
            if (this.cameraContainer) {
                this.cameraContainer.classList.remove('hidden');
            }
            if (this.detailedStats) {
                this.detailedStats.classList.remove('hidden');
            }
            if (this.welcomeScreen) {
                this.welcomeScreen.classList.add('hidden');
            }
            if (this.startWorkoutBtn) {
                this.startWorkoutBtn.textContent = 'Stop Workout';
            }

            this.isWorkoutActive = true;

            // Start updating stats
            this.startStatsUpdate();

        } catch (error) {
            console.error('Error starting workout:', error);
            alert('Failed to start workout. Please check camera permissions and try again.');
        }
    }

    stopWorkout() {
        // Stop pose detection
        this.poseDetector.stop();

        // Save workout data if authenticated
        const exerciseData = this.exerciseDetector.getExerciseData();
        this.auth.saveUserData(exerciseData).catch(console.error);

        // Update UI if elements exist
        if (this.cameraContainer) {
            this.cameraContainer.classList.add('hidden');
        }
        if (this.detailedStats) {
            this.detailedStats.classList.add('hidden');
        }
        if (this.welcomeScreen) {
            this.welcomeScreen.classList.remove('hidden');
        }
        if (this.startWorkoutBtn) {
            this.startWorkoutBtn.textContent = 'Start Workout';
        }

        this.isWorkoutActive = false;

        // Stop updating stats
        this.stopStatsUpdate();
    }

    startStatsUpdate() {
        // Update stats every second
        this.statsInterval = setInterval(() => {
            const stats = this.exerciseDetector.getExerciseData();

            // Update UI elements with null checks
            const elements = {
                totalReps: document.getElementById('totalReps'),
                formScore: document.getElementById('formScore'),
                workoutTime: document.getElementById('workoutTime'),
                caloriesBurned: document.getElementById('caloriesBurned')
            };

            if (elements.totalReps) {
                elements.totalReps.textContent = stats.totalReps || 0;
            }
            if (elements.formScore) {
                elements.formScore.textContent = `${stats.formScore || 0}%`;
            }
            if (elements.workoutTime) {
                elements.workoutTime.textContent = this.formatTime(stats.duration || 0);
            }
            if (elements.caloriesBurned) {
                elements.caloriesBurned.textContent = Math.round(stats.calories || 0);
            }
        }, 1000);
    }

    stopStatsUpdate() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
} 