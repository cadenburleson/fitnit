export class Auth {
    constructor() {
        this.loginBtn = document.getElementById('loginBtn');
        this.setupEventListeners();
        this.checkSession();
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
        const session = await window.supabase.auth.getSession();
        this.updateUIState(!!session.data.session);
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
        const password = prompt('Create a password (minimum 6 characters):');
        if (!password) return;

        try {
            const { data, error } = await window.supabase.auth.signUp({
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
        const password = prompt('Enter your password:');
        if (!password) return;

        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
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
        try {
            const { error } = await window.supabase.auth.signOut();
            if (error) throw error;
            this.updateUIState(false);
        } catch (error) {
            console.error('Error signing out:', error.message);
            alert('Failed to sign out. Please try again.');
        }
    }

    isLoggedIn() {
        return this.loginBtn.textContent === 'Logout';
    }

    updateUIState(isLoggedIn) {
        this.loginBtn.textContent = isLoggedIn ? 'Logout' : 'Login';
    }

    async getCurrentUser() {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        if (error) {
            console.error('Error getting user:', error.message);
            return null;
        }
        return user;
    }

    async saveUserData(exerciseData) {
        const user = await this.getCurrentUser();
        if (!user) return;

        try {
            const { error } = await window.supabase
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