import { supabase } from './supabaseClient.js'

document.addEventListener('DOMContentLoaded', () => {
    // Check for confirmation status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('confirmed') === 'true') {
        alert('Email confirmed successfully! You can now log in.');
    } else if (urlParams.get('status') === 'confirm') {
        alert('Please check your email and click the confirmation link before logging in.');
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault()

        const email = document.getElementById('email').value
        const password = document.getElementById('password').value

        try {
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