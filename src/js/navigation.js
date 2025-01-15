import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav__menu');
    const logo = document.querySelector('.nav__logo');

    // Handle logo click
    if (logo) {
        logo.addEventListener('click', async (e) => {
            e.preventDefault();
            // Check for active session
            const { data: { session } } = await supabase.auth.getSession();
            // Redirect to app if logged in, otherwise go to landing page
            window.location.href = session ? '/app.html' : '/';
        });
    }

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
}); 