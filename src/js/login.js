import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

document.addEventListener('DOMContentLoaded', () => {
    // Check for confirmation status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'confirm') {
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
            // Redirect to dashboard or home page
            window.location.href = '/index.html'
        } catch (error) {
            console.error('Error logging in:', error.message)
            alert('Error logging in: ' + error.message)
        }
    })
}) 