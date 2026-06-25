import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { mapMediaPipeToBones } from '../utils/mathUtils';

function findBoneByKeywords(object, keywords) {
    let found = null;
    object.traverse((child) => {
        if (child.isBone && !found) {
            const name = child.name.toLowerCase();
            if (keywords.some(keyword => name.includes(keyword))) {
                found = child;
            }
        }
    });
    return found;
}

function extractBones(model) {
    // Attempt to auto-map standard bone names (e.g., Mixamo naming conventions)
    return {
        leftUpperArm: findBoneByKeywords(model, ['leftarm', 'left_arm', 'leftshoulder', 'l_upperarm']),
        rightUpperArm: findBoneByKeywords(model, ['rightarm', 'right_arm', 'rightshoulder', 'r_upperarm']),
        leftForearm: findBoneByKeywords(model, ['leftforearm', 'left_forearm', 'l_forearm', 'leftelbow']),
        rightForearm: findBoneByKeywords(model, ['rightforearm', 'right_forearm', 'r_forearm', 'rightelbow']),
        leftHand: findBoneByKeywords(model, ['lefthand', 'left_hand', 'l_hand', 'leftwrist']),
        rightHand: findBoneByKeywords(model, ['righthand', 'right_hand', 'r_hand', 'rightwrist']),
        leftThigh: findBoneByKeywords(model, ['leftupleg', 'left_upleg', 'l_thigh', 'lefthip']),
        rightThigh: findBoneByKeywords(model, ['rightupleg', 'right_upleg', 'r_thigh', 'righthip']),
        leftShin: findBoneByKeywords(model, ['leftleg', 'left_leg', 'l_calf', 'leftknee']),
        rightShin: findBoneByKeywords(model, ['rightleg', 'right_leg', 'r_calf', 'rightknee']),
        head: findBoneByKeywords(model, ['head', 'neck']),
        spine: findBoneByKeywords(model, ['spine', 'hips', 'pelvis'])
    };
}

function DynamicModel({ url, extension, poseData }) {
    const groupRef = useRef();
    const [model, setModel] = useState(null);
    const [bones, setBones] = useState(null);

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
            const sceneObj = loadedObj.scene || loadedObj;

            if (extension === 'obj') {
                sceneObj.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
                    }
                });
            }

            // Extract bones dynamically
            const extractedBones = extractBones(sceneObj);
            setBones(extractedBones);
            setModel(sceneObj);
        }, undefined, (error) => {
            console.error("Error loading model:", error);
        });

    }, [url, extension]);

    useFrame(() => {
        if (model && bones && poseData && poseData.poseLandmarks) {
           mapMediaPipeToBones(poseData.poseLandmarks, bones);
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
            leftUpperArm: leftArmRef.current,
            rightUpperArm: rightArmRef.current,
            leftThigh: leftLegRef.current,
            rightThigh: rightLegRef.current,
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