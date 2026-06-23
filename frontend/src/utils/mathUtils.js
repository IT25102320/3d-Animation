import * as THREE from 'three';

/**
 * Calculates the rotation quaternion for a bone given two landmarks
 */
export function calculateBoneRotation(landmarkA, landmarkB) {
    if (!landmarkA || !landmarkB) return new THREE.Quaternion();

    // Invert Y because MediaPipe Y goes down, Three.js Y goes up
    const v1 = new THREE.Vector3(landmarkA.x, -landmarkA.y, landmarkA.z);
    const v2 = new THREE.Vector3(landmarkB.x, -landmarkB.y, landmarkB.z);

    const direction = new THREE.Vector3().subVectors(v2, v1).normalize();

    // Assume default bone direction is down (0, -1, 0)
    const defaultDir = new THREE.Vector3(0, -1, 0);

    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultDir, direction);
    return quaternion;
}

export function mapMediaPipeToBones(landmarks, bones) {
    if (!landmarks || !bones) return;

    // Example logic to calculate bone rotation using landmarks using simple directional vectors.
    // Real implementation would use full IK solvers.

    // Left Arm (Shoulder 11 to Elbow 13)
    if (bones.leftArm && landmarks[11] && landmarks[13]) {
        const targetQ = calculateBoneRotation(landmarks[11], landmarks[13]);
        bones.leftArm.quaternion.slerp(targetQ, 0.2); // Smoothly interpolate
    }

    // Right Arm (Shoulder 12 to Elbow 14)
    if (bones.rightArm && landmarks[12] && landmarks[14]) {
        const targetQ = calculateBoneRotation(landmarks[12], landmarks[14]);
        bones.rightArm.quaternion.slerp(targetQ, 0.2);
    }

    // Head / Spine approximation (Midpoint of hips 23/24 to Midpoint of shoulders 11/12)
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
        const v1 = new THREE.Vector3(hipMid.x, -hipMid.y, hipMid.z);
        const v2 = new THREE.Vector3(shoulderMid.x, -shoulderMid.y, shoulderMid.z);
        const direction = new THREE.Vector3().subVectors(v2, v1).normalize();
        const targetQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

        bones.spine.quaternion.slerp(targetQ, 0.2);
    }
}