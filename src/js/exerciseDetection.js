import { UI_CONFIG } from './config.js';

export class ExerciseDetector {
    constructor() {
        this.lastPosition = null;
        this.repCount = 0;
        this.isInStartPosition = false;
        this.currentExercise = null;
        this.onRepComplete = null;
        this.onFormUpdate = null;

        // Exercise definitions
        this.exercises = {
            pushup: {
                name: 'Push-up',
                keypoints: ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftHip', 'rightHip'],
                startPosition: {
                    armAngle: 165, // Arms almost straight
                    tolerance: 15
                },
                endPosition: {
                    armAngle: 90, // Arms bent
                    tolerance: 15
                }
            },
            squat: {
                name: 'Squat',
                keypoints: ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'],
                startPosition: {
                    kneeAngle: 165, // Legs almost straight
                    tolerance: 15
                },
                endPosition: {
                    kneeAngle: 90, // Legs bent
                    tolerance: 15
                }
            },
            curl: {
                name: 'Dumbbell Curl',
                keypoints: ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'],
                startPosition: {
                    armAngle: 165, // Arms straight down
                    tolerance: 15
                },
                endPosition: {
                    armAngle: 45, // Arms curled up
                    tolerance: 15
                }
            }
        };
    }

    setExercise(exerciseType) {
        if (!this.exercises[exerciseType]) {
            throw new Error(`Unsupported exercise type: ${exerciseType}`);
        }
        this.currentExercise = exerciseType;
        this.resetState();
    }

    resetState() {
        this.lastPosition = null;
        this.repCount = 0;
        this.isInStartPosition = false;
    }

    detectExercise(pose) {
        if (!this.currentExercise || !pose || !pose.keypoints) {
            return {
                reps: this.repCount,
                feedback: 'Waiting for pose detection...'
            };
        }

        let result;
        switch (this.currentExercise) {
            case 'pushup':
                result = this.detectPushup(pose);
                break;
            case 'squat':
                result = this.detectSquat(pose);
                break;
            case 'curl':
                result = this.detectCurl(pose);
                break;
        }

        return {
            reps: this.repCount,
            feedback: result?.feedback || 'Form: Ready'
        };
    }

    detectPushup(pose) {
        const config = this.exercises.pushup;
        const keypoints = this.getKeypoints(pose, config.keypoints);

        // Check if we have at least the arm keypoints for basic pushup detection
        const requiredKeypoints = ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'];
        const hasRequiredKeypoints = requiredKeypoints.every(kp => keypoints[kp]);

        if (!hasRequiredKeypoints) {
            return { feedback: 'Position not detected - align your arms with the camera' };
        }

        // Calculate angles for both arms
        const leftArmAngle = this.calculateAngle(
            keypoints.leftShoulder,
            keypoints.leftElbow,
            keypoints.leftWrist
        );

        const rightArmAngle = this.calculateAngle(
            keypoints.rightShoulder,
            keypoints.rightElbow,
            keypoints.rightWrist
        );

        // Use average of both arms if both angles are valid
        const avgArmAngle = (leftArmAngle && rightArmAngle) ?
            (leftArmAngle + rightArmAngle) / 2 :
            (leftArmAngle || rightArmAngle);

        if (!avgArmAngle) {
            return { feedback: 'Cannot detect arm angles clearly' };
        }

        // Check form and track rep
        const formFeedback = this.checkPushupForm(avgArmAngle, keypoints);
        this.trackRep(avgArmAngle, config);

        return { feedback: formFeedback };
    }

    detectSquat(pose) {
        const config = this.exercises.squat;
        const keypoints = this.getKeypoints(pose, config.keypoints);

        // Check if we have the required leg keypoints
        const requiredKeypoints = ['leftHip', 'rightHip', 'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle'];
        const hasRequiredKeypoints = requiredKeypoints.every(kp => keypoints[kp]);

        if (!hasRequiredKeypoints) {
            return { feedback: 'Position not detected - align your legs with the camera' };
        }

        // Calculate angles for both legs
        const leftKneeAngle = this.calculateAngle(
            keypoints.leftHip,
            keypoints.leftKnee,
            keypoints.leftAnkle
        );

        const rightKneeAngle = this.calculateAngle(
            keypoints.rightHip,
            keypoints.rightKnee,
            keypoints.rightAnkle
        );

        // Use average of both legs if both angles are valid
        const avgKneeAngle = (leftKneeAngle && rightKneeAngle) ?
            (leftKneeAngle + rightKneeAngle) / 2 :
            (leftKneeAngle || rightKneeAngle);

        if (!avgKneeAngle) {
            return { feedback: 'Cannot detect knee angles clearly' };
        }

        // Check form and track rep
        const formFeedback = this.checkSquatForm(avgKneeAngle, keypoints);
        this.trackRep(avgKneeAngle, config);

        return { feedback: formFeedback };
    }

    detectCurl(pose) {
        const config = this.exercises.curl;
        const keypoints = this.getKeypoints(pose, config.keypoints);

        // Check if we have the required arm keypoints
        const requiredKeypoints = ['leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'];
        const hasRequiredKeypoints = requiredKeypoints.every(kp => keypoints[kp]);

        if (!hasRequiredKeypoints) {
            return { feedback: 'Position not detected - align your arms with the camera' };
        }

        // Calculate angles for both arms
        const leftArmAngle = this.calculateAngle(
            keypoints.leftShoulder,
            keypoints.leftElbow,
            keypoints.leftWrist
        );

        const rightArmAngle = this.calculateAngle(
            keypoints.rightShoulder,
            keypoints.rightElbow,
            keypoints.rightWrist
        );

        // Use average of both arms if both angles are valid
        const avgArmAngle = (leftArmAngle && rightArmAngle) ?
            (leftArmAngle + rightArmAngle) / 2 :
            (leftArmAngle || rightArmAngle);

        if (!avgArmAngle) {
            return { feedback: 'Cannot detect arm angles clearly' };
        }

        // Check form and track rep
        const formFeedback = this.checkCurlForm(avgArmAngle, keypoints);
        this.trackRep(avgArmAngle, config);

        return { feedback: formFeedback };
    }

    getKeypoints(pose, requiredKeypoints) {
        const keypointMap = {};
        requiredKeypoints.forEach(keypointName => {
            const keypoint = pose.keypoints.find(kp => kp.part === keypointName);
            if (keypoint && keypoint.score > UI_CONFIG.minConfidence) {
                keypointMap[keypointName] = keypoint.position;
            }
        });
        return keypointMap;
    }

    calculateAngle(point1, point2, point3) {
        if (!point1 || !point2 || !point3) return null;

        const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
            Math.atan2(point1.y - point2.y, point1.x - point2.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);

        if (angle > 180.0) {
            angle = 360 - angle;
        }

        return angle;
    }

    checkPushupForm(armAngle, keypoints) {
        const config = this.exercises.pushup;
        let feedback = 'Good form';

        if (armAngle < config.endPosition.armAngle - config.endPosition.tolerance) {
            feedback = 'Go lower, bend your arms more';
        } else if (armAngle > config.startPosition.armAngle + config.startPosition.tolerance) {
            feedback = 'Dont extend your arms too much';
        }

        if (keypoints.leftHip && keypoints.rightHip && keypoints.leftShoulder && keypoints.rightShoulder) {
            const shoulderY = (keypoints.leftShoulder.y + keypoints.rightShoulder.y) / 2;
            const hipY = (keypoints.leftHip.y + keypoints.rightHip.y) / 2;
            if (Math.abs(shoulderY - hipY) > 30) {
                feedback = 'Keep your body straight';
            }
        }

        return feedback;
    }

    checkSquatForm(kneeAngle, keypoints) {
        const config = this.exercises.squat;
        let feedback = 'Good form';

        if (kneeAngle < config.endPosition.kneeAngle - config.endPosition.tolerance) {
            feedback = 'Dont go too low';
        } else if (kneeAngle > config.startPosition.kneeAngle + config.startPosition.tolerance) {
            feedback = 'Bend your knees more';
        }

        // Check knee alignment
        if (keypoints.leftKnee && keypoints.rightKnee && keypoints.leftAnkle && keypoints.rightAnkle) {
            const kneeX = (keypoints.leftKnee.x + keypoints.rightKnee.x) / 2;
            const ankleX = (keypoints.leftAnkle.x + keypoints.rightAnkle.x) / 2;
            if (Math.abs(kneeX - ankleX) > 30) {
                feedback = 'Keep your knees aligned with your ankles';
            }
        }

        return feedback;
    }

    checkCurlForm(armAngle, keypoints) {
        const config = this.exercises.curl;
        let feedback = 'Good form';

        if (armAngle < config.endPosition.armAngle - config.endPosition.tolerance) {
            feedback = 'Dont curl too high';
        } else if (armAngle > config.startPosition.armAngle + config.startPosition.tolerance) {
            feedback = 'Lower your arms fully';
        }

        // Check elbow position relative to shoulders
        if (keypoints.leftShoulder && keypoints.rightShoulder &&
            keypoints.leftElbow && keypoints.rightElbow) {
            const leftShoulderX = keypoints.leftShoulder.x;
            const rightShoulderX = keypoints.rightShoulder.x;
            const leftElbowX = keypoints.leftElbow.x;
            const rightElbowX = keypoints.rightElbow.x;

            if (Math.abs(leftElbowX - leftShoulderX) > 20 || Math.abs(rightElbowX - rightShoulderX) > 20) {
                feedback = 'Keep your elbows close to your body';
            }
        }

        return feedback;
    }

    trackRep(angle, config) {
        if (!angle || !config) return;

        // Determine which angle property to use based on the exercise
        const startAngle = config.startPosition.armAngle || config.startPosition.kneeAngle;
        const endAngle = config.endPosition.armAngle || config.endPosition.kneeAngle;
        const tolerance = config.startPosition.tolerance;

        if (!this.isInStartPosition) {
            // Check if in start position
            if (Math.abs(angle - startAngle) <= tolerance) {
                this.isInStartPosition = true;
            }
        } else {
            // Check if rep is complete
            if (Math.abs(angle - endAngle) <= tolerance) {
                this.repCount++;
                this.isInStartPosition = false;
            }
        }
    }

    updateFormFeedback(feedback) {
        if (this.onFormUpdate) {
            this.onFormUpdate(feedback);
        }
    }
} 