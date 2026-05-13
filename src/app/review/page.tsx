'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  Maximize2,
  Sparkles,
  GraduationCap,
  BookOpen,
  Zap,
  Check,
  ArrowUpRight,
  Wand2,
  Power,
  Activity,
  Scissors,
  Eye,
  CircleDot,
} from 'lucide-react';
import {
  MOCK_PROJECTS,
  VIRAL_HOOKS,
  STYLE_PRESETS,
  type HookType,
  type PresetKey,
  type ViralHook,
  type StylePreset,
} from '@/lib/mock-data';
import { cn, formatDuration } from '@/lib/utils';

const SPRING = { type: 'spring' as const, stiffness: 280, damping: 26 };
const SPRING_SOFT = { type: 'spring' as const, stiffness: 220, damping: 28 };

const HOOK_ICON: Record<HookType, React.ComponentType<{ className?: string }>> = {
  contrarian: Zap,
  educational: GraduationCap,
  story: BookOpen,
};

const HOOK_NEON: Record<HookType, string> = {
  contrarian: 'neon-ring-amber',
  educational: 'neon-ring-emerald',
  story: 'neon-ring-pink',
};

const PRESET_NEON: Record<PresetKey, string> = {
  barber: 'neon-ring-amber',
  gym: 'neon-ring-emerald',
  realestate: 'neon-ring-blue',
};

export default function ReviewDashboardPage() {
  const featured = MOCK_PROJECTS[0];
  const [selectedHook, setSelectedHook] = useState<HookType>('contrarian');
  const [preset, setPreset] = useState<PresetKey>('barber');
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] font-sans text-white">
      {/* Backdrop layers */}
      <BackdropOrbs />
      <Grid />
      <div className="pointer-events-none fixed inset-0 z-[1] grain" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050505]/70 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_30px_-4px_rgba(168,85,247,0.6)]">
              <Sparkles className="h-4 w-4" />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Ghost Creator</p>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-white/45">
                <CircleDot className="h-2.5 w-2.5 text-emerald-400" />
                Review · {featured.businessName}
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.02] p-1 backdrop-blur-xl md:flex">
            {['Review', 'Brain', 'Audit', 'Pricing'].map((t, i) => (
              <a
                key={t}
                href="#"
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  i === 0 ? 'bg-white/[0.08] text-white' : 'text-white/55 hover:text-white',
                )}
              >
                {t}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 neon-pulse" />
              Mock mode
            </span>
            <Link
              href="/engine"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_10px_36px_-10px_rgba(217,70,239,0.6)] transition-transform hover:scale-[1.02]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Power className="h-4 w-4" />
              Start engine
            </Link>
            <button className="hidden items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.06] sm:inline-flex">
              Publish <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-[1440px] px-8 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SOFT}
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 neon-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">
                Review &amp; ship
              </span>
            </div>
            <h1 className="display mt-3 text-[44px] font-extrabold leading-[1.05] text-white">
              Pick a hook. Lock the style. <br />
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
                Ship the cut.
              </span>
            </h1>
            <p className="mt-3 text-sm font-medium text-white/55 text-balance">
              Three viral angles generated from this client&rsquo;s footage — paired with niche-tuned
              caption presets. Hover any card to preview the cut on the left.
            </p>
          </div>

          <HeroMetaStack />
        </motion.div>
      </div>

      {/* Workspace */}
      <main className="relative z-10 mx-auto max-w-[1440px] px-8 pb-20 pt-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1.4fr_1fr]">
          <VideoPlayer playing={playing} onTogglePlay={() => setPlaying((p) => !p)} preset={preset} />

          <section className="flex flex-col gap-4">
            <ColumnTitle eyebrow="Generated hooks" title="Choose your angle" hint="3 of 12 generated" />
            <div className="flex flex-col gap-3">
              {VIRAL_HOOKS.map((hook, i) => (
                <HookCard
                  key={hook.type}
                  hook={hook}
                  index={i}
                  selected={selectedHook === hook.type}
                  onSelect={() => setSelectedHook(hook.type)}
                />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <ColumnTitle eyebrow="Caption style" title="Niche preset" hint="Brand-locked" />
            <div className="flex flex-col gap-3">
              {STYLE_PRESETS.map((p, i) => (
                <PresetCard
                  key={p.key}
                  preset={p}
                  index={i}
                  selected={preset === p.key}
                  onSelect={() => setPreset(p.key)}
                />
              ))}
            </div>
            <PresetSummary preset={STYLE_PRESETS.find((p) => p.key === preset)!} />
          </section>
        </div>
      </main>
    </div>
  );
}

/* ─── Backdrop ────────────────────────────────────────────── */
function BackdropOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="ambient-drift absolute -left-40 top-[-10%] h-[640px] w-[640px] rounded-full bg-violet-700/[0.18] blur-[140px]" />
      <div
        className="ambient-drift absolute -right-32 top-[20%] h-[520px] w-[520px] rounded-full bg-fuchsia-600/[0.14] blur-[140px]"
        style={{ animationDelay: '-4s' }}
      />
      <div
        className="ambient-drift absolute bottom-[-20%] left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-amber-500/[0.07] blur-[160px]"
        style={{ animationDelay: '-7s' }}
      />
    </div>
  );
}

function Grid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.05]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
        backgroundSize: '52px 52px',
        maskImage: 'radial-gradient(ellipse at 50% 0%, black 35%, transparent 75%)',
      }}
    />
  );
}

/* ─── Hero meta ──────────────────────────────────────────── */
function HeroMetaStack() {
  const stats = [
    { label: 'Pipeline', value: 'Brain v0.4', tone: 'text-violet-300' },
    { label: 'Hooks left', value: '9 / 12', tone: 'text-emerald-300' },
    { label: 'ETA', value: '00:08', tone: 'text-amber-300' },
  ];
  return (
    <div className="glass flex items-stretch divide-x divide-white/[0.06] overflow-hidden rounded-2xl">
      {stats.map((s) => (
        <div key={s.label} className="px-5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            {s.label}
          </p>
          <p className={cn('mt-1 text-base font-bold tracking-tight', s.tone)}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Column title ───────────────────────────────────────── */
function ColumnTitle({
  eyebrow,
  title,
  hint,
}: {
  eyebrow: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{eyebrow}</p>
        <h2 className="display mt-1.5 text-xl font-extrabold tracking-tight">{title}</h2>
      </div>
      <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-semibold text-white/45">
        {hint}
      </span>
    </div>
  );
}

/* ─── Video player ───────────────────────────────────────── */
function VideoPlayer({
  playing,
  onTogglePlay,
  preset,
}: {
  playing: boolean;
  onTogglePlay: () => void;
  preset: PresetKey;
}) {
  const project = MOCK_PROJECTS[0];
  const progress = 38;
  const score = project.engagementScore;
  const presetCfg = STYLE_PRESETS.find((p) => p.key === preset)!;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.05 }}
      className="glass-strong relative overflow-hidden rounded-3xl"
    >
      {/* Top hairline accent */}
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      {/* Stage */}
      <div className="relative aspect-video overflow-hidden rounded-t-3xl bg-black">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(135deg, ${project.thumbnailGradient.from} 0%, ${project.thumbnailGradient.to} 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.28),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
        <div className="pointer-events-none absolute inset-0 grain opacity-[0.07] mix-blend-overlay" />

        {/* Top meta */}
        <div className="absolute left-5 top-5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-300 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 neon-pulse" />
            Live preview
          </span>
          <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur">
            9:16 · {formatDuration(project.duration)}
          </span>
        </div>

        {/* Score gauge top-right */}
        <div className="absolute right-5 top-5">
          <ScoreGauge value={score} />
        </div>

        {/* Play button */}
        <motion.button
          onClick={onTogglePlay}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={SPRING}
          className="group absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-[0_30px_70px_-10px_rgba(0,0,0,0.85)] ring-[6px] ring-white/[0.08]"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-white/80" />
          <span className="absolute -inset-2 rounded-full bg-violet-400/20 blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />
          {playing ? (
            <Pause className="relative h-7 w-7" fill="currentColor" />
          ) : (
            <Play className="relative h-7 w-7 translate-x-0.5" fill="currentColor" />
          )}
        </motion.button>

        {/* Caption mock — driven by selected preset */}
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-6">
          <span
            className="rounded-2xl border border-white/15 bg-black/55 px-4 py-2 text-base uppercase tracking-tight text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)] backdrop-blur"
            style={{
              fontWeight: Number(presetCfg.fontWeight),
              backgroundImage: `linear-gradient(135deg, ${presetCfg.palette.from}33, ${presetCfg.palette.to}33), rgba(0,0,0,0.55)`,
            }}
          >
            <span style={{ color: presetCfg.palette.from }}>most barbers</span> skip this step.
          </span>
        </div>

        {/* Title row */}
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">
              {project.businessName}
            </p>
            <h3 className="display mt-1 line-clamp-1 text-xl font-extrabold tracking-tight">
              {project.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {project.platforms.map((p) => (
              <span
                key={p}
                className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/85 backdrop-blur"
              >
                {p === 'tiktok' ? 'TT' : p === 'instagram' ? 'IG' : 'YT'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Controls strip */}
      <div className="relative flex items-center gap-4 px-6 py-4">
        <button
          onClick={onTogglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
        >
          {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 translate-x-0.5" fill="currentColor" />}
        </button>
        <div className="flex-1">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            <span
              style={{ left: `${progress}%` }}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_2px_rgba(168,85,247,0.5)]"
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
            <span>0:18</span>
            <span>{formatDuration(project.duration)}</span>
          </div>
        </div>
        <button className="rounded-xl p-2 text-white/55 hover:bg-white/[0.06] hover:text-white">
          <Volume2 className="h-4 w-4" />
        </button>
        <button className="rounded-xl p-2 text-white/55 hover:bg-white/[0.06] hover:text-white">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Telemetry strip */}
      <div className="grid grid-cols-3 gap-3 border-t border-white/[0.05] px-6 py-4">
        <Telemetry icon={<Scissors className="h-3.5 w-3.5" />} label="Cut" value="56%" tint="text-emerald-300" />
        <Telemetry icon={<Eye className="h-3.5 w-3.5" />} label="Retention" value={`${project.retentionEstimate}%`} tint="text-violet-300" />
        <Telemetry icon={<Activity className="h-3.5 w-3.5" />} label="Hook" value={project.hookStrength} tint="text-amber-300" />
      </div>
    </motion.section>
  );
}

function Telemetry({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tint: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
      <div className={cn('flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.18em]', tint)}>
        {icon}
        {label}
      </div>
      <p className="mt-1 text-base font-extrabold tracking-tight text-white">{value}</p>
    </div>
  );
}

function ScoreGauge({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const display = useTransform(useSpring(mv, { stiffness: 90, damping: 18 }), (v) => Math.round(v));
  const [shown, setShown] = useState(0);

  useEffect(() => {
    mv.set(value);
    const unsub = display.on('change', (v) => setShown(v));
    return () => unsub();
  }, [value, mv, display]);

  const radius = 26;
  const c = 2 * Math.PI * radius;
  const dash = c - (c * value) / 100;

  return (
    <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-white/15 bg-black/55 backdrop-blur">
      <svg width={64} height={64} viewBox="0 0 64 64" className="absolute inset-1">
        <defs>
          <linearGradient id="gauge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#e879f9" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          stroke="url(#gauge)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          transform="rotate(-90 32 32)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: dash }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="relative text-center">
        <p className="text-base font-extrabold leading-none">{shown}</p>
        <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-white/50">Score</p>
      </div>
    </div>
  );
}

/* ─── Hook card ──────────────────────────────────────────── */
function HookCard({
  hook,
  index,
  selected,
  onSelect,
}: {
  hook: ViralHook;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = HOOK_ICON[hook.type];
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const onMouseMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  const spotlight = useTransform(
    () => `radial-gradient(280px circle at ${mx.get()}px ${my.get()}px, ${hook.accent.from}22, transparent 60%)`,
  );

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onSelect}
      onMouseMove={onMouseMove}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.1 + index * 0.07 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'glass group relative w-full overflow-hidden rounded-3xl p-5 text-left transition-colors',
        selected && HOOK_NEON[hook.type],
      )}
    >
      {/* Cursor spotlight */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: spotlight }}
      />

      {/* Top hairline accent */}
      <span
        className="pointer-events-none absolute inset-x-5 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${hook.accent.from}, ${hook.accent.to}, transparent)` }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ring-white/15"
            style={{
              backgroundImage: `linear-gradient(135deg, ${hook.accent.from}, ${hook.accent.to})`,
              boxShadow: `0 0 24px -6px ${hook.accent.from}80`,
            }}
          >
            <Icon className="h-4 w-4 text-white" />
            <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
          </span>
          <div>
            <p className="text-[15px] font-extrabold tracking-tight">{hook.label}</p>
            <p className="text-[11px] font-medium text-white/45">{hook.tagline}</p>
          </div>
        </div>
        <motion.span
          animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
          transition={SPRING}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black shadow-[0_0_12px_-2px_rgba(255,255,255,0.6)]"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      </div>

      {/* Hook quote */}
      <div className="relative mt-4 rounded-2xl border border-white/[0.05] bg-black/30 p-3.5">
        <span
          className="absolute -left-px top-3 h-[calc(100%-1.5rem)] w-[2px] rounded-full"
          style={{ background: `linear-gradient(180deg, ${hook.accent.from}, ${hook.accent.to})` }}
        />
        <p className="text-[14px] font-semibold leading-snug text-white/95">
          {hook.hookLine}
        </p>
      </div>

      {/* Stats */}
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <Stat label="Score" value={hook.predictedScore} suffix="/100" />
        <Stat label="Retention" value={`${hook.retention}%`} />
        <Stat label="Reach" value={hook.reach} small />
      </div>
    </motion.button>
  );
}

function Stat({
  label,
  value,
  suffix,
  small,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 backdrop-blur">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className={cn('mt-0.5 font-extrabold text-white', small ? 'text-[11px]' : 'text-sm')}>
        {value}
        {suffix && <span className="font-semibold text-white/40">{suffix}</span>}
      </p>
    </div>
  );
}

/* ─── Preset card ────────────────────────────────────────── */
function PresetCard({
  preset,
  index,
  selected,
  onSelect,
}: {
  preset: StylePreset;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRING, delay: 0.12 + index * 0.06 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'glass group relative w-full overflow-hidden rounded-2xl p-4 text-left transition-colors',
        selected && PRESET_NEON[preset.key],
      )}
    >
      <span
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${preset.palette.from}, transparent)` }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative">
            <span
              className="block h-10 w-10 rounded-2xl ring-1 ring-white/15"
              style={{
                backgroundImage: `linear-gradient(135deg, ${preset.palette.from}, ${preset.palette.to})`,
                boxShadow: `0 0 26px -6px ${preset.palette.from}90`,
              }}
            />
            <span className="absolute inset-1 rounded-xl bg-gradient-to-br from-white/30 to-transparent opacity-60" />
          </span>
          <div>
            <p className="text-[15px] font-extrabold tracking-tight">{preset.label}</p>
            <p className="text-[11px] font-medium text-white/45">{preset.vibe}</p>
          </div>
        </div>
        <motion.span
          animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 0.6 }}
          transition={SPRING}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </motion.span>
      </div>

      <p className="mt-3 text-xs font-medium leading-snug text-white/55">{preset.description}</p>
    </motion.button>
  );
}

function PresetSummary({ preset }: { preset: StylePreset }) {
  return (
    <motion.div
      key={preset.key}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="glass relative overflow-hidden rounded-2xl p-4"
    >
      <span
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${preset.palette.from}, ${preset.palette.to}, transparent)` }}
      />

      <div className="flex items-center gap-2">
        <Wand2 className="h-3.5 w-3.5 text-fuchsia-300" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Preview</p>
      </div>

      <p
        className="mt-3 rounded-xl border border-white/[0.06] bg-black/40 px-3 py-3 text-center text-sm uppercase tracking-tight text-white"
        style={{
          fontWeight: Number(preset.fontWeight),
          backgroundImage: `linear-gradient(135deg, ${preset.palette.from}1f, ${preset.palette.to}1f)`,
          textShadow: `0 0 18px ${preset.palette.from}66`,
        }}
      >
        {preset.caption}
      </p>
      <p className="mt-3 text-[11px] font-medium text-white/45">
        Applied to all generated cuts when this preset is active.
      </p>
    </motion.div>
  );
}
