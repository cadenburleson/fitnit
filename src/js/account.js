import { supabase } from './supabaseClient.js';

// DOM Elements
const accountForm = document.getElementById('accountForm');
const profilePicture = document.getElementById('profilePicture');
const profilePreview = document.getElementById('profilePreview');
const displayNameInput = document.getElementById('displayName');
const emailInput = document.getElementById('email');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize page
async function initializePage() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    emailInput.value = user.email;
    await loadProfile(user.id);
    await loadWorkoutStats(user.id);
    await updateWorkoutTotals();
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
        if (profile.avatar_url) {
            profilePreview.innerHTML = `<img src="${profile.avatar_url}" alt="Profile Picture">`;
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
        profilePreview.innerHTML = `<img src="${publicUrl}" alt="Profile Picture">`;
    }
}

// Workout Statistics
async function loadWorkoutStats(userId) {
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
        document.querySelectorAll('.stats-section__chart').forEach(chart => {
            chart.innerHTML = '<p class="no-data">No workout data available yet. Start exercising to see your stats!</p>';
        });
        return;
    }

    createRepsChart(exerciseHistory);
    createFormScoreChart(exerciseHistory);
    createFrequencyChart(exerciseHistory);
    createDistributionChart(exerciseHistory);
}

function createRepsChart(exerciseHistory) {
    const repsData = exerciseHistory.reduce((acc, exercise) => {
        acc[exercise.exercise_type] = (acc[exercise.exercise_type] || 0) + exercise.reps;
        return acc;
    }, {});

    const ctx = document.getElementById('repsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(repsData),
            datasets: [{
                label: 'Total Reps',
                data: Object.values(repsData),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

function createFormScoreChart(exerciseHistory) {
    const formScores = exerciseHistory.reduce((acc, exercise) => {
        const date = new Date(exercise.created_at).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = {
                total: exercise.form_score,
                count: 1
            };
        } else {
            acc[date].total += exercise.form_score;
            acc[date].count++;
        }
        return acc;
    }, {});

    const averageScores = Object.entries(formScores).map(([date, data]) => ({
        date,
        score: data.total / data.count
    }));

    const ctx = document.getElementById('formChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: averageScores.map(score => score.date),
            datasets: [{
                label: 'Average Form Score',
                data: averageScores.map(score => score.score),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

function createFrequencyChart(exerciseHistory) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString();
    }).reverse();

    const workoutDays = exerciseHistory.reduce((acc, exercise) => {
        const date = new Date(exercise.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const frequencyData = last7Days.map(date => workoutDays[date] || 0);

    const ctx = document.getElementById('frequencyChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Workouts per Day',
                data: frequencyData,
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
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
    const exerciseTypes = exerciseHistory.reduce((acc, exercise) => {
        acc[exercise.exercise_type] = (acc[exercise.exercise_type] || 0) + 1;
        return acc;
    }, {});

    const colors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)'
    ];

    const ctx = document.getElementById('distributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(exerciseTypes),
            datasets: [{
                data: Object.values(exerciseTypes),
                backgroundColor: colors.slice(0, Object.keys(exerciseTypes).length),
                borderColor: colors.slice(0, Object.keys(exerciseTypes).length).map(color => color.replace('0.6', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                }
            }
        }
    });
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
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/login.html';
});

// Initialize the page
initializePage();

// Make sure to call this function after page load
document.addEventListener('DOMContentLoaded', updateWorkoutTotals); 