import dynamic from 'next/dynamic';

export const PreviewCanvas = dynamic(
  () => import('./PreviewCanvas'),
  { ssr: false, loading: () => null }
);
