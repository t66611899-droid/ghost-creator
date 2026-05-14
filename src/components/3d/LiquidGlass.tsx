'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSuiteStore } from '@/store/useSuiteStore';

// ─── Parallax math ────────────────────────────────────────────────────────────
// Single fluid arc — no discrete acts. The chrome sphere drifts as you scroll.

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

interface FrameState {
  position: [number, number, number];
  scale: number;
  rotationY: number;
  rotationX: number;
}

function parallax(offset: number): FrameState {
  // Sphere starts slightly off-axis behind the headline and drifts further away.
  return {
    position: [
      lerp(1.3, 2.4, offset),    // off-center to the right
      lerp(-0.2, -1.6, offset),  // sinks as you scroll
      lerp(-0.8, -3.2, offset),  // recedes into the depth
    ],
    scale: 0.55 + Math.sin(offset * Math.PI) * 0.08,
    rotationY: offset * Math.PI * 0.7,
    rotationX: lerp(0, 0.22, offset),
  };
}

// ─── Procedural chrome cubemap (in-shader, no HDRI dependency) ───────────────
// We synthesize a tiny cube map of grayscale gradients so the chrome material
// has something elegant to reflect even with no Environment preset / CDN HDRI.

function makeProceduralEnvMap(): THREE.CubeTexture {
  const size = 256;
  const faces = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'] as const;
  const canvases = faces.map(() => {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d')!;
    // Vertical gradient: warm white at top → graphite at bottom
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.38, '#D8D8D8');
    g.addColorStop(0.65, '#5A5A5A');
    g.addColorStop(1, '#101010');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    // Subtle horizon band for chrome reflection line
    const band = ctx.createLinearGradient(0, size * 0.42, 0, size * 0.58);
    band.addColorStop(0, 'rgba(255,255,255,0)');
    band.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    band.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, size * 0.42, size, size * 0.16);
    return c;
  });
  const cube = new THREE.CubeTexture(canvases);
  cube.colorSpace = THREE.SRGBColorSpace;
  cube.mapping = THREE.CubeReflectionMapping;
  cube.needsUpdate = true;
  return cube;
}

// ─── The metallic sphere ──────────────────────────────────────────────────────

function ChromeSphere({ envMap }: { envMap: THREE.CubeTexture }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.15, 5), []);

  useFrame((state) => {
    const offset = useSuiteStore.getState().scrollOffset;
    const target = parallax(offset);

    if (!groupRef.current) return;
    const g = groupRef.current;
    g.position.x = lerp(g.position.x, target.position[0], 0.07);
    g.position.y = lerp(g.position.y, target.position[1], 0.07);
    g.position.z = lerp(g.position.z, target.position[2], 0.07);
    g.scale.setScalar(lerp(g.scale.x, target.scale, 0.07));
    g.rotation.x = lerp(g.rotation.x, target.rotationX, 0.07);
    g.rotation.y = lerp(g.rotation.y, target.rotationY, 0.07);

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0022;
      meshRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.18) * 0.10;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color="#F0F0F0"
          metalness={1.0}
          roughness={0.18}
          clearcoat={1.0}
          clearcoatRoughness={0.10}
          envMap={envMap}
          envMapIntensity={1.6}
          reflectivity={1.0}
        />
      </mesh>
    </group>
  );
}

// ─── Chrome dust particles ────────────────────────────────────────────────────

function ChromeDust() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 9 + 2;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3]     = Math.cos(theta) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = Math.sin(theta) * r - 5;
    }
    return pos;
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.008;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.015}
        color="#FFFFFF"
        transparent
        opacity={0.22}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Scene root — env map is mounted on the scene once ────────────────────────

function Scene() {
  const envMap = useMemo(() => makeProceduralEnvMap(), []);
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 6]} intensity={1.6} color="#FFFFFF" />
      <directionalLight position={[-5, -2, -3]} intensity={0.7} color="#A0A0A0" />
      <pointLight position={[0, -3, 3]} intensity={0.7} color="#E8E8E8" />
      <pointLight position={[2, 3, -4]} intensity={0.5} color="#B0B0B0" />
      <ChromeDust />
      <ChromeSphere envMap={envMap} />
    </>
  );
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────

export default function LiquidGlass() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.0], fov: 38 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'transparent',
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      frameloop="always"
    >
      <Scene />
    </Canvas>
  );
}
