import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { mapMediaPipeToBones } from '../utils/mathUtils';

function DynamicModel({ url, extension, poseData }) {
    const groupRef = useRef();
    const [model, setModel] = useState(null);

    useEffect(() => {
        if (!url) return;

        let loader;
        if (extension === 'glb' || extension === 'gltf') {
            loader = new GLTFLoader();
        } else if (extension === 'fbx') {
            loader = new FBXLoader();
        } else if (extension === 'obj') {
            loader = new OBJLoader();
        } else {
            console.error("Unsupported format");
            return;
        }

        loader.load(url, (loadedObj) => {
            // GLTFLoader returns an object with a .scene property. FBX/OBJ return the Object3D directly.
            const sceneObj = loadedObj.scene || loadedObj;

            // Basic material fix for OBJ which might lack materials
            if (extension === 'obj') {
                sceneObj.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
                    }
                });
            }

            setModel(sceneObj);
        }, undefined, (error) => {
            console.error("Error loading model:", error);
        });

    }, [url, extension]);

    useFrame(() => {
        // Here we would apply IK logic to `model`'s bones if it was rigged.
        // For a raw model, it just stays static inside the <Bounds> framing.
        if (model && poseData) {
           // mapMediaPipeToBones(poseData.poseLandmarks, model.skeleton.bones)
        }
    });

    if (!model) return null;

    return (
        <group ref={groupRef}>
            <primitive object={model} />
        </group>
    );
}

function PlaceholderCharacter({ poseData }) {
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const spineRef = useRef();
  const headRef = useRef();

  useFrame((state) => {
    // If we have live pose data, update the bones using IK mappings
    if (poseData && poseData.poseLandmarks) {
        const bones = {
            leftArm: leftArmRef.current,
            rightArm: rightArmRef.current,
            leftLeg: leftLegRef.current,
            rightLeg: rightLegRef.current,
            spine: spineRef.current,
            head: headRef.current
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
    <group position={[0, 1.5, 0]}>
      {/* Spine / Body Root */}
      <group ref={spineRef} position={[0, 0, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.7, 1.0, 0.3]} />
            <meshStandardMaterial color="#4f46e5" roughness={0.2} metalness={0.8} />
          </mesh>

          {/* Head attached to Spine */}
          <group ref={headRef} position={[0, 1.1, 0]}>
              <mesh position={[0, 0.2, 0]}>
                <sphereGeometry args={[0.25, 32, 32]} />
                <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.5} />
              </mesh>
          </group>
      </group>

      {/* Left Arm (Pivot at shoulder) */}
      <group position={[-0.45, 0.8, 0]}>
          <group ref={leftArmRef}>
              <mesh position={[0, -0.35, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.7]} />
                <meshStandardMaterial color="#6366f1" />
              </mesh>
          </group>
      </group>

      {/* Right Arm (Pivot at shoulder) */}
      <group position={[0.45, 0.8, 0]}>
          <group ref={rightArmRef}>
              <mesh position={[0, -0.35, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.7]} />
                <meshStandardMaterial color="#6366f1" />
              </mesh>
          </group>
      </group>

      {/* Left Leg (Pivot at hip) */}
      <group position={[-0.2, -0.1, 0]}>
          <group ref={leftLegRef}>
              <mesh position={[0, -0.45, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.9]} />
                <meshStandardMaterial color="#4338ca" />
              </mesh>
          </group>
      </group>

      {/* Right Leg (Pivot at hip) */}
      <group position={[0.2, -0.1, 0]}>
          <group ref={rightLegRef}>
              <mesh position={[0, -0.45, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.9]} />
                <meshStandardMaterial color="#4338ca" />
              </mesh>
          </group>
      </group>
    </group>
  );
}

export function Scene3D({ poseData, customModelUrl, customModelExt }) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
        <color attach="background" args={['#111827']} />

        {/* Improved Lighting for custom models */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={0.8} />
        <hemisphereLight skyColor="#ffffff" groundColor="#444444" intensity={0.5} />

        <Grid
          infiniteGrid
          fadeDistance={20}
          sectionColor="#3b82f6"
          cellColor="#1e3a8a"
          position={[0, -0.01, 0]}
        />

        <Bounds fit clip observe margin={1.2}>
           {customModelUrl ? (
               <DynamicModel url={customModelUrl} extension={customModelExt} poseData={poseData} />
           ) : (
               <PlaceholderCharacter poseData={poseData} />
           )}
        </Bounds>

        <OrbitControls makeDefault />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}