import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedReplayModel({ headAngle = 12, shoulderAngle = 2, torsoAngle = 6, postureState = "Balanced" }) {
  const headRef = useRef();
  const neckRef = useRef();
  const torsoRef = useRef();
  const shouldersRef = useRef();

  useFrame(() => {
    // Convert degrees to radians with scaling
    const headRadX = THREE.MathUtils.degToRad(Math.max(0, headAngle - 10) * 1.4); // forward head pitch
    const torsoRadX = THREE.MathUtils.degToRad(Math.max(0, torsoAngle - 5) * 1.2); // torso forward lean
    const shoulderRadZ = THREE.MathUtils.degToRad(shoulderAngle * 1.5); // shoulder roll / tilt

    // Lerp smoothly to target poses
    if (headRef.current) {
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, headRadX, 0.1);
      headRef.current.position.z = THREE.MathUtils.lerp(headRef.current.position.z, headRadX * 0.4, 0.1);
    }

    if (neckRef.current) {
      neckRef.current.rotation.x = THREE.MathUtils.lerp(neckRef.current.rotation.x, headRadX * 0.7, 0.1);
    }

    if (torsoRef.current) {
      torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, torsoRadX, 0.1);
    }

    if (shouldersRef.current) {
      shouldersRef.current.rotation.z = THREE.MathUtils.lerp(shouldersRef.current.rotation.z, shoulderRadZ, 0.1);
    }
  });

  // State-based dynamic coloration
  let stateColor = "#10B981"; // Emerald
  let jointEmissive = "#34D399";
  if (postureState === "Forward Head") {
    stateColor = "#F59E0B"; // Amber
    jointEmissive = "#FBBF24";
  } else if (postureState === "Forward Lean") {
    stateColor = "#F97316"; // Orange
    jointEmissive = "#FB923C";
  } else if (postureState === "Shoulder Asymmetry") {
    stateColor = "#A855F7"; // Purple
    jointEmissive = "#C084FC";
  } else if (postureState === "Persistent Slouch") {
    stateColor = "#EF4444"; // Rose
    jointEmissive = "#F87171";
  }

  return (
    <group position={[0, -0.6, 0]}>
      {/* Base Pelvis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.12, 0.18]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {/* Torso Group that hinges at the pelvis */}
      <group ref={torsoRef} position={[0, 0.08, 0]}>
        {/* Spine Column */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.75, 12]} />
          <meshStandardMaterial color={stateColor} metalness={0.5} roughness={0.3} />
        </mesh>

        {/* Rib Cages */}
        {[0.65, 0.5, 0.35].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.26 - i * 0.03, 0.015, 6, 18, Math.PI]} />
            <meshStandardMaterial color="#475569" transparent opacity={0.6} />
          </mesh>
        ))}

        {/* Shoulders Beam that tilts */}
        <group ref={shouldersRef} position={[0, 0.88, 0]}>
          <mesh>
            <boxGeometry args={[0.85, 0.05, 0.08]} />
            <meshStandardMaterial color="#475569" metalness={0.4} />
          </mesh>

          {/* Left / Right Shoulder Acromion nodes */}
          <mesh position={[-0.43, 0, 0]}>
            <sphereGeometry args={[0.065, 16, 16]} />
            <meshStandardMaterial color={jointEmissive} emissive={jointEmissive} emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0.43, 0, 0]}>
            <sphereGeometry args={[0.065, 16, 16]} />
            <meshStandardMaterial color={jointEmissive} emissive={jointEmissive} emissiveIntensity={0.6} />
          </mesh>

          {/* Arms hanging */}
          <mesh position={[-0.43, -0.35, 0]}>
            <cylinderGeometry args={[0.03, 0.025, 0.6, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0.43, -0.35, 0]}>
            <cylinderGeometry args={[0.03, 0.025, 0.6, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>

          {/* Neck Segment */}
          <group ref={neckRef} position={[0, 0.05, 0]}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.035, 0.04, 0.22, 10]} />
              <meshStandardMaterial color="#64748B" />
            </mesh>

            {/* Cranium / Head */}
            <group ref={headRef} position={[0, 0.32, 0]}>
              <mesh>
                <sphereGeometry args={[0.18, 20, 20]} />
                <meshStandardMaterial color="#F8FAFC" metalness={0.3} roughness={0.3} wireframe />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.13, 14, 14]} />
                <meshBasicMaterial color={jointEmissive} transparent opacity={0.5} />
              </mesh>
              {/* Nose orientation indicator */}
              <mesh position={[0, -0.02, 0.18]}>
                <coneGeometry args={[0.03, 0.08, 8]} rotation={[Math.PI / 2, 0, 0]} />
                <meshBasicMaterial color="#38BDF8" />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* Ground reference pedestal */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshBasicMaterial color="#1E293B" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function ReplaySkeletonCanvas({ headAngle, shoulderAngle, torsoAngle, postureState }) {
  return (
    <div className="w-full h-full min-h-[380px] relative select-none">
      <Canvas
        camera={{ position: [1.2, 0.4, 2.8], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.9} />
        <pointLight position={[5, 5, 5]} intensity={1.4} color="#34D399" />
        <pointLight position={[-5, 2, -5]} intensity={0.8} color="#38BDF8" />
        <directionalLight position={[0, 5, 2]} intensity={1.0} />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minPolarAngle={Math.PI / 4}
          autoRotate={false}
        />

        <AnimatedReplayModel
          headAngle={headAngle}
          shoulderAngle={shoulderAngle}
          torsoAngle={torsoAngle}
          postureState={postureState}
        />
      </Canvas>
    </div>
  );
}
