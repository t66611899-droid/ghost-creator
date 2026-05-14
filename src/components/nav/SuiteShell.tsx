'use client';

import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import GlobalSidebar from './GlobalSidebar';
import { useSuiteStore } from '@/store/useSuiteStore';

// Routes that render inside the sidebar shell
const SHELL_ROUTES = ['/dashboard'];

function ShellHeader() {
  const router = useRouter();
  const { resetAll } = useSuiteStore();

  const handleReset = () => {
    resetAll();
    router.push('/');
  };

  return (
    <header
      className="flex items-center justify-end px-8 py-3 shrink-0 relative"
      style={{
        background: 'rgba(10,10,10,0.40)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        zIndex: 50,
      }}
    >
      <button
        onClick={handleReset}
        className="flex items-center gap-2 cursor-pointer group"
        title="Return Home"
      >
        <span
          className="text-[9px] tracking-[0.28em] uppercase transition-colors"
          style={{
            color: 'rgba(255,255,255,0.32)',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 600,
          }}
        >
          Clear
        </span>
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <X className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.45)' }} />
        </div>
      </button>
    </header>
  );
}

export default function SuiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShellRoute = SHELL_ROUTES.some((r) => pathname.startsWith(r));

  if (!isShellRoute) {
    // Landing — full-bleed, no sidebar
    return <>{children}</>;
  }

  return (
    <div className="flex h-full min-h-screen relative">
      <GlobalSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <ShellHeader />
        <main className="flex-1 overflow-auto min-h-0 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
