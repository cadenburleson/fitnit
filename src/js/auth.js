import { supabase } from './supabaseClient.js';

export class Auth {
    constructor() {
        this.loginBtn = document.getElementById('loginBtn');
        if (this.loginBtn) {
            this.setupEventListeners();
        }
        this.checkSession().catch(console.error);
    }

    setupEventListeners() {
        this.loginBtn.addEventListener('click', () => {
            if (this.isLoggedIn()) {
                this.signOut();
            } else {
                this.showAuthModal();
            }
        });
    }

    async checkSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session;
        } catch (error) {
            console.error('Error checking session:', error.message);
            return null;
        }
    }

    showAuthModal() {
        const email = prompt('Enter your email:');
        if (!email) return;

        const isSignUp = confirm('Do you want to create a new account? Click OK for Sign Up, Cancel for Sign In');

        if (isSignUp) {
            this.signUp(email);
        } else {
            this.signIn(email);
        }
    }

    async signUp(email) {
        if (!window.supabase) {
            alert('Authentication is not available in offline mode');
            return;
        }

        const password = prompt('Create a password (minimum 6 characters):');
        if (!password) return;

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            alert('Check your email for the confirmation link!');
            this.updateUIState(false);
        } catch (error) {
            console.error('Error signing up:', error.message);
            alert('Failed to sign up: ' + error.message);
        }
    }

    async signIn(email) {
        if (!window.supabase) {
            alert('Authentication is not available in offline mode');
            return;
        }

        const password = prompt('Enter your password:');
        if (!password) return;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            this.updateUIState(true);
        } catch (error) {
            console.error('Error signing in:', error.message);
            alert('Failed to sign in: ' + error.message);
        }
    }

    async signOut() {
        if (!window.supabase) {
            this.updateUIState(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            this.updateUIState(false);
        } catch (error) {
            console.error('Error signing out:', error.message);
            alert('Failed to sign out. Please try again.');
        }
    }

    isLoggedIn() {
        return this.loginBtn?.textContent === 'Logout';
    }

    updateUIState(isLoggedIn) {
        if (this.loginBtn) {
            this.loginBtn.textContent = isLoggedIn ? 'Logout' : 'Login';
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return { user, error: null };
        } catch (error) {
            console.error('Error getting current user:', error.message);
            return { user: null, error };
        }
    }

    async saveUserData(exerciseData) {
        try {
            if (!window.supabase) {
                console.warn('Supabase not initialized, skipping data save');
                return;
            }

            const user = await this.getCurrentUser();
            if (!user) {
                console.warn('No user logged in, skipping data save');
                return;
            }

            const { error } = await supabase
                .from('exercise_history')
                .insert([
                    {
                        user_id: user.id,
                        exercise_type: exerciseData.type,
                        reps: exerciseData.reps,
                        duration: exerciseData.duration,
                        form_score: exerciseData.formScore
                    }
                ]);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving exercise data:', error.message);
        }
    }
}

// Export a singleton instance
export const auth = new Auth();

// Export handleLogout function
export const handleLogout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing out:', error.message);
        alert('Failed to sign out. Please try again.');
    }
}; 