'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { Transition } from 'framer-motion';
import { X } from 'lucide-react';
import GlobalSidebar from './GlobalSidebar';
import { useSuiteStore } from '@/store/useSuiteStore';

const _spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };

// Pages that show the sidebar shell
const SHELL_ROUTES = ['/dashboard', '/strategy', '/media-vault'];

function ShellHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { resetAll } = useSuiteStore();

  const handleReset = () => {
    resetAll();
    router.push('/');
  };

  const label = pathname.startsWith('/dashboard')
    ? 'Command Center'
    : pathname.startsWith('/strategy')
    ? 'Strategy'
    : pathname.startsWith('/media-vault')
    ? 'Media Vault'
    : 'Ghost Creator';

  return (
    <header
      className="flex items-center justify-between px-5 py-3 shrink-0 relative z-50"
      style={{
        background: 'rgba(10,10,10,0.50)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-black text-white tracking-tight">{label}</span>
      </div>

      <button
        onClick={handleReset}
        className="flex items-center gap-1.5 group cursor-pointer"
        title="Return Home & Reset"
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-wider transition-colors group-hover:text-white/60"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          Reset
        </span>
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center transition-colors group-hover:bg-white/[0.08]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <X className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </div>
      </button>
    </header>
  );
}

export default function SuiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShellRoute = SHELL_ROUTES.some((r) => pathname.startsWith(r));

  if (!isShellRoute) {
    // Landing page — full-bleed, no sidebar (the R3F bg lives behind the children)
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
