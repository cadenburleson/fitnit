import { UI_CONFIG, POSENET_CONFIG } from './config.js';

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
        this.smoothingFactor = 0.8; // Higher = more smoothing

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
            await tf.setBackend('webgl');
            await tf.ready();
            console.log('✅ WebGL initialized');

            // Load PoseNet with fixed configuration
            this.net = await posenet.load({
                ...POSENET_CONFIG,
                inputResolution: { width: 640, height: 480 } // Fixed resolution
            });
            console.log('✅ PoseNet model loaded');
        } catch (error) {
            console.error('❌ Error initializing:', error);
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
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    frameRate: { ideal: 30 }
                },
                audio: false
            });

            this.videoElement.srcObject = stream;
            console.log('✅ Camera stream obtained');

            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();

                    // Set fixed dimensions for video and canvas
                    this.videoElement.width = 640;
                    this.videoElement.height = 480;
                    this.canvasElement.width = 640;
                    this.canvasElement.height = 480;

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

                // Draw outer circle
                this.ctx.beginPath();
                this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.fill();

                // Draw inner circle
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fill();

                // Draw keypoint name (adjusted position for mirrored view)
                this.ctx.fillStyle = 'white';
                this.ctx.font = '12px Arial';
                // Text position adjusted to be readable in mirrored view
                this.ctx.fillText(keypoint.part, x - 50, y);
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
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#00ff00';
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