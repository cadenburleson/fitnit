import { supabase } from './supabaseClient.js';

// DOM Elements
const accountForm = document.getElementById('accountForm');
const profilePicture = document.getElementById('profilePicture');
const profilePreview = document.getElementById('profilePreview');
const displayNameInput = document.getElementById('displayName');
const emailInput = document.getElementById('email');

// Initialize page
async function initializePage() {
    console.log('Initializing page...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user) {
        console.log('No user found, redirecting...');
        window.location.href = '/app.html';
        return;
    }

    emailInput.value = user.email;
    await loadProfile(user.id);
    await loadWorkoutStats(user.id);
    await updateWorkoutTotals();
    console.log('Page initialization complete');
}

// Profile Management
async function loadProfile(userId) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error loading profile:', error);
        return;
    }

    if (profile) {
        displayNameInput.value = profile.display_name || '';

        // Update profile pictures if there's an avatar URL
        if (profile.avatar_url) {
            // Update main profile preview
            profilePreview.innerHTML = `<img src="${profile.avatar_url}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;

            // Update navigation profile picture
            const navProfilePic = document.getElementById('navProfilePic');
            const defaultProfileIcon = document.getElementById('defaultProfileIcon');
            if (navProfilePic && defaultProfileIcon) {
                navProfilePic.src = profile.avatar_url;
                navProfilePic.style.display = 'block';
                defaultProfileIcon.style.display = 'none';
            }
        } else {
            // Show default icons if no avatar URL
            profilePreview.innerHTML = '<i class="fas fa-user-circle"></i>';
            const navProfilePic = document.getElementById('navProfilePic');
            const defaultProfileIcon = document.getElementById('defaultProfileIcon');
            if (navProfilePic && defaultProfileIcon) {
                navProfilePic.style.display = 'none';
                defaultProfileIcon.style.display = 'block';
            }
        }

        // Make sure the user profile section is visible
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.style.display = 'flex';
        }
    }
}

async function updateProfile(event) {
    event.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    const updates = {
        id: user.id,
        display_name: displayNameInput.value,
        updated_at: new Date()
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
        console.error('Error updating profile:', error);
    } else {
        alert('Profile updated successfully!');
    }
}

async function uploadAvatar(event) {
    const { data: { user } } = await supabase.auth.getUser();
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

    if (!updateError) {
        // Update main profile preview
        profilePreview.innerHTML = `<img src="${publicUrl}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;

        // Update navigation profile picture
        const navProfilePic = document.getElementById('navProfilePic');
        const defaultProfileIcon = document.getElementById('defaultProfileIcon');
        if (navProfilePic && defaultProfileIcon) {
            navProfilePic.src = publicUrl;
            navProfilePic.style.display = 'block';
            defaultProfileIcon.style.display = 'none';
        }
    }
}

// Workout Statistics
async function loadWorkoutStats(userId) {
    console.log('Loading workout stats for user:', userId);
    const { data: exerciseHistory, error } = await supabase
        .from('exercise_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error loading exercise history:', error);
        return;
    }

    if (!exerciseHistory || exerciseHistory.length === 0) {
        console.log('No exercise history found');
        document.querySelectorAll('.stats-section__chart').forEach(chart => {
            chart.innerHTML = '<p class="no-data">No workout data available yet. Start exercising to see your stats!</p>';
        });
        return;
    }

    console.log('Exercise history loaded:', exerciseHistory.length, 'records');

    // Wait for Chart.js to be available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }

    // Destroy existing charts
    if (window.repsChart instanceof Chart) {
        window.repsChart.destroy();
        window.repsChart = null;
    }
    if (window.formChart instanceof Chart) {
        window.formChart.destroy();
        window.formChart = null;
    }
    if (window.frequencyChart instanceof Chart) {
        window.frequencyChart.destroy();
        window.frequencyChart = null;
    }
    if (window.distributionChart instanceof Chart) {
        window.distributionChart.destroy();
        window.distributionChart = null;
    }

    // Initialize new charts
    try {
        console.log('Creating reps chart...');
        await createRepsChart(exerciseHistory);
        console.log('Creating form score chart...');
        await createFormScoreChart(exerciseHistory);
        console.log('Creating frequency chart...');
        await createFrequencyChart(exerciseHistory);
        console.log('Creating distribution chart...');
        await createDistributionChart(exerciseHistory);
        console.log('All charts created successfully');
    } catch (err) {
        console.error('Error creating charts:', err);
    }
}

async function createRepsChart(exerciseHistory) {
    const repsData = exerciseHistory.reduce((acc, exercise) => {
        acc[exercise.exercise_type] = (acc[exercise.exercise_type] || 0) + exercise.reps;
        return acc;
    }, {});

    const canvas = document.getElementById('repsChart');
    if (!canvas) {
        console.error('Reps chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    window.repsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(repsData),
            datasets: [{
                label: 'Total Reps',
                data: Object.values(repsData),
                backgroundColor: 'rgba(74, 222, 128, 0.6)',
                borderColor: 'rgba(74, 222, 128, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function createFormScoreChart(exerciseHistory) {
    const timeRangeSelect = document.getElementById('timeRangeSelect');
    const days = parseInt(timeRangeSelect.value);

    const lastNDays = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString();
    }).reverse();

    const exerciseTypes = ['pushup', 'squat', 'crunch', 'curl'];
    const exerciseData = {};
    exerciseTypes.forEach(type => {
        exerciseData[type] = Object.fromEntries(lastNDays.map(date => [date, 0]));
    });

    exerciseHistory.forEach(exercise => {
        const date = new Date(exercise.created_at).toLocaleDateString();
        if (lastNDays.includes(date) && exerciseData[exercise.exercise_type]) {
            exerciseData[exercise.exercise_type][date] += exercise.reps;
        }
    });

    const datasets = exerciseTypes.map((type, index) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1) + 's',
        data: lastNDays.map(date => exerciseData[type][date]),
        borderColor: getChartColor(index),
        tension: 0.4,
        fill: false
    }));

    const canvas = document.getElementById('formChart');
    if (!canvas) {
        console.error('Form chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    window.formChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: lastNDays,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update the time range select handler
document.addEventListener('DOMContentLoaded', () => {
    console.log('Setting up time range select handler');
    const timeRangeSelect = document.getElementById('timeRangeSelect');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', async () => {
            console.log('Time range changed to:', timeRangeSelect.value);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await loadWorkoutStats(user.id);
            }
        });
    } else {
        console.error('Time range select element not found');
    }
});

function createFrequencyChart(exerciseHistory) {
    const frequencyData = exerciseHistory.reduce((acc, exercise) => {
        const date = new Date(exercise.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const ctx = document.getElementById('frequencyChart').getContext('2d');
    window.frequencyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(frequencyData),
            datasets: [{
                label: 'Workouts',
                data: Object.values(frequencyData),
                backgroundColor: 'rgba(74, 222, 128, 0.6)',
                borderColor: 'rgba(74, 222, 128, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createDistributionChart(exerciseHistory) {
    const distributionData = exerciseHistory.reduce((acc, exercise) => {
        acc[exercise.exercise_type] = (acc[exercise.exercise_type] || 0) + 1;
        return acc;
    }, {});

    const ctx = document.getElementById('distributionChart').getContext('2d');
    window.distributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(distributionData),
            datasets: [{
                data: Object.values(distributionData),
                backgroundColor: [
                    'rgba(74, 222, 128, 0.6)',
                    'rgba(74, 222, 128, 0.8)',
                    'rgba(74, 222, 128, 0.4)',
                    'rgba(74, 222, 128, 0.2)'
                ],
                borderColor: [
                    'rgba(74, 222, 128, 1)',
                    'rgba(74, 222, 128, 1)',
                    'rgba(74, 222, 128, 1)',
                    'rgba(74, 222, 128, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function getChartColor(index) {
    const colors = [
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)'
    ];
    return colors[index % colors.length];
}

async function updateWorkoutTotals() {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: exercises, error } = await supabase
        .from('exercise_history')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching exercise totals:', error);
        return;
    }

    const totals = exercises.reduce((acc, exercise) => {
        acc.pushups += exercise.exercise_type === 'pushup' ? exercise.reps : 0;
        acc.squats += exercise.exercise_type === 'squat' ? exercise.reps : 0;
        acc.crunches += exercise.exercise_type === 'crunch' ? exercise.reps : 0;
        acc.curls += exercise.exercise_type === 'curl' ? exercise.reps : 0;
        return acc;
    }, { pushups: 0, squats: 0, crunches: 0, curls: 0 });

    // Update the DOM
    document.getElementById('pushupTotal').textContent = totals.pushups;
    document.getElementById('squatTotal').textContent = totals.squats;
    document.getElementById('crunchTotal').textContent = totals.crunches;
    document.getElementById('curlTotal').textContent = totals.curls;
    document.getElementById('workoutTotal').textContent =
        new Set(exercises.map(ex => ex.workout_id)).size; // Count unique workouts
}

// Event Listeners
accountForm.addEventListener('submit', updateProfile);
profilePicture.addEventListener('change', uploadAvatar);

// Initialize the page
initializePage();

// Make sure to call this function after page load
document.addEventListener('DOMContentLoaded', updateWorkoutTotals); 