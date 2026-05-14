'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { Home, Clapperboard } from 'lucide-react';

const snap: Transition = { type: 'spring', stiffness: 500, damping: 40 };

const NAV_NODES = [
  { href: '/',          icon: Home,          label: 'Home' },
  { href: '/dashboard', icon: Clapperboard,  label: 'Studio' },
] as const;

export default function GlobalSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-col items-center py-6 gap-2 shrink-0 relative"
      style={{
        width: 76,
        background: 'rgba(10,10,10,0.78)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        zIndex: 40,
      }}
    >
      {/* Brand glyph — minimalist B */}
      <Link
        href="/"
        className="flex items-center justify-center rounded-2xl mb-6 shrink-0"
        style={{
          width: 42,
          height: 42,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow:
            '0 4px 16px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.20) inset',
        }}
        title="Blubarber"
      >
        <span
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 22,
            fontWeight: 500,
            color: '#FFFFFF',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          B
        </span>
      </Link>

      {/* Nav nodes */}
      <div className="flex flex-col items-center gap-1 w-full px-2.5">
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
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
                    border: '1px solid rgba(255,255,255,0.20)',
                    boxShadow: '0 0 1px rgba(255,255,255,0.20) inset',
                  }}
                />
              )}

              <div className="relative flex flex-col items-center gap-1.5 py-3 w-full">
                <Icon
                  className="w-[18px] h-[18px] transition-colors"
                  style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.40)' }}
                />
                <span
                  className="text-[8px] uppercase leading-none transition-colors"
                  style={{
                    color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.32)',
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                  }}
                >
                  {label}
                </span>
              </div>

              {/* Tooltip on hover */}
              <div
                className="absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none
                           opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
              >
                <div
                  className="text-[10px] whitespace-nowrap px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                  }}
                >
                  {label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom — wordmark */}
      <div className="mt-auto flex flex-col items-center">
        <span
          className="text-[8px] uppercase tracking-[0.30em]"
          style={{
            color: 'rgba(255,255,255,0.20)',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 600,
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          Blubarber · MMXXVI
        </span>
      </div>
    </nav>
  );
}
