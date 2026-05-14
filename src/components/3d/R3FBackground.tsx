'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSuiteStore } from '@/store/useSuiteStore';

// SSR-disabled — R3F + three cannot mount during server render
const ParallaxSphere = dynamic(() => import('./ParallaxSphere'), {
  ssr: false,
  loading: () => null,
});

export default function R3FBackground() {
  const setScrollOffset = useSuiteStore((s) => s.setScrollOffset);

  // Global scroll → normalized offset
  useEffect(() => {
    const compute = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const norm = max > 0 ? window.scrollY / max : 0;
      setScrollOffset(Math.min(1, Math.max(0, norm)));
    };
    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
    };
  }, [setScrollOffset]);

  return <ParallaxSphere />;
}
