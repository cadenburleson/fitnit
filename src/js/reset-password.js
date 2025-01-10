import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value
    const redirectTo = `${window.location.origin}/update-password.html`

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