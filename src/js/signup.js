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
            // Here you would typically make an API call to create the account
            // For now, we'll just simulate success
            console.log('Account creation successful');
            // Redirect to login page
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Error creating account:', error);
            alert('Error creating account. Please try again.');
        }
    });
}); 