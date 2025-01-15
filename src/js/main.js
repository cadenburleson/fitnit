import { PoseDetector } from './poseDetection.js';
import { ExerciseDetector } from './exerciseDetection.js';
import { supabase } from './supabaseClient.js';

// Handle auth callback
async function handleAuthCallback() {
    // Only handle auth callback if we're not already on the login page
    if (window.location.pathname === '/login.html') {
        return false;
    }

    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        // Parse the hash
        const params = new URLSearchParams(hash.substring(1));
        if (params.get('type') === 'magiclink') {
            try {
                // Get the current session
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session) {
                    // Redirect to login page with confirmation status
                    window.location.href = '/login.html?confirmed=true';
                    return true;
                }
            } catch (error) {
                console.error('Error handling auth callback:', error.message);
            }
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
                    // console.log('Pose received in App:', pose);
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
                window.location.href = '/index.html';
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

    async loadUserProfile(userId) {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('avatar_url, display_name')
                .eq('id', userId)
                .single();

            if (error) throw error;

            // Update profile picture
            if (profile?.avatar_url) {
                const userIcon = document.getElementById('userIcon');
                userIcon.innerHTML = `<img src="${profile.avatar_url}" alt="Profile Picture">`;
            }

            // Update display name
            const userDisplayName = document.getElementById('userDisplayName');
            if (userDisplayName) {
                userDisplayName.textContent = profile?.display_name || 'User';
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async updateAuthUI(session) {
        if (session) {
            // User is logged in
            if (this.loginButton) this.loginButton.style.display = 'none';
            if (this.signupButton) this.signupButton.style.display = 'none';
            if (this.userProfile) this.userProfile.style.display = 'flex';
            if (this.exerciseSelect) this.exerciseSelect.style.display = 'block';
            if (this.startButton) this.startButton.style.display = 'block';

            // Load and display user's profile picture if they have one
            await this.loadUserProfile(session.user.id);
        } else {
            // User is logged out
            if (this.loginButton) this.loginButton.style.display = 'block';
            if (this.signupButton) this.signupButton.style.display = 'block';
            if (this.userProfile) this.userProfile.style.display = 'none';
            if (this.exerciseSelect) this.exerciseSelect.style.display = 'none';
            if (this.startButton) this.startButton.style.display = 'none';

            // Reset to default icon
            if (this.userIcon) {
                this.userIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
            }
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
        // Log the incoming pose data
        // console.log('Pose received in App:', pose);

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
    const isAuthCallback = await handleAuthCallback();
    if (!isAuthCallback && !app) {
        app = new App();
    }
}); 