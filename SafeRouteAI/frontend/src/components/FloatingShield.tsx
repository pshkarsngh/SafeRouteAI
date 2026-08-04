"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function ShieldShape() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.2) * 0.05;
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={1.5}>
      <mesh ref={meshRef} scale={1.2}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color="#00d4aa"
          emissive="#00d4aa"
          emissiveIntensity={0.15}
          roughness={0.2}
          metalness={0.6}
          distort={0.15}
          speed={2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </Float>
  );
}

export default function FloatingShield() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#00d4aa" />
        <ShieldShape />
      </Canvas>
    </div>
  );
}
