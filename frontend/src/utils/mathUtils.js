import * as THREE from 'three';

/**
 * Calculates the rotation quaternion for a bone given two landmarks
 */
export function calculateBoneRotation(landmarkA, landmarkB, defaultDirVec = new THREE.Vector3(0, -1, 0)) {
    if (!landmarkA || !landmarkB) return new THREE.Quaternion();

    // Invert Y because MediaPipe Y goes down, Three.js Y goes up
    const v1 = new THREE.Vector3(landmarkA.x, -landmarkA.y, landmarkA.z);
    const v2 = new THREE.Vector3(landmarkB.x, -landmarkB.y, landmarkB.z);

    // Vector pointing from joint A to joint B
    const direction = new THREE.Vector3().subVectors(v2, v1).normalize();

    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultDirVec, direction);
    return quaternion;
}

export function mapMediaPipeToBones(landmarks, bones) {
    if (!landmarks || !bones) return;

    // Use 0.15 slerp factor for smooth bone rotation
    const slerpFactor = 0.15;

    // Left Arm (Shoulder 11 to Elbow 13)
    if (bones.leftArm && landmarks[11] && landmarks[13] && landmarks[11].visibility > 0.5) {
        const targetQ = calculateBoneRotation(landmarks[11], landmarks[13]);
        bones.leftArm.quaternion.slerp(targetQ, slerpFactor);
    }

    // Right Arm (Shoulder 12 to Elbow 14)
    if (bones.rightArm && landmarks[12] && landmarks[14] && landmarks[12].visibility > 0.5) {
        const targetQ = calculateBoneRotation(landmarks[12], landmarks[14]);
        bones.rightArm.quaternion.slerp(targetQ, slerpFactor);
    }

    // Left Leg (Hip 23 to Knee 25)
    if (bones.leftLeg && landmarks[23] && landmarks[25] && landmarks[23].visibility > 0.5) {
        const targetQ = calculateBoneRotation(landmarks[23], landmarks[25]);
        bones.leftLeg.quaternion.slerp(targetQ, slerpFactor);
    }

    // Right Leg (Hip 24 to Knee 26)
    if (bones.rightLeg && landmarks[24] && landmarks[26] && landmarks[24].visibility > 0.5) {
        const targetQ = calculateBoneRotation(landmarks[24], landmarks[26]);
        bones.rightLeg.quaternion.slerp(targetQ, slerpFactor);
    }

    // Head (Nose 0 relative to Shoulders midpoint)
    if (bones.head && landmarks[0] && landmarks[11] && landmarks[12]) {
        const shoulderMidX = (landmarks[11].x + landmarks[12].x) / 2;
        const shoulderMidY = (landmarks[11].y + landmarks[12].y) / 2;
        const shoulderMidZ = (landmarks[11].z + landmarks[12].z) / 2;

        const shoulderMid = { x: shoulderMidX, y: shoulderMidY, z: shoulderMidZ };
        // Head points UP relative to spine
        const targetQ = calculateBoneRotation(shoulderMid, landmarks[0], new THREE.Vector3(0, 1, 0));
        bones.head.quaternion.slerp(targetQ, slerpFactor);
    }

    // Spine (Midpoint of hips 23/24 to Midpoint of shoulders 11/12)
    if (bones.spine && landmarks[11] && landmarks[12] && landmarks[23] && landmarks[24]) {
        const hipMidX = (landmarks[23].x + landmarks[24].x) / 2;
        const hipMidY = (landmarks[23].y + landmarks[24].y) / 2;
        const hipMidZ = (landmarks[23].z + landmarks[24].z) / 2;

        const shoulderMidX = (landmarks[11].x + landmarks[12].x) / 2;
        const shoulderMidY = (landmarks[11].y + landmarks[12].y) / 2;
        const shoulderMidZ = (landmarks[11].z + landmarks[12].z) / 2;

        const hipMid = { x: hipMidX, y: hipMidY, z: hipMidZ };
        const shoulderMid = { x: shoulderMidX, y: shoulderMidY, z: shoulderMidZ };

        // Spine goes up (0, 1, 0)
        const targetQ = calculateBoneRotation(hipMid, shoulderMid, new THREE.Vector3(0, 1, 0));
        bones.spine.quaternion.slerp(targetQ, slerpFactor);
    }
}