import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function TechnicalSkeleton({ mousePos = { x: 0, y: 0 } }) {
  const groupRef = useRef();
  const headRef = useRef();
  const spineRef = useRef();
  const particlesRef = useRef();

  // Procedural particle cloud
  const particlePoints = useMemo(() => {
    const coords = [];
    for (let i = 0; i < 90; i++) {
      coords.push(
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 2.5
      );
    }
    return new Float32Array(coords);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Natural responsive tilt
      const targetY = (mousePos.x || 0) * 0.45;
      const targetX = -(mousePos.y || 0) * 0.25;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
    }

    if (headRef.current) {
      headRef.current.position.y = 1.38 + Math.sin(t * 1.6) * 0.02;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.04;
    }
  });

  const boneColor = "#F43F5E"; // Rose 500
  const jointColor = "#FB923C"; // Sunset Orange 400
  const spineColor = "#FB7185"; // Rose 400
  const structureColor = "#94A3B8";

  return (
    <group ref={groupRef} position={[0, -0.35, 0]}>
      
      {/* Particle Cloud */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePoints, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.024} color="#FB923C" transparent opacity={0.5} />
      </points>

      {/* Cranium / Head with Double Ring Halo */}
      <group ref={headRef} position={[0, 1.38, 0]}>
        <mesh>
          <sphereGeometry args={[0.23, 24, 24]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.15}
            metalness={0.85}
            wireframe={true}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshBasicMaterial color="#F43F5E" transparent opacity={0.7} />
        </mesh>
        {/* Orbital Alignment Ring */}
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <ringGeometry args={[0.28, 0.295, 32]} />
          <meshBasicMaterial color="#F97316" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Cervical Vertebrae (Neck) */}
      <group position={[0, 1.06, 0]}>
        {[0.08, 0.0, -0.08].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0]}>
            <cylinderGeometry args={[0.04, 0.045, 0.06, 12]} />
            <meshStandardMaterial color={spineColor} metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Clavicle / Shoulder Girdle Beam */}
      <group position={[0, 0.94, 0]}>
        <mesh>
          <boxGeometry args={[1.05, 0.065, 0.09]} />
          <meshStandardMaterial color={boneColor} metalness={0.7} roughness={0.25} />
        </mesh>

        {/* Left Acromion Node */}
        <mesh position={[-0.52, 0, 0]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color={jointColor} emissive={jointColor} emissiveIntensity={0.9} />
        </mesh>

        {/* Right Acromion Node */}
        <mesh position={[0.52, 0, 0]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color={jointColor} emissive={jointColor} emissiveIntensity={0.9} />
        </mesh>
      </group>

      {/* Thoracic & Lumbar Spine with Rib Arcs */}
      <group ref={spineRef}>
        {[0.80, 0.65, 0.50, 0.35, 0.20, 0.05].map((y, idx) => (
          <group key={idx} position={[0, y, 0]}>
            <mesh>
              <cylinderGeometry args={[0.055, 0.06, 0.09, 14]} />
              <meshStandardMaterial color={spineColor} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Rib cages */}
            {idx < 4 && (
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.34 - idx * 0.035, 0.016, 8, 24, Math.PI]} />
                <meshStandardMaterial color={structureColor} transparent opacity={0.65} wireframe />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* Pelvis / Sacral Girdle */}
      <group position={[0, -0.06, 0]}>
        <mesh>
          <boxGeometry args={[0.72, 0.14, 0.22]} />
          <meshStandardMaterial color={boneColor} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.32, 0, 0]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color={jointColor} emissive={jointColor} emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0.32, 0, 0]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color={jointColor} emissive={jointColor} emissiveIntensity={0.7} />
        </mesh>
      </group>

      {/* Limb Struts */}
      <mesh position={[-0.56, 0.56, 0]}>
        <cylinderGeometry args={[0.035, 0.03, 0.58, 10]} />
        <meshStandardMaterial color="#64748B" roughness={0.4} />
      </mesh>
      <mesh position={[0.56, 0.56, 0]}>
        <cylinderGeometry args={[0.035, 0.03, 0.58, 10]} />
        <meshStandardMaterial color="#64748B" roughness={0.4} />
      </mesh>

      <mesh position={[-0.28, -0.52, 0]}>
        <cylinderGeometry args={[0.045, 0.038, 0.76, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[0.28, -0.52, 0]}>
        <cylinderGeometry args={[0.045, 0.038, 0.76, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

    </group>
  );
}

export default function HeroSkeletonCanvas({ mousePos }) {
  return (
    <div className="w-full h-full min-h-[460px] relative pointer-events-none select-none">
      <Canvas
        camera={{ position: [0, 0.25, 3.2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.1} />
        <pointLight position={[6, 6, 6]} intensity={2.0} color="#FB923C" />
        <pointLight position={[-6, -3, -4]} intensity={1.8} color="#F43F5E" />
        <directionalLight position={[0, 4, 3]} intensity={1.6} />

        <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.3}>
          <TechnicalSkeleton mousePos={mousePos} />
        </Float>
      </Canvas>
    </div>
  );
}
