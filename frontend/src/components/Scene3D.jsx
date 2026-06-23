import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { mapMediaPipeToBones } from '../utils/mathUtils';

function PlaceholderCharacter({ poseData }) {
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const spineRef = useRef();

  useFrame((state) => {
    // If we have live pose data, update the bones using IK mappings
    if (poseData && poseData.poseLandmarks) {
        const bones = {
            leftArm: leftArmRef.current,
            rightArm: rightArmRef.current,
            spine: spineRef.current
        };
        mapMediaPipeToBones(poseData.poseLandmarks, bones);
    } else {
        // Idle animation if no tracking data
        if (spineRef.current) {
            spineRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    }
  });

  return (
    <group position={[0, 1, 0]}>
      {/* Spine / Body Root */}
      <group ref={spineRef} position={[0, -0.6, 0]}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[0.8, 1.2, 0.4]} />
            <meshStandardMaterial color="#4f46e5" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Head attached to Spine */}
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.5} />
          </mesh>
      </group>

      {/* Left Arm (Pivot at shoulder) */}
      <group position={[-0.5, 1.0, 0]}>
          <group ref={leftArmRef}>
              <mesh position={[0, -0.4, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.8]} />
                <meshStandardMaterial color="#6366f1" />
              </mesh>
          </group>
      </group>

      {/* Right Arm (Pivot at shoulder) */}
      <group position={[0.5, 1.0, 0]}>
          <group ref={rightArmRef}>
              <mesh position={[0, -0.4, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.8]} />
                <meshStandardMaterial color="#6366f1" />
              </mesh>
          </group>
      </group>
    </group>
  );
}

export function Scene3D({ poseData }) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
        <color attach="background" args={['#111827']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <Grid
          infiniteGrid
          fadeDistance={20}
          sectionColor="#3b82f6"
          cellColor="#1e3a8a"
          position={[0, -0.01, 0]}
        />

        <PlaceholderCharacter poseData={poseData} />

        <OrbitControls makeDefault />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}