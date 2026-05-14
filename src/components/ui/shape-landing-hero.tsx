'use client';

import { motion } from 'framer-motion';
import { Circle } from 'lucide-react';
import Link from 'next/link';
import { ArrowRight, Film } from 'lucide-react';

// ─── Tiny class-name joiner (no clsx dep) ─────────────────────────────────────

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

// ─── Elegant rotating gradient shape ──────────────────────────────────────────
// Original Kokonut-style component uses indigo/rose/violet/cyan/amber.
// This version is locked to Blubarber Orange (#EA580C) + Carbon shades.

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = 'from-[#EA580C]/[0.20]',
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate: rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn('absolute', className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r to-transparent',
            gradient,
            'backdrop-blur-[2px] border-2 border-white/[0.12]',
            'shadow-[0_8px_32px_0_rgba(234,88,12,0.12)]',
            'after:absolute after:inset-0 after:rounded-full',
            'after:bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.25),transparent_70%)]',
          )}
        />
      </motion.div>
    </motion.div>
  );
}

// ─── HeroGeometric ────────────────────────────────────────────────────────────

interface HeroGeometricProps {
  badge?: string;
  title1?: string;
  title2?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export default function HeroGeometric({
  badge = 'BLUBARBER · BARBER',
  title1 = 'Build a',
  title2 = '30-Day Content Empire',
  subtitle = 'Ghost Creator is pre-loaded with the Blubarber roadmap — 30 viral-ready barber missions, each engineered with Reveal Flash, 1.2× keyword zoom, and Hormozi-style captions.',
  primaryHref = '/dashboard',
  primaryLabel = 'Open Command Center',
  secondaryHref = '/media-vault',
  secondaryLabel = 'Drop a Clip',
}: HeroGeometricProps) {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
      },
    }),
  };

  return (
    <section
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* Background wash — orange tint */}
      <div
        className="absolute inset-0 blur-3xl pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(234,88,12,0.06) 0%, rgba(10,10,10,0) 45%, rgba(234,88,12,0.08) 100%)',
        }}
      />

      {/* Elegant geometric shapes — orange variants only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-[#EA580C]/[0.22]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-[#C2410C]/[0.20]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-[#EA580C]/[0.18]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />
        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-[#F97316]/[0.18]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-white/[0.06]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 md:mb-12"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Circle className="h-2 w-2 fill-[#EA580C] text-[#EA580C]" />
            <span
              className="text-[11px] tracking-[0.18em] font-semibold uppercase"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              {badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-6 md:mb-8 tracking-tight leading-[0.95]">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.78) 100%)',
                }}
              >
                {title1}
              </span>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, #F97316 0%, #EA580C 50%, #C2410C 100%)',
                }}
              >
                {title2}
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <p
              className="text-sm sm:text-base md:text-lg mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {subtitle}
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-colors"
              style={{
                background: '#EA580C',
                color: '#fff',
                boxShadow: '0 12px 40px rgba(234,88,12,0.30)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#C2410C';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#EA580C';
              }}
            >
              {primaryLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.70)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = 'rgba(255,255,255,0.08)';
                el.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = 'rgba(255,255,255,0.04)';
                el.style.color = 'rgba(255,255,255,0.70)';
              }}
            >
              <Film className="w-4 h-4" />
              {secondaryLabel}
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Top + bottom vignette to blend with R3F background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,10,0.85) 0%, transparent 18%, transparent 80%, rgba(10,10,10,0.90) 100%)',
        }}
      />
    </section>
  );
}
