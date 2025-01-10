import { supabase } from './config.js';
import { auth, handleLogout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const accountForm = document.getElementById('accountForm');
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    const logoutBtn = document.getElementById('logoutBtn');
    const profilePicture = document.getElementById('profilePicture');
    const profilePreview = document.getElementById('profilePreview');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Load user data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile) {
        displayNameInput.value = profile.display_name || '';
        emailInput.value = user.email;
    }

    // Handle form submission
    accountForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updates = {
            id: user.id,
            display_name: displayNameInput.value,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(updates);

        if (error) {
            alert('Error updating profile!');
        } else {
            alert('Profile updated successfully!');
        }
    });

    // Handle profile picture upload
    profilePicture.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload the file
        const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            alert('Error uploading profile picture!');
            return;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from('profiles')
            .getPublicUrl(filePath);

        // Update the profile with the new avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                avatar_url: publicUrl,
                updated_at: new Date()
            });

        if (updateError) {
            alert('Error updating profile with new avatar!');
        } else {
            // Update preview
            const icon = profilePreview.querySelector('i');
            if (icon) icon.remove();
            profilePreview.style.backgroundImage = `url(${publicUrl})`;
        }
    });

    // Handle logout
    logoutBtn.addEventListener('click', handleLogout);
}); 