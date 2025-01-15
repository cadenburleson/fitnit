import { supabase } from './supabaseClient.js'

// Get the site URL from environment variable or fallback to window.location.origin
const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value
    const redirectTo = `${siteUrl}/update-password.html`

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo
        })

        if (error) throw error

        // Show success message
        alert('Password reset link has been sent to your email!')

        // Redirect back to login page after a short delay
        setTimeout(() => {
            window.location.href = '/login.html'
        }, 2000)
    } catch (error) {
        console.error('Error sending reset password link:', error.message)
        alert('Error sending reset password link: ' + error.message)
    }
}) 