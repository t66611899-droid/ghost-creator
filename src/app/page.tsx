'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { Scissors, ArrowRight, BookOpen, Target } from 'lucide-react';
import HeroGeometric from '@/components/ui/shape-landing-hero';
import { useSuiteStore } from '@/store/useSuiteStore';

const spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };

export default function Home() {
  const profile = useSuiteStore((s) => s.profile);
  const previewMissions = profile.contentPlan.slice(0, 9);

  return (
    <div className="relative">

      {/* Floating top nav — sits above the HeroGeometric and R3F canvas */}
      <nav
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-30"
        style={{
          background: 'rgba(10,10,10,0.55)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(234,88,12,0.14)', border: '1px solid rgba(234,88,12,0.30)' }}
          >
            <Scissors className="w-3.5 h-3.5" style={{ color: '#EA580C' }} />
          </div>
          <span className="text-sm font-black tracking-tight text-white">GHOST CREATOR</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/media-vault"
            className="text-xs font-semibold transition-colors px-3 py-1.5"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Vault
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-black uppercase tracking-widest text-white bg-[#EA580C] hover:bg-[#C2410C] px-4 py-2 rounded-lg transition-colors"
          >
            Open
          </Link>
        </div>
      </nav>

      {/* ─── Act 1: HeroGeometric (offset 0 → 0.3) ─────────────────────────── */}
      <HeroGeometric
        badge="BLUBARBER · BARBER · 2027"
        title1="Build a"
        title2="30-Day Content Empire"
        subtitle="Pre-loaded with the Blubarber roadmap — 30 viral-ready barber missions, each engineered with Reveal Flash, 1.2× keyword zoom, and Hormozi-style captions. Scroll to see your strategy."
        primaryHref="/dashboard"
        primaryLabel="Open Command Center"
        secondaryHref="/media-vault"
        secondaryLabel="Drop a Clip"
      />

      {/* ─── Act 2: Strategy Spotlight (offset 0.3 → 0.6) ───────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30%' }}
            transition={spring}
            className="text-center mb-12"
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{ color: '#EA580C', background: 'rgba(234,88,12,0.10)', border: '1px solid rgba(234,88,12,0.20)' }}
            >
              Act II · The Strategy
            </span>
            <h2 className="text-4xl font-black tracking-tight text-white mt-5 leading-tight">
              30 missions.<br />
              <span style={{ color: '#EA580C' }}>Zero filler.</span>
            </h2>
            <p className="text-sm mt-4 max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Trust → Authority → Conversion. Each mission is a unique 30–60 second
              video script with director notes engineered to stop a scroll within 2 seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {previewMissions.map((m, i) => (
              <motion.div
                key={m.day}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ ...spring, delay: 0.05 + i * 0.03 }}
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={{
                  background: 'rgba(10,10,10,0.55)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ color: '#EA580C', background: 'rgba(234,88,12,0.10)', border: '1px solid rgba(234,88,12,0.20)' }}
                  >
                    Day {m.day}
                  </span>
                  <Target className="w-3 h-3" style={{ color: 'rgba(234,88,12,0.60)' }} />
                </div>
                <h3 className="text-xs font-black text-white leading-snug">{m.missionTitle}</h3>
                <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {m.hookScript}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: 0.3 }}
            className="mt-8 flex justify-center"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              See all 30 missions <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Act 3: Closing (offset 0.6 → 1.0) ──────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30%' }}
            transition={spring}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{ color: '#EA580C', background: 'rgba(234,88,12,0.10)', border: '1px solid rgba(234,88,12,0.20)' }}
            >
              Act III · Ignition
            </span>

            <h2 className="text-4xl font-black tracking-tight text-white mt-5 leading-tight">
              Drop a clip.<br />
              <span style={{ color: '#EA580C' }}>The engine does the rest.</span>
            </h2>

            <p className="text-sm mt-4 max-w-lg mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Dead air purged. Captions burnt in Vivid Orange. Reveal Flash on every
              sentence. 1.2× zoom on every impact word. Output in 9:16. Built for
              the Blubarber chair, weaponized for everyone else.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/media-vault"
                className="inline-flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-black text-sm uppercase tracking-widest py-3.5 px-8 rounded-xl transition-colors"
                style={{ boxShadow: '0 8px 32px rgba(234,88,12,0.25)' }}
              >
                Drop Your First Clip
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold rounded-xl px-6 py-3 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <BookOpen className="w-4 h-4" /> View the Missions
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative flex items-center justify-between px-8 py-5 z-20"
        style={{
          background: 'rgba(10,10,10,0.40)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © 2026 Ghost Creator
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.20)' }}>
          Blubarber · Deepgram · OpenRouter · FFmpeg
        </span>
      </footer>
    </div>
  );
}
