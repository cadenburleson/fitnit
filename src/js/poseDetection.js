import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { UI_CONFIG, CAMERA_CONFIG } from './config.js';

export class PoseDetector {
    constructor() {
        console.log('Initializing PoseDetector');
        this.poseLandmarker = null;
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('overlay');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.onPoseDetected = null;

        // Add resize handler
        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === this.video.parentElement) {
                    this.updateCanvasSize();
                }
            }
        });

        // Enhanced pose smoothing
        this.previousPoses = [];
        this.windowSize = 4; // Number of frames to average // Reduced from 3 to 2 (fewer frames = less smoothing) //5
        this.alpha = 0.8; // Low-pass filter coefficient // Increased from 0.7 to 0.8 (higher = less smoothing)//0.3
        this.minConfidence = 0.3; // Range: 0.0 to 1.0 //0.3
        // 0.3 = 30% confidence minimum
        // Lower value = more sensitive detection but potentially more false positives
        // Higher value = more strict detection but might miss some poses

        // Frame rate control
        this.lastFrameTime = 0;
        this.targetFPS = 30; // Target frames per second
        this.frameInterval = 1000 / this.targetFPS;
        this.rafId = null; // Store requestAnimationFrame ID
    }

    updateCanvasSize() {
        const container = this.video.parentElement;
        const rect = container.getBoundingClientRect();

        // Get the actual displayed video dimensions
        const videoAspect = this.video.videoWidth / this.video.videoHeight;
        const containerAspect = rect.width / rect.height;

        let width, height;
        if (containerAspect > videoAspect) {
            // Container is wider than video
            height = rect.height;
            width = height * videoAspect;
        } else {
            // Container is taller than video
            width = rect.width;
            height = width / videoAspect;
        }

        this.canvas.width = width;
        this.canvas.height = height;
    }

    async initialize() {
        console.log('Initializing MediaPipe Vision...');
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 1,
                minPoseDetectionConfidence: 0.5,
                minPosePresenceConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            console.log('✅ MediaPipe Vision initialized');
            return true;
        } catch (error) {
            console.error('❌ Error initializing MediaPipe Vision:', error);
            return false;
        }
    }

    async setupCamera() {
        console.log('Setting up camera...');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
        }

        try {
            // Check camera permissions
            const permissions = await navigator.permissions.query({ name: 'camera' });
            if (permissions.state === 'denied') {
                throw new Error('Camera permission has been denied. Please reset permissions and try again.');
            }

            // Get video element
            this.video = document.getElementById('video');
            this.canvas = document.getElementById('overlay');

            if (!this.video || !this.canvas) {
                throw new Error('Required video or canvas elements not found');
            }

            // Set up canvas context
            this.ctx = this.canvas.getContext('2d');

            // Request camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: CAMERA_CONFIG.width,
                    height: CAMERA_CONFIG.height,
                    facingMode: CAMERA_CONFIG.facingMode,
                    frameRate: CAMERA_CONFIG.frameRate
                },
                audio: false
            });

            if (!stream || !stream.active) {
                throw new Error('Failed to obtain active camera stream');
            }

            // Set up video element with stream
            this.video.srcObject = stream;
            console.log('✅ Camera stream obtained');

            // Wait for video to be ready
            return new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => {
                    try {
                        // Start observing the container for size changes
                        this.resizeObserver.observe(this.video.parentElement);

                        // Initial canvas size update
                        this.updateCanvasSize();

                        // Mirror video
                        this.video.style.transform = 'scaleX(-1)';
                        this.canvas.style.transform = 'scaleX(-1)';

                        this.video.play().then(() => {
                            console.log('✅ Video playback started');
                            resolve(true);
                        }).catch(error => {
                            reject(new Error('Failed to start video playback: ' + error.message));
                        });

                    } catch (error) {
                        reject(new Error('Failed to initialize video element: ' + error.message));
                    }
                };

                this.video.onerror = (error) => {
                    reject(new Error('Video element error: ' + error.message));
                };
            });
        } catch (error) {
            console.error('❌ Error accessing camera:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Camera access was denied. Please check your camera permissions in browser settings.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No camera device found. Please check your camera connection.');
            } else {
                throw error;
            }
        }
    }

    async detectPose() {
        if (!this.poseLandmarker || !this.video || this.video.readyState !== 4) {
            return null;
        }

        try {
            const startTimeMs = performance.now();
            const results = await this.poseLandmarker.detectForVideo(this.video, startTimeMs);

            if (results.landmarks && results.landmarks.length > 0) {
                // Convert MediaPipe landmarks to our app's keypoint format
                const pose = this.convertToCompatibleFormat(results.landmarks[0]);
                const smoothedPose = this.smoothPose(pose);
                return smoothedPose;
            }

            return null;
        } catch (error) {
            console.error('Error detecting pose:', error);
            return null;
        }
    }

    convertToCompatibleFormat(landmarks) {
        // Map MediaPipe landmarks to our app's keypoint format for exercise detection
        const keypointMap = {
            0: 'nose',
            11: 'leftShoulder',
            12: 'rightShoulder',
            13: 'leftElbow',
            14: 'rightElbow',
            15: 'leftWrist',
            16: 'rightWrist',
            23: 'leftHip',
            24: 'rightHip',
            25: 'leftKnee',
            26: 'rightKnee',
            27: 'leftAnkle',
            28: 'rightAnkle'
        };

        const keypoints = [];
        for (const [index, part] of Object.entries(keypointMap)) {
            const landmark = landmarks[parseInt(index)];
            keypoints.push({
                part,
                index: parseInt(index),
                score: landmark.visibility || 0,
                position: {
                    x: landmark.x * this.canvas.width,
                    y: landmark.y * this.canvas.height
                }
            });
        }

        return { keypoints, score: 1.0 };
    }

    smoothPose(currentPose) {
        if (!currentPose || !currentPose.keypoints) return currentPose;

        if (this.previousPoses.length === 0) {
            this.previousPoses.push(currentPose);
            return currentPose;
        }

        const smoothedPose = {
            ...currentPose,
            keypoints: currentPose.keypoints.map((keypoint, index) => {
                const previousPositions = this.previousPoses.map(pose => pose.keypoints[index]);

                if (keypoint.score < this.minConfidence) {
                    return keypoint;
                }

                const smoothedPosition = {
                    x: this.applyLowPassFilter(keypoint.position.x, previousPositions.map(p => p.position.x)),
                    y: this.applyLowPassFilter(keypoint.position.y, previousPositions.map(p => p.position.y))
                };

                return {
                    ...keypoint,
                    position: smoothedPosition,
                    score: this.applyLowPassFilter(keypoint.score, previousPositions.map(p => p.score))
                };
            })
        };

        this.previousPoses.push(smoothedPose);
        if (this.previousPoses.length > this.windowSize) {
            this.previousPoses.shift();
        }

        return smoothedPose;
    }

    applyLowPassFilter(currentValue, previousValues) {
        if (previousValues.length === 0) return currentValue;
        const movingAvg = previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length;
        return this.alpha * currentValue + (1 - this.alpha) * movingAvg;
    }

    drawKeypoints(keypoints) {
        keypoints.forEach(keypoint => {
            if (keypoint.score > 0.3) {
                const { x, y } = keypoint.position;

                // Draw outer circle
                this.ctx.beginPath();
                this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.fill();

                // Draw inner circle
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#00ff88';
                this.ctx.fill();
            }
        });
    }

    drawSkeleton(keypoints) {
        const adjacentKeyPoints = [
            ['leftShoulder', 'rightShoulder'],
            ['leftShoulder', 'leftElbow'],
            ['leftElbow', 'leftWrist'],
            ['rightShoulder', 'rightElbow'],
            ['rightElbow', 'rightWrist'],
            ['leftShoulder', 'leftHip'],
            ['rightShoulder', 'rightHip'],
            ['leftHip', 'rightHip'],
            ['leftHip', 'leftKnee'],
            ['leftKnee', 'leftAnkle'],
            ['rightHip', 'rightKnee'],
            ['rightKnee', 'rightAnkle']
        ];

        adjacentKeyPoints.forEach(([first, second]) => {
            const firstKeypoint = keypoints.find(kp => kp.part === first);
            const secondKeypoint = keypoints.find(kp => kp.part === second);

            if (firstKeypoint && secondKeypoint &&
                firstKeypoint.score > 0.3 && secondKeypoint.score > 0.3) {
                this.ctx.beginPath();
                this.ctx.moveTo(firstKeypoint.position.x, firstKeypoint.position.y);
                this.ctx.lineTo(secondKeypoint.position.x, secondKeypoint.position.y);
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.7)';
                this.ctx.stroke();
            }
        });
    }

    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    async start() {
        console.log('Starting pose detection...');
        if (this.isRunning) {
            console.log('Pose detection already running');
            return;
        }

        try {
            // Initialize MediaPipe if not already done
            if (!this.poseLandmarker) {
                await this.initialize();
            }

            // Clean up any existing state
            await this.stop();

            // Initialize camera
            await this.setupCamera();
            console.log('✅ Camera setup complete');

            // Wait for video to be ready
            await new Promise((resolve) => {
                const checkVideo = () => {
                    if (this.video.readyState === 4) {
                        resolve();
                    } else {
                        setTimeout(checkVideo, 100);
                    }
                };
                checkVideo();
            });

            // Start detection loop
            this.isRunning = true;
            console.log('✅ Pose detection started');
            this.detectLoop();

            return true;
        } catch (error) {
            console.error('❌ Error starting pose detection:', error);
            await this.stop();
            throw error;
        }
    }

    async stop() {
        console.log('Stopping pose detection...');
        this.isRunning = false;

        // Stop observing resize changes
        this.resizeObserver.disconnect();

        // Cancel any pending animation frame
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        try {
            // Clean up video stream
            const stream = this.video?.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                    stream.removeTrack(track);
                });
            }

            // Clear video element
            if (this.video) {
                this.video.srcObject = null;
                this.video.load();
            }

            // Clear canvas
            this.clearCanvas();

            // Reset state
            this.previousPoses = [];
            this.lastFrameTime = 0;

            console.log('✅ Pose detection stopped and cleaned up');
            return true;
        } catch (error) {
            console.error('❌ Error stopping pose detection:', error);
            return false;
        }
    }

    async detectLoop() {
        if (!this.isRunning) {
            console.log('Detection stopped');
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            return;
        }

        try {
            const currentTime = performance.now();
            const elapsed = currentTime - this.lastFrameTime;

            // Skip frame if not enough time has elapsed
            if (elapsed < this.frameInterval) {
                this.rafId = requestAnimationFrame(() => this.detectLoop());
                return;
            }

            this.lastFrameTime = currentTime - (elapsed % this.frameInterval);

            if (!this.video || !this.video.videoWidth || !this.video.videoHeight) {
                console.log('Video not ready, retrying...');
                this.rafId = requestAnimationFrame(() => this.detectLoop());
                return;
            }

            // Get pose
            const pose = await this.detectPose();

            // Clear the canvas
            this.clearCanvas();

            if (pose && pose.keypoints) {
                // Draw the pose
                this.drawKeypoints(pose.keypoints);
                this.drawSkeleton(pose.keypoints);

                // Send pose data to callback if available
                if (this.onPoseDetected && typeof this.onPoseDetected === 'function') {
                    this.onPoseDetected(pose);
                }
            }

            // Continue detection loop
            this.rafId = requestAnimationFrame(() => this.detectLoop());
        } catch (error) {
            console.error('Error in pose detection loop:', error);
            this.rafId = requestAnimationFrame(() => this.detectLoop());
        }
    }

    calculateAngle(p1, p2, p3) {
        const v1 = {
            x: p1.x - p2.x,
            y: p1.y - p2.y
        };
        const v2 = {
            x: p3.x - p2.x,
            y: p3.y - p2.y
        };

        const dotProduct = v1.x * v2.x + v1.y * v2.y;
        const v1Mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const v2Mag = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const angleRad = Math.acos(dotProduct / (v1Mag * v2Mag));
        return (angleRad * 180) / Math.PI;
    }
} 