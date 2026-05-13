'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { IcosahedronGeometry, MeshBasicMaterial } from 'three';
import * as THREE from 'three';

// ─── Inner scene (SSR-safe — loaded dynamically) ──────────────────────────────

function SphereScene({ confidence }: { confidence: number }) {
  const wireRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Normalise confidence 0-100 → 0-1
  const t = confidence / 100;

  // Orange accent colour
  const orange = new THREE.Color('#EA580C');
  const orangeDim = new THREE.Color('#7a2c04');

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (wireRef.current) {
      wireRef.current.rotation.x = time * 0.12;
      wireRef.current.rotation.y = time * 0.18;
    }
    if (coreRef.current) {
      // Pulse scale based on confidence + sine wave
      const pulse = 1 + (0.04 + t * 0.06) * Math.sin(time * 2.5);
      coreRef.current.scale.setScalar(pulse);
      // Colour shifts warmer at high confidence
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.color.lerpColors(orangeDim, orange, t * 0.8 + 0.2);
      mat.opacity = 0.15 + t * 0.25 + 0.05 * Math.sin(time * 3);
    }
    if (glowRef.current) {
      const s = 1.2 + 0.1 * Math.sin(time * 1.5) + t * 0.15;
      glowRef.current.scale.setScalar(s);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.04 + t * 0.08 + 0.02 * Math.sin(time * 2);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.35;
      ringRef.current.rotation.x = Math.PI / 2 + 0.3 * Math.sin(time * 0.5);
    }
  });

  // Wireframe icosahedron
  const wireGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.72, 1), []);
  const glowGeo = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.18, 0.008, 4, 64), []);

  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.1} />
      <pointLight position={[3, 3, 3]} color="#EA580C" intensity={t * 2 + 0.3} />
      <pointLight position={[-3, -2, -3]} color="#3b1200" intensity={0.5} />

      {/* Outer wireframe */}
      <mesh ref={wireRef} geometry={wireGeo}>
        <meshBasicMaterial
          color="#EA580C"
          wireframe
          transparent
          opacity={0.18 + t * 0.22}
        />
      </mesh>

      {/* Inner core — pulsing */}
      <mesh ref={coreRef} geometry={coreGeo}>
        <meshBasicMaterial
          color="#EA580C"
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Outer glow sphere */}
      <mesh ref={glowRef} geometry={glowGeo}>
        <meshBasicMaterial
          color="#EA580C"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef} geometry={ringGeo}>
        <meshBasicMaterial
          color="#EA580C"
          transparent
          opacity={0.4 + t * 0.3}
        />
      </mesh>
    </>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

interface HolographicSphereProps {
  confidence?: number; // 0-100
  size?: number;       // px
  className?: string;
}

export default function HolographicSphere({
  confidence = 0,
  size = 200,
  className = '',
}: HolographicSphereProps) {
  return (
    <div
      className={className}
      style={{ width: size, height: size, position: 'relative' }}
    >
      {/* Radial glow behind canvas */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(234,88,12,${0.04 + (confidence / 100) * 0.12}) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
        frameloop="always"
      >
        <SphereScene confidence={confidence} />
      </Canvas>
    </div>
  );
}
