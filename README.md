# Fitnit - AI Exercise Tracking

A web application for real-time exercise tracking and form analysis using AI-powered pose detection.

## Features
- Real-time pose detection and tracking using MediaPipe Vision
- Exercise form analysis with instant feedback
- Accurate rep counting for multiple exercises
- Visual skeleton and keypoint overlay
- Exercise switching with state preservation
- Form feedback with angle measurements
- Clean and intuitive user interface

## Supported Exercises
- **Push-ups**: Tracks arm angles and body alignment
- **Squats**: Monitors knee angles and proper form
- **Crunches**: Measures torso angles for proper ab engagement
- **Dumbbell Curls**: Tracks arm movement and elbow position

## Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI/ML**: MediaPipe Vision for pose detection and tracking
- **Backend**: Supabase for authentication and data storage
- **Build Tools**: Vite for development and bundling

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fitnit.git
   cd fitnit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open browser at `http://localhost:3000`

## Usage
1. Allow camera access when prompted
2. Select your exercise from the dropdown menu
3. Position yourself according to the exercise instructions
4. Click "Start Tracking" to begin
5. Follow the form feedback to maintain proper form

## Contributing
Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Submit a pull request

## License
MIT License - see LICENSE file for details

## Acknowledgments
- MediaPipe for their excellent pose detection models
- Supabase for backend infrastructure
- The open-source community for various tools and libraries 