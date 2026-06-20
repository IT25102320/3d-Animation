import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';

function PlaceholderCharacter() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
        // Slow rotation to simulate idle
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 1, 0]}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.4]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.5} />
      </mesh>
      {/* Left Arm */}
      <mesh position={[-0.6, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      {/* Right Arm */}
      <mesh position={[0.6, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
    </group>
  );
}

export function Scene3D() {
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

        <PlaceholderCharacter />

        <OrbitControls makeDefault />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
