'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { Scissors, Home, LayoutDashboard, Map, Film } from 'lucide-react';

const snap: Transition = { type: 'spring', stiffness: 500, damping: 40 };

const NAV_NODES = [
  { href: '/',            icon: Home,             label: 'Home' },
  { href: '/dashboard',   icon: LayoutDashboard,  label: 'Dashboard' },
  { href: '/strategy',    icon: Map,              label: 'Strategy' },
  { href: '/media-vault', icon: Film,             label: 'Media Vault' },
] as const;

export default function GlobalSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-col items-center py-5 gap-1 shrink-0 z-40 relative"
      style={{
        width: 64,
        background: 'rgba(10,10,10,0.80)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Wordmark icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mb-5 shrink-0"
        style={{ background: '#EA580C', boxShadow: '0 0 20px rgba(234,88,12,0.35)' }}
      >
        <Scissors className="w-4 h-4 text-white" />
      </div>

      {/* Nav nodes */}
      <div className="flex flex-col items-center gap-1 w-full px-2">
        {NAV_NODES.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);

          return (
            <Link key={href} href={href} className="relative w-full flex flex-col items-center group">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  transition={snap}
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'rgba(234,88,12,0.12)',
                    border: '1px solid rgba(234,88,12,0.25)',
                  }}
                />
              )}

              <div className="relative flex flex-col items-center gap-1 py-2.5 w-full">
                <Icon
                  className="w-4 h-4 transition-colors"
                  style={{ color: isActive ? '#EA580C' : 'rgba(255,255,255,0.28)' }}
                />
                <span
                  className="text-[8px] font-semibold uppercase tracking-wide transition-colors leading-none"
                  style={{ color: isActive ? '#EA580C' : 'rgba(255,255,255,0.20)' }}
                >
                  {label}
                </span>
              </div>

              {/* Tooltip on hover */}
              <div
                className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 pointer-events-none
                           opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
              >
                <div
                  className="text-[10px] font-semibold text-white whitespace-nowrap px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom spacer dot — version indicator */}
      <div className="mt-auto flex flex-col items-center gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: 'rgba(234,88,12,0.5)' }}
        />
        <span className="text-[7px] font-mono" style={{ color: 'rgba(255,255,255,0.12)' }}>v2</span>
      </div>
    </nav>
  );
}
