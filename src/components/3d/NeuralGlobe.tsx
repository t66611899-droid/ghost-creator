'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Point cloud distributed on a sphere surface ──────────────────────────────

function GlobeScene() {
  const pointsRef = useRef<THREE.Points>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const scanAngleRef = useRef(0);

  // Fibonacci sphere distribution — even coverage
  const { positions, colors } = useMemo(() => {
    const count = 1800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const phi = Math.PI * (Math.sqrt(5) - 1); // golden angle

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;

      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r;

      // Dim orange base colour
      col[i * 3] = 0.28;
      col[i * 3 + 1] = 0.08;
      col[i * 3 + 2] = 0.01;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.22;
      pointsRef.current.rotation.x = 0.15 * Math.sin(time * 0.3);

      // Animate point colours — scan wave brightens points near scan plane
      const colAttr = pointsRef.current.geometry.attributes.color as THREE.BufferAttribute;
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const scanY = Math.sin(scanAngleRef.current);
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const y = posAttr.getY(i);
        const dist = Math.abs(y - scanY);
        const brightness = dist < 0.12 ? 1.0 : Math.max(0.18, 1.0 - dist * 3.5);
        // Orange: r=0.92, g=0.35, b=0.05 at max; r=0.28, g=0.08, b=0.01 at dim
        colAttr.setXYZ(i, 0.28 + brightness * 0.64, 0.08 + brightness * 0.27, 0.01 + brightness * 0.04);
      }
      colAttr.needsUpdate = true;

      scanAngleRef.current += 0.04;
    }

    // Scan ring follows the scan plane
    if (scanRef.current) {
      const scanY = Math.sin(scanAngleRef.current);
      scanRef.current.position.y = scanY;
      const ringScale = Math.sqrt(Math.max(0, 1 - scanY * scanY));
      scanRef.current.scale.set(ringScale, ringScale, 1);
      (scanRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.5 + 0.3 * Math.sin(scanAngleRef.current * 2);
    }
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  const scanGeo = useMemo(() => new THREE.RingGeometry(0.0, 1.0, 64), []);

  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight position={[2, 2, 2]} color="#EA580C" intensity={1.5} />

      {/* Point cloud globe */}
      <points ref={pointsRef} geometry={geo}>
        <pointsMaterial
          size={0.022}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
        />
      </points>

      {/* Scan ring */}
      <mesh ref={scanRef} geometry={scanGeo} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial
          color="#EA580C"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Faint wireframe outline */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#EA580C" wireframe transparent opacity={0.04} />
      </mesh>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

interface NeuralGlobeProps {
  size?: number;
  className?: string;
}

export default function NeuralGlobe({ size = 260, className = '' }: NeuralGlobeProps) {
  return (
    <div
      className={className}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,88,12,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
        frameloop="always"
      >
        <GlobeScene />
      </Canvas>
    </div>
  );
}
