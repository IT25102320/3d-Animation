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

    // Use 0.15 slerp factor for smooth bone rotation as requested
    const slerpFactor = 0.15;

    // Helper to safely apply rotation
    const applyIK = (bone, landmarkStartIdx, landmarkEndIdx, defaultDir = new THREE.Vector3(0, -1, 0)) => {
        if (bone && landmarks[landmarkStartIdx] && landmarks[landmarkEndIdx]) {
            if (landmarks[landmarkStartIdx].visibility > 0.5 && landmarks[landmarkEndIdx].visibility > 0.5) {
               const targetQ = calculateBoneRotation(landmarks[landmarkStartIdx], landmarks[landmarkEndIdx], defaultDir);
               bone.quaternion.slerp(targetQ, slerpFactor);
            }
        }
    };

    // Upper Arms (Shoulder 11/12 to Elbow 13/14)
    applyIK(bones.leftUpperArm, 11, 13);
    applyIK(bones.rightUpperArm, 12, 14);

    // Forearms (Elbow 13/14 to Wrist 15/16)
    applyIK(bones.leftForearm, 13, 15);
    applyIK(bones.rightForearm, 14, 16);

    // Hands (Wrist 15/16 to Index Finger 19/20)
    applyIK(bones.leftHand, 15, 19);
    applyIK(bones.rightHand, 16, 20);

    // Thighs (Hip 23/24 to Knee 25/26)
    applyIK(bones.leftThigh, 23, 25);
    applyIK(bones.rightThigh, 24, 26);

    // Shins (Knee 25/26 to Ankle 27/28)
    applyIK(bones.leftShin, 25, 27);
    applyIK(bones.rightShin, 26, 28);

    // Head (Shoulders midpoint to Nose 0)
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