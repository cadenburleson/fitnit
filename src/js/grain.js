document.addEventListener('DOMContentLoaded', () => {
    const options = {
        "animate": true,
        "patternWidth": 100,
        "patternHeight": 100,
        "grainOpacity": 0.4,
        "grainDensity": 2.5,
        "grainWidth": 1,
        "grainHeight": 1,
        "grainChaos": 0.8,
        "grainSpeed": 30
    }

    // Initialize grain effect on the overlay
    grained("#grain-overlay", options);
}); 