import { supabase } from './supabaseClient.js';

// User profile handling
async function loadUserProfile(userId) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('avatar_url, display_name')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Update display name
        const userDisplayName = document.getElementById('userDisplayName');
        if (userDisplayName) {
            userDisplayName.textContent = profile?.display_name || 'User';
        }

        // Update profile picture
        if (profile?.avatar_url) {
            const navProfilePic = document.getElementById('navProfilePic');
            const defaultProfileIcon = document.getElementById('defaultProfileIcon');
            if (navProfilePic && defaultProfileIcon) {
                navProfilePic.src = profile.avatar_url;
                navProfilePic.style.display = 'block';
                defaultProfileIcon.style.display = 'none';
            }
        } else {
            const navProfilePic = document.getElementById('navProfilePic');
            const defaultProfileIcon = document.getElementById('defaultProfileIcon');
            if (navProfilePic && defaultProfileIcon) {
                navProfilePic.style.display = 'none';
                defaultProfileIcon.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function updateAuthUI(session) {
    const loginButton = document.getElementById('login');
    const signupButton = document.getElementById('signup');
    const userProfile = document.querySelector('.user-profile');
    const exerciseSelect = document.getElementById('exerciseSelect');
    const startButton = document.getElementById('startWorkout');

    if (session) {
        // User is logged in
        if (loginButton) loginButton.style.display = 'none';
        if (signupButton) signupButton.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
        if (exerciseSelect) exerciseSelect.style.display = 'block';
        if (startButton) startButton.style.display = 'block';

        // Load and display user's profile picture if they have one
        await loadUserProfile(session.user.id);
    } else {
        // User is logged out
        if (loginButton) loginButton.style.display = 'block';
        if (signupButton) signupButton.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
        if (exerciseSelect) exerciseSelect.style.display = 'none';
        if (startButton) startButton.style.display = 'none';

        // Reset to default icon
        const navProfilePic = document.getElementById('navProfilePic');
        const defaultProfileIcon = document.getElementById('defaultProfileIcon');
        if (navProfilePic && defaultProfileIcon) {
            navProfilePic.style.display = 'none';
            defaultProfileIcon.style.display = 'block';
        }
    }
}

// Setup navigation functionality
document.addEventListener('DOMContentLoaded', async () => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav__menu');
    const logo = document.querySelector('.nav__logo');
    const userIcon = document.getElementById('userIcon');
    const userDropdown = document.getElementById('userDropdown');
    const userProfile = document.querySelector('.user-profile');
    const logoutButton = document.getElementById('logoutButton');

    console.log('Navigation initialized, found logo:', logo);

    // Handle logo click
    if (logo) {
        logo.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Logo clicked');

            // Check for active session
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('Current session:', session);
            console.log('Session error:', error);

            if (session) {
                console.log('User is logged in, redirecting to app');
                window.location.href = '/app.html';
            } else {
                console.log('No session found, redirecting to landing page');
                window.location.href = '/';
            }
        });
    }

    // User profile dropdown
    console.log('Setting up dropdown, userIcon:', userIcon);
    userIcon?.addEventListener('click', () => {
        console.log('User icon clicked');
        userDropdown?.classList.toggle('active');
        console.log('Dropdown toggled, active:', userDropdown?.classList.contains('active'));
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        console.log('Document clicked, target:', e.target);
        if (userDropdown?.classList.contains('active') &&
            !userProfile?.contains(e.target)) {
            console.log('Closing dropdown');
            userDropdown.classList.remove('active');
        }
    });

    // Logout button
    logoutButton?.addEventListener('click', async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });

    // Toggle menu
    hamburger?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from bubbling to document
        hamburger.classList.toggle('active');
        navMenu?.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav__menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (hamburger && navMenu && !hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Setup auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
        updateAuthUI(session);
    });

    // Check initial auth state
    const { data: { session } } = await supabase.auth.getSession();
    updateAuthUI(session);
});

// Export functions for use in other files if needed
export { loadUserProfile, updateAuthUI }; 