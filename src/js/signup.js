import { supabase } from './supabaseClient.js'

// Get the site URL from environment variable or fallback to window.location.origin
const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Basic validation
        if (!email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        email_confirmed: false
                    },
                    // Ensure the redirect goes to the root which will then handle the redirect to login
                    emailRedirectTo: `${siteUrl}`
                }
            })

            if (error) throw error

            // Always show the email confirmation message since Supabase requires it
            alert('Please check your email to confirm your account before logging in.\n\nIf you don\'t see the email, please check your spam folder.');

            // Redirect to a confirmation page or login with a message
            window.location.href = '/login.html?status=confirm';
        } catch (error) {
            console.error('Error creating account:', error.message);
            alert('Error creating account: ' + error.message);
        }
    });
}); 