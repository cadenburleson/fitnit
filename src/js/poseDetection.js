import { UI_CONFIG, POSENET_CONFIG, CAMERA_CONFIG } from './config.js';

export class PoseDetector {
    constructor() {
        console.log('Initializing PoseDetector');
        this.net = null;
        this.videoElement = document.getElementById('video');
        this.canvasElement = document.getElementById('overlay');
        this.ctx = this.canvasElement.getContext('2d');
        this.isRunning = false;

        // Add pose smoothing
        this.previousPose = null;
        // Smoothing factor: 0.0 = no smoothing, 1.0 = maximum smoothing
        // 0.6 provides a good balance between responsiveness and stability
        this.smoothingFactor = 0.6; // Changed from 0.8 for better responsiveness

        // Define visual styles for skeleton and keypoints
        this.styles = {
            keypoint: {
                outer: {
                    radius: 8,
                    color: 'rgba(255, 255, 255, 0.7)'
                },
                inner: {
                    radius: 4,
                    color: '#00ff88'
                },
                text: {
                    color: 'white',
                    font: '12px Arial',
                    offset: { x: -50, y: 0 }
                }
            },
            skeleton: {
                lineWidth: UI_CONFIG.lineWidth,
                color: 'rgba(0, 255, 136, 0.7)'
            }
        };

        // Define the pairs of keypoints that should be connected
        this.connectedKeypoints = [
            ['nose', 'leftEye'], ['leftEye', 'leftEar'], ['nose', 'rightEye'], ['rightEye', 'rightEar'],
            ['leftShoulder', 'rightShoulder'], ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'],
            ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
            ['leftShoulder', 'leftHip'], ['rightShoulder', 'rightHip'],
            ['leftHip', 'rightHip'], ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'],
            ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle']
        ];

        // Initialize TensorFlow.js backend
        this.initTF();
    }

    async initTF() {
        try {
            // Try WebGL first
            await tf.setBackend('webgl');
            await tf.ready();
            console.log('✅ WebGL initialized');
        } catch (error) {
            console.warn('WebGL initialization failed, falling back to CPU:', error);
            try {
                // Fallback to CPU
                await tf.setBackend('cpu');
                await tf.ready();
                console.log('✅ CPU backend initialized');
            } catch (cpuError) {
                console.error('❌ Failed to initialize TensorFlow backend:', cpuError);
                throw cpuError;
            }
        }

        try {
            // Load PoseNet with current backend
            this.net = await posenet.load({
                ...POSENET_CONFIG,
                inputResolution: { width: 640, height: 480 }
            });
            console.log('✅ PoseNet model loaded');
        } catch (error) {
            console.error('❌ Error loading PoseNet model:', error);
            throw error;
        }
    }

    async initialize() {
        console.log('Checking PoseNet model...');
        try {
            if (!this.net) {
                console.error('❌ PoseNet model not available');
                return false;
            }
            console.log('✅ PoseNet model ready');
            return true;
        } catch (error) {
            console.error('❌ Error checking PoseNet model:', error);
            return false;
        }
    }

    async setupCamera() {
        console.log('Setting up camera...');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: CAMERA_CONFIG,
                audio: false
            });

            this.videoElement.srcObject = stream;
            console.log('✅ Camera stream obtained');

            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();

                    // Set fixed dimensions for video and canvas
                    this.videoElement.width = CAMERA_CONFIG.width;
                    this.videoElement.height = CAMERA_CONFIG.height;
                    this.canvasElement.width = CAMERA_CONFIG.width;
                    this.canvasElement.height = CAMERA_CONFIG.height;

                    // Apply CSS transform to flip the video horizontally
                    this.videoElement.style.transform = 'scaleX(-1)';
                    // Also flip the canvas to match
                    this.canvasElement.style.transform = 'scaleX(-1)';

                    console.log('✅ Video element initialized', {
                        width: this.videoElement.width,
                        height: this.videoElement.height,
                        mirrored: true
                    });
                    resolve(true);
                };
            });
        } catch (error) {
            console.error('❌ Error accessing camera:', error);
            throw error;
        }
    }

    smoothPose(currentPose) {
        if (!this.previousPose) {
            this.previousPose = currentPose;
            return currentPose;
        }

        const smoothedPose = {
            ...currentPose,
            keypoints: currentPose.keypoints.map((keypoint, index) => {
                const prevKeypoint = this.previousPose.keypoints[index];
                return {
                    ...keypoint,
                    position: {
                        x: this.smoothValue(keypoint.position.x, prevKeypoint.position.x),
                        y: this.smoothValue(keypoint.position.y, prevKeypoint.position.y)
                    },
                    score: this.smoothValue(keypoint.score, prevKeypoint.score)
                };
            })
        };

        this.previousPose = smoothedPose;
        return smoothedPose;
    }

    smoothValue(current, previous) {
        return previous * this.smoothingFactor + current * (1 - this.smoothingFactor);
    }

    async detectPose() {
        if (!this.net || !this.videoElement.readyState === 4) {
            return null;
        }

        try {
            const pose = await this.net.estimateSinglePose(this.videoElement, {
                flipHorizontal: false
            });

            if (pose && pose.keypoints) {
                const smoothedPose = this.smoothPose(pose);
                return smoothedPose;
            }
            return null;
        } catch (error) {
            console.error('❌ Error detecting pose:', error);
            return null;
        }
    }

    drawKeypoints(keypoints) {
        this.ctx.save();
        keypoints.forEach(keypoint => {
            if (keypoint.score > 0.3) {
                const { x, y } = keypoint.position;
                const { outer, inner, text } = this.styles.keypoint;

                // Draw outer circle
                this.ctx.beginPath();
                this.ctx.arc(x, y, outer.radius, 0, 2 * Math.PI);
                this.ctx.fillStyle = outer.color;
                this.ctx.fill();

                // Draw inner circle
                this.ctx.beginPath();
                this.ctx.arc(x, y, inner.radius, 0, 2 * Math.PI);
                this.ctx.fillStyle = inner.color;
                this.ctx.fill();

                // Draw keypoint name
                this.ctx.fillStyle = text.color;
                this.ctx.font = text.font;
                this.ctx.fillText(keypoint.part, x + text.offset.x, y + text.offset.y);
            }
        });
        this.ctx.restore();
    }

    drawSkeleton(keypoints) {
        this.ctx.save();
        const keypointMap = {};
        keypoints.forEach(keypoint => {
            keypointMap[keypoint.part] = keypoint;
        });

        this.connectedKeypoints.forEach(([firstPart, secondPart]) => {
            const firstKeypoint = keypointMap[firstPart];
            const secondKeypoint = keypointMap[secondPart];

            if (firstKeypoint && secondKeypoint &&
                firstKeypoint.score > 0.3 && secondKeypoint.score > 0.3) {
                this.drawSegment(
                    firstKeypoint.position,
                    secondKeypoint.position
                );
            }
        });
        this.ctx.restore();
    }

    drawSegment(start, end) {
        const { lineWidth, color } = this.styles.skeleton;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
    }

    async start() {
        console.log('Starting pose detection...');
        if (this.isRunning) {
            console.log('Pose detection already running');
            return;
        }

        try {
            const modelLoaded = await this.initialize();
            if (!modelLoaded) throw new Error('Failed to load PoseNet model');

            await this.setupCamera();
            this.isRunning = true;
            console.log('✅ Pose detection started');
            this.detectLoop();
        } catch (error) {
            console.error('❌ Error starting pose detection:', error);
            throw error;
        }
    }

    stop() {
        console.log('Stopping pose detection...');
        this.isRunning = false;
        const stream = this.videoElement.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        this.videoElement.srcObject = null;
        this.clearCanvas();
        console.log('✅ Pose detection stopped');
    }

    async detectLoop() {
        if (!this.isRunning) {
            console.log('Pose detection loop stopped');
            return;
        }

        const pose = await this.detectPose();
        if (pose) {
            this.clearCanvas();
            this.drawSkeleton(pose.keypoints);
            this.drawKeypoints(pose.keypoints);
            if (window.exerciseDetector) {
                window.exerciseDetector.analyzePose(pose);
            }
        }

        requestAnimationFrame(() => this.detectLoop());
    }
} 