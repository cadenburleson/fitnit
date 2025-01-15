import { supabase } from './supabaseClient.js'

// Handle auth callback
async function handleAuthCallback() {
    const hash = window.location.hash;
    console.log('Checking auth callback on login page, hash:', hash);

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
                console.log('Valid session found, redirecting to app');
                window.location.href = '/app.html';
                return true;
            }
        } catch (error) {
            console.error('Error handling auth callback:', error.message);
        }
    }
    return false;
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Login page loaded, checking for auth callback');

    // First check for auth callback
    const isAuthCallback = await handleAuthCallback();
    console.log('Auth callback result:', isAuthCallback);

    if (!isAuthCallback) {
        // Check for confirmation status
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('confirmed') === 'true') {
            alert('Email confirmed successfully! You can now log in.');
        } else if (urlParams.get('status') === 'confirm') {
            alert('Please check your email and click the confirmation link before logging in.');
        }

        // Check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Checking existing session:', session);
        if (session) {
            console.log('Existing session found, redirecting to app');
            window.location.href = '/app.html';
            return;
        }
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault()

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        try {
            console.log('Attempting login...');
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    alert('Please confirm your email address before logging in.\n\nCheck your email inbox (and spam folder) for the confirmation link.');
                    return;
                }
                throw error;
            }

            // Successful login
            console.log('Logged in successfully:', data)
            // Redirect to app page
            window.location.href = '/app.html'
        } catch (error) {
            console.error('Error logging in:', error.message)
            alert('Error logging in: ' + error.message)
        }
    })
}) 