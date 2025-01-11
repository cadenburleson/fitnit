import { supabase } from './supabaseClient.js'

document.getElementById('updatePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault()

    const password = document.getElementById('password').value
    const confirmPassword = document.getElementById('confirmPassword').value

    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!')
        return
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) throw error

        // Show success message
        alert('Password updated successfully!')

        // Redirect to login page
        window.location.href = '/login.html'
    } catch (error) {
        console.error('Error updating password:', error.message)
        alert('Error updating password: ' + error.message)
    }
}) 