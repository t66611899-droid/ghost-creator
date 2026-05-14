'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSuiteStore } from '@/store/useSuiteStore';

// SSR-disabled — R3F + three cannot mount during server render
const LiquidGlass = dynamic(() => import('./LiquidGlass'), {
  ssr: false,
  loading: () => null,
});

export default function R3FBackground() {
  const setScrollOffset = useSuiteStore((s) => s.setScrollOffset);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const norm = max > 0 ? window.scrollY / max : 0;
      setScrollOffset(Math.min(1, Math.max(0, norm)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', compute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', compute);
    };
  }, [setScrollOffset]);

  return <LiquidGlass />;
}
