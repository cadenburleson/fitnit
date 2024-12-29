import { EXERCISE_CONFIG } from './config.js';

export class ExerciseDetector {
    constructor() {
        this.currentExercise = 'pushup'; // Set default exercise
        this.repCount = 0;
        this.isInPosition = false;
        this.lastPosition = null;
        this.repCounterElement = document.getElementById('repCounter');
        this.formFeedbackElement = document.getElementById('formFeedback');
        this.startTime = null;
    }

    setExercise(exerciseType) {
        this.currentExercise = exerciseType;
        this.repCount = 0;
        this.isInPosition = false;
        this.lastPosition = null;
        this.startTime = Date.now();
        this.updateRepCounter();
    }

    updateRepCounter() {
        this.repCounterElement.textContent = `Reps: ${this.repCount}`;
    }

    updateFormFeedback(feedback) {
        this.formFeedbackElement.textContent = `Form: ${feedback}`;
    }

    getKeypoints(pose, keypointNames) {
        return keypointNames.map(name => {
            const keypoint = pose.keypoints.find(kp => kp.part === name);
            return keypoint && keypoint.score > EXERCISE_CONFIG[this.currentExercise].confidenceThreshold
                ? keypoint.position
                : null;
        });
    }

    calculateAngle(p1, p2, p3) {
        if (!p1 || !p2 || !p3) return null;

        const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) -
            Math.atan2(p1.y - p2.y, p1.x - p2.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);

        if (angle > 180.0) {
            angle = 360.0 - angle;
        }

        return angle;
    }

    analyzePose(pose) {
        if (!this.currentExercise || !pose) return;

        switch (this.currentExercise) {
            case 'pushup':
                this.detectPushup(pose);
                break;
            case 'squat':
                this.detectSquat(pose);
                break;
            // Add other exercise detection methods here
        }
    }

    detectPushup(pose) {
        const config = EXERCISE_CONFIG.pushup;
        const [leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist] =
            this.getKeypoints(pose, config.keyPoints);

        if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow || !leftWrist || !rightWrist) {
            this.updateFormFeedback('Position not detected');
            return;
        }

        const leftArmAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
        const rightArmAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);

        if (!leftArmAngle || !rightArmAngle) return;

        const avgHeight = (leftShoulder.y + rightShoulder.y) / 2;
        const currentPosition = avgHeight;

        if (!this.lastPosition) {
            this.lastPosition = currentPosition;
            return;
        }

        const isDown = leftArmAngle > 150 && rightArmAngle > 150;
        const isUp = leftArmAngle < 90 && rightArmAngle < 90;

        if (!this.isInPosition && isDown) {
            this.isInPosition = true;
            this.updateFormFeedback('Good form - go up');
        } else if (this.isInPosition && isUp) {
            this.isInPosition = false;
            this.repCount++;
            this.updateRepCounter();
            this.updateFormFeedback('Good form - go down');
        }

        this.lastPosition = currentPosition;
    }

    detectSquat(pose) {
        const config = EXERCISE_CONFIG.squat;
        const [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle] =
            this.getKeypoints(pose, config.keyPoints);

        if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
            this.updateFormFeedback('Position not detected');
            return;
        }

        const leftLegAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightLegAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);

        if (!leftLegAngle || !rightLegAngle) return;

        const avgHipHeight = (leftHip.y + rightHip.y) / 2;
        const currentPosition = avgHipHeight;

        if (!this.lastPosition) {
            this.lastPosition = currentPosition;
            return;
        }

        const isDown = leftLegAngle < 90 && rightLegAngle < 90;
        const isUp = leftLegAngle > 160 && rightLegAngle > 160;

        if (!this.isInPosition && isDown) {
            this.isInPosition = true;
            this.updateFormFeedback('Good form - stand up');
        } else if (this.isInPosition && isUp) {
            this.isInPosition = false;
            this.repCount++;
            this.updateRepCounter();
            this.updateFormFeedback('Good form - squat down');
        }

        this.lastPosition = currentPosition;
    }

    getExerciseData() {
        return {
            type: this.currentExercise,
            reps: this.repCount,
            duration: Math.round((Date.now() - this.startTime) / 1000),
            formScore: 0.8 // Placeholder for form scoring logic
        };
    }
} 