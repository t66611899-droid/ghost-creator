import dynamic from 'next/dynamic';

export const HolographicSphere = dynamic(
  () => import('./HolographicSphere'),
  { ssr: false, loading: () => null }
);

export const NeuralGlobe = dynamic(
  () => import('./NeuralGlobe'),
  { ssr: false, loading: () => null }
);
