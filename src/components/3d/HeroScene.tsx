'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Floating icosahedra ──────────────────────────────────────────────────────

interface FloatingShapeProps {
  position: [number, number, number];
  scale: number;
  rotSpeed: [number, number, number];
  opacity: number;
  wireframe?: boolean;
}

function FloatingShape({ position, scale, rotSpeed, opacity, wireframe = true }: FloatingShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += rotSpeed[0] * delta;
    meshRef.current.rotation.y += rotSpeed[1] * delta;
    meshRef.current.rotation.z += rotSpeed[2] * delta;
  });

  const geo = useMemo(() => new THREE.IcosahedronGeometry(scale, wireframe ? 1 : 0), [scale, wireframe]);

  return (
    <mesh ref={meshRef} position={position} geometry={geo}>
      <meshBasicMaterial
        color="#EA580C"
        wireframe={wireframe}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

// ─── Torus ring ───────────────────────────────────────────────────────────────

function OrbitalRing({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.15 + 0.8;
    ref.current.rotation.z = state.clock.elapsedTime * 0.08;
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[1.4, 0.006, 4, 80]} />
      <meshBasicMaterial color="#EA580C" transparent opacity={0.25} />
    </mesh>
  );
}

// ─── Particle field ───────────────────────────────────────────────────────────

function ParticleField() {
  const ref = useRef<THREE.Points>(null);

  const { positions } = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 4;
    }
    return { positions: pos };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.028} color="#EA580C" transparent opacity={0.18} sizeAttenuation />
    </points>
  );
}

// ─── Grid plane ───────────────────────────────────────────────────────────────

function GridPlane() {
  const ref = useRef<THREE.LineSegments>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const verts: number[] = [];
    const size = 10;
    const divisions = 20;
    const step = size / divisions;
    const half = size / 2;
    for (let i = 0; i <= divisions; i++) {
      const x = -half + i * step;
      verts.push(x, 0, -half, x, 0, half);
      verts.push(-half, 0, -half + i * step, half, 0, -half + i * step);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.04 + 0.02 * Math.sin(state.clock.elapsedTime * 0.5);
  });

  return (
    <lineSegments ref={ref} geometry={geo} position={[0, -2.5, 0]}>
      <lineBasicMaterial color="#EA580C" transparent opacity={0.05} />
    </lineSegments>
  );
}

// ─── Full scene ───────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <ambientLight intensity={0.04} />
      <pointLight position={[3, 2, 3]} color="#EA580C" intensity={1.8} />
      <pointLight position={[-4, -1, -2]} color="#3b1200" intensity={0.6} />

      <ParticleField />
      <GridPlane />

      {/* Hero icosahedra — varying depths and speeds */}
      <FloatingShape position={[3.2, 1.2, -2]} scale={0.9} rotSpeed={[0.08, 0.12, 0.04]} opacity={0.22} />
      <FloatingShape position={[-3.5, -0.8, -1.5]} scale={0.65} rotSpeed={[0.1, 0.06, 0.08]} opacity={0.18} />
      <FloatingShape position={[0.5, 2.8, -3]} scale={1.2} rotSpeed={[0.05, 0.09, 0.03]} opacity={0.14} />
      <FloatingShape position={[-2, 1.8, -4]} scale={0.5} rotSpeed={[0.12, 0.05, 0.1]} opacity={0.12} />
      <FloatingShape position={[4.5, -1.5, -3]} scale={0.4} rotSpeed={[0.15, 0.08, 0.06]} opacity={0.1} />

      {/* Solid core icosahedra */}
      <FloatingShape position={[0, -1.2, -5]} scale={2.2} rotSpeed={[0.025, 0.04, 0.01]} opacity={0.06} wireframe={false} />

      {/* Orbital rings */}
      <OrbitalRing position={[3.2, 1.2, -2]} />
      <OrbitalRing position={[-3.5, -0.8, -1.5]} />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 55 }}
      style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
      frameloop="always"
    >
      <Scene />
    </Canvas>
  );
}
