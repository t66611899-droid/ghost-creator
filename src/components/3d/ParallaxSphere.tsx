'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSuiteStore } from '@/store/useSuiteStore';

// ─── Parallax Path (per R3F_SCROLLYTELLING skill) ────────────────────────────

interface ActState {
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  opacity: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

function parallaxState(offset: number): ActState {
  // Act 1: 0 → 0.3 — Sphere Center
  if (offset < 0.3) {
    return {
      position: [0, 0, 0],
      scale: 1.0,
      rotation: [0, offset * 0.4, 0],
      opacity: 1.0,
    };
  }
  // Act 2: 0.3 → 0.6 — Scale Up & Rotate
  if (offset < 0.6) {
    const t = (offset - 0.3) / 0.3;
    return {
      position: [0, 0, 0],
      scale: lerp(1.0, 1.6, t),
      rotation: [t * 0.35, 0.12 + t * 1.4, 0],
      opacity: 1.0,
    };
  }
  // Act 3: 0.6 → 1.0 — Move to Background
  const t = (offset - 0.6) / 0.4;
  return {
    position: [lerp(0, 1.8, t), lerp(0, 0.6, t), lerp(0, -2.4, t)],
    scale: lerp(1.6, 0.7, t),
    rotation: [0.35, 1.52 + t * 0.4, 0],
    opacity: lerp(1.0, 0.35, t),
  };
}

// ─── Sphere mesh ──────────────────────────────────────────────────────────────

function HolographicSphere() {
  const wireRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const wireMat = useRef<THREE.MeshBasicMaterial>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  // Geometries
  const wireGeo = useMemo(() => new THREE.IcosahedronGeometry(1.0, 2), []);
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.55, 1), []);
  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.35, 0.008, 4, 96), []);

  useFrame((state) => {
    const offset = useSuiteStore.getState().scrollOffset;
    const target = parallaxState(offset);

    if (!groupRef.current) return;

    // Lerp group transform smoothly (0.08 per frame)
    const g = groupRef.current;
    g.position.x = lerp(g.position.x, target.position[0], 0.08);
    g.position.y = lerp(g.position.y, target.position[1], 0.08);
    g.position.z = lerp(g.position.z, target.position[2], 0.08);
    g.scale.setScalar(lerp(g.scale.x, target.scale, 0.08));
    g.rotation.x = lerp(g.rotation.x, target.rotation[0], 0.08);
    g.rotation.y = lerp(g.rotation.y, target.rotation[1], 0.08);
    g.rotation.z = lerp(g.rotation.z, target.rotation[2], 0.08);

    // Constant gentle drift on top of scroll-driven rotation
    if (wireRef.current) {
      wireRef.current.rotation.y += 0.0035;
      wireRef.current.rotation.x += 0.0015;
    }
    if (coreRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 1.4);
      coreRef.current.scale.setScalar(0.9 + pulse * 0.18);
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = 0.8 + state.clock.elapsedTime * 0.12;
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.06;
    }

    // Apply opacity
    if (wireMat.current) wireMat.current.opacity = target.opacity * 0.45;
    if (coreMat.current) coreMat.current.opacity = target.opacity * 0.85;
    if (ringMat.current) ringMat.current.opacity = target.opacity * 0.30;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={wireRef} geometry={wireGeo}>
        <meshBasicMaterial ref={wireMat} color="#EA580C" wireframe transparent opacity={0.45} />
      </mesh>
      <mesh ref={coreRef} geometry={coreGeo}>
        <meshBasicMaterial ref={coreMat} color="#EA580C" transparent opacity={0.85} />
      </mesh>
      <mesh ref={ringRef} geometry={ringGeo}>
        <meshBasicMaterial ref={ringMat} color="#EA580C" transparent opacity={0.30} />
      </mesh>
    </group>
  );
}

// ─── Particle haze ───────────────────────────────────────────────────────────

function ParticleHaze() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    const count = 1400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
    }
    return pos;
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    // Particles fade out as we descend into Act 3
    if (matRef.current) {
      const offset = useSuiteStore.getState().scrollOffset;
      const fade = offset > 0.6 ? lerp(0.18, 0.05, (offset - 0.6) / 0.4) : 0.18;
      matRef.current.opacity = fade;
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial ref={matRef} size={0.028} color="#EA580C" transparent opacity={0.18} sizeAttenuation />
    </points>
  );
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────

export default function ParallaxSphere() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 50 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'transparent',
      }}
      gl={{ antialias: true, alpha: true }}
      frameloop="always"
    >
      <ambientLight intensity={0.08} />
      <pointLight position={[2, 1, 3]} color="#EA580C" intensity={1.6} />
      <pointLight position={[-3, -1, -2]} color="#3b1200" intensity={0.6} />
      <ParticleHaze />
      <HolographicSphere />
    </Canvas>
  );
}
