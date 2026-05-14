'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const slowSpring: Transition = { type: 'spring', stiffness: 56, damping: 18 };
const spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };

export default function Home() {
  return (
    <div className="relative">

      {/* Top wordmark — fixed, minimal */}
      <nav
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-10 py-6 z-30"
        style={{
          background: 'rgba(10,10,10,0.40)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span
          className="text-[14px] tracking-[0.32em] uppercase"
          style={{
            color: '#FFFFFF',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 600,
          }}
        >
          Blubarber
        </span>

        <Link
          href="/dashboard"
          className="text-[11px] tracking-[0.24em] uppercase transition-colors"
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 500,
          }}
        >
          Enter Studio
        </Link>
      </nav>

      {/* ─── Act I: Luxury 3D landing ───────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-24">
        <div className="flex flex-col items-center text-center max-w-3xl">

          {/* Quiet label */}
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 }}
            className="text-[10px] tracking-[0.34em] uppercase mb-10"
            style={{
              color: 'rgba(255,255,255,0.40)',
              fontFamily: 'var(--font-inter), sans-serif',
              fontWeight: 500,
            }}
          >
            EST. 2026  ·  London
          </motion.span>

          {/* The minimalist title */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...slowSpring, delay: 0.3 }}
            className="leading-[1.02] tracking-tight"
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontWeight: 400,
              fontSize: 'clamp(2.4rem, 6.8vw, 5.5rem)',
              color: '#FFFFFF',
              letterSpacing: '-0.015em',
              maxWidth: '18ch',
            }}
          >
            Professional Video Editing<br />
            for the{' '}
            <em
              style={{
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.78)',
              }}
            >
              Modern Barber
            </em>
            .
          </motion.h1>

          {/* Subtle separator */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ ...spring, delay: 0.65 }}
            className="mt-10 mb-10"
            style={{
              width: 64,
              height: 1,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.50) 50%, transparent 100%)',
            }}
          />

          {/* CTA — single, refined */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.75 }}
          >
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-3 px-9 py-3.5 rounded-full transition-all"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #D8D8D8 100%)',
                color: '#0A0A0A',
                border: '1px solid rgba(255,255,255,0.55)',
                boxShadow:
                  '0 12px 36px rgba(255,255,255,0.10), 0 0 1px rgba(255,255,255,0.55) inset',
                fontFamily: 'var(--font-inter), sans-serif',
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              Enter the Studio
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 6, 0] }}
            transition={{
              opacity: { delay: 1.2, duration: 0.6 },
              y: { delay: 1.2, repeat: Infinity, duration: 2.4, ease: 'easeInOut' },
            }}
            className="mt-20 flex flex-col items-center gap-3"
          >
            <span
              className="text-[9px] tracking-[0.30em] uppercase"
              style={{
                color: 'rgba(255,255,255,0.30)',
                fontFamily: 'var(--font-inter), sans-serif',
                fontWeight: 500,
              }}
            >
              Scroll
            </span>
            <div
              style={{
                width: 1,
                height: 36,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 100%)',
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* ─── Act II: Editorial section — single line, declarative ──────────── */}
      <section
        className="relative flex items-center justify-center px-6 py-32"
        style={{ minHeight: '80vh' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30%' }}
          transition={spring}
          className="max-w-2xl text-center"
        >
          <p
            className="leading-snug"
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontWeight: 300,
              fontSize: 'clamp(1.4rem, 3.2vw, 2.2rem)',
              color: 'rgba(255,255,255,0.82)',
              fontStyle: 'italic',
              letterSpacing: '-0.005em',
            }}
          >
            Upload the chair. We&apos;ll deliver the master.
          </p>

          <div
            className="mx-auto mt-10"
            style={{
              width: 48,
              height: 1,
              background: 'rgba(255,255,255,0.25)',
            }}
          />
        </motion.div>
      </section>

      {/* ─── Act III: Clean minimal footer ──────────────────────────────────── */}
      <footer
        className="relative flex items-center justify-between px-10 py-7 z-20"
        style={{
          background: 'rgba(10,10,10,0.40)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <span
          className="text-[11px] tracking-[0.32em] uppercase"
          style={{
            color: '#FFFFFF',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 600,
          }}
        >
          Blubarber
        </span>
        <span
          className="text-[9px] tracking-[0.22em] uppercase"
          style={{
            color: 'rgba(255,255,255,0.30)',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 500,
          }}
        >
          © 2026 · All Rights Reserved
        </span>
      </footer>
    </div>
  );
}
