'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transition } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Upload,
  Scissors,
  Zap,
  BarChart3,
  FileVideo,
  Loader2,
  ChevronRight,
  Clock,
  TrendingUp,
  Globe,
  Download,
  Sparkles,
  Target,
  Camera,
  BookOpen,
  Settings,
  Activity,
  List,
  Flame,
} from 'lucide-react';

import VideoCanvas from '@/components/dashboard/VideoCanvas';
import ViralGauge from '@/components/dashboard/ViralGauge';
import LogFeed, { makeLogEntry } from '@/components/dashboard/LogFeed';
import type { LogEntry } from '@/components/dashboard/LogFeed';
import type { WordTimestamp } from '@/components/dashboard/VideoCanvas';
import type { NicheAnalysis, PipelineResult, SSEEventMap } from '@/types/api';
import type { BusinessProfile, ContentMission } from '@/types/profile';
import { INDUSTRY_STYLE_MAP } from '@/types/profile';
import { useSuiteStore } from '@/store/useSuiteStore';

const HolographicSphere = dynamic(
  () => import('@/components/3d/HolographicSphere'),
  { ssr: false, loading: () => <div style={{ width: 200, height: 200 }} /> }
);

// ─── Springs ──────────────────────────────────────────────────────────────────

const spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };
const fastSpring: Transition = { type: 'spring', stiffness: 300, damping: 30 };

// ─── Primitives ───────────────────────────────────────────────────────────────

function GlassCard({ children, className = '', orange = false }: { children: React.ReactNode; className?: string; orange?: boolean }) {
  return (
    <div
      className={`backdrop-blur-xl border rounded-2xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: orange ? '0 0 40px rgba(234,88,12,0.08)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded ${className}`} style={{ background: 'rgba(255,255,255,0.06)' }} />;
}

function MetricCard({ label, value, sub, icon: Icon, loading = false }: {
  label: string; value?: string; sub?: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; loading?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={fastSpring}
      className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-default"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(234,88,12,0.10)', border: '1px solid rgba(234,88,12,0.20)' }}>
        <Icon className="w-4 h-4" style={{ color: '#EA580C' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>{label}</p>
        {loading ? (
          <><Skeleton className="h-4 w-16 mt-1" /><Skeleton className="h-2.5 w-24 mt-1" /></>
        ) : (
          <><p className="text-base font-black text-white leading-tight">{value ?? '—'}</p>
            {sub && <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</p>}</>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type DashTab = 'pulse' | 'projects' | 'insights';

const TABS: { id: DashTab; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
  { id: 'pulse',    label: 'Niche Pulse',     icon: Activity },
  { id: 'projects', label: 'Project List',    icon: List },
  { id: 'insights', label: 'Viral Insights',  icon: Flame },
];

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({ onFile, isProcessing, phase }: { onFile: (f: File) => void; isProcessing: boolean; phase: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDrag, setIsDrag] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDrag(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('video/') || f.type.startsWith('audio/'));
    if (file) onFile(file);
  }, [onFile]);

  return (
    <motion.div
      whileHover={{ scale: isProcessing ? 1 : 1.01 }}
      whileTap={{ scale: isProcessing ? 1 : 0.98 }}
      transition={fastSpring}
      className="relative rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all"
      style={{
        borderColor: isDrag ? 'rgba(234,88,12,0.60)' : 'rgba(255,255,255,0.08)',
        background: isDrag ? 'rgba(234,88,12,0.05)' : 'rgba(255,255,255,0.02)',
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
      onDragLeave={() => setIsDrag(false)}
      onDrop={handleDrop}
      onClick={() => !isProcessing && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div className="flex flex-col items-center gap-2 py-6 px-4">
        {isProcessing ? (
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#EA580C' }} />
        ) : (
          <Upload className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.20)' }} />
        )}
        <p className="text-xs font-medium text-center leading-snug" style={{ color: 'rgba(255,255,255,0.30)' }}>
          {isProcessing ? phase || 'Processing…' : 'Drop video / audio or click'}
        </p>
      </div>
    </motion.div>
  );
}

// ─── SSE parser ───────────────────────────────────────────────────────────────

function parseSSEBuffer(buffer: string): Array<{ event: string; data: unknown }> {
  const events: Array<{ event: string; data: unknown }> = [];
  for (const block of buffer.split('\n\n')) {
    if (!block.trim()) continue;
    let event = '', dataStr = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7).trim();
      else if (line.startsWith('data: ')) dataStr = line.slice(6);
    }
    if (event && dataStr) {
      try { events.push({ event, data: JSON.parse(dataStr) }); } catch { /* skip */ }
    }
  }
  return events;
}

// ─── Mission card ─────────────────────────────────────────────────────────────

function MissionCard({ mission, day, isRTL }: { mission: ContentMission; day: number; isRTL: boolean }) {
  const [tab, setTab] = useState<'script' | 'director'>('script');
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="w-full backdrop-blur-xl border rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 0 40px rgba(234,88,12,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-2.5 py-0.5 rounded-full" style={{ color: '#EA580C', background: 'rgba(234,88,12,0.10)', border: '1px solid rgba(234,88,12,0.20)' }}>
          <Target className="w-3 h-3" /> Mission · Day {day}
        </span>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['script', 'director'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all"
              style={{ background: tab === t ? '#EA580C' : 'transparent', color: tab === t ? '#fff' : 'rgba(255,255,255,0.30)' }}
            >
              {t === 'script' ? <><BookOpen className="w-3 h-3" /> Script</> : <><Camera className="w-3 h-3" /> Director</>}
            </button>
          ))}
        </div>
      </div>
      <h3 className="text-base font-black leading-tight text-white">{mission.missionTitle}</h3>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {tab === 'script' ? (
            <p className="text-sm leading-relaxed whitespace-pre-line" dir={isRTL ? 'rtl' : 'ltr'} style={{ color: 'rgba(255,255,255,0.80)', fontFamily: isRTL ? 'var(--font-rubik)' : undefined }}>
              {mission.hookScript || '—'}
            </p>
          ) : (
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>{mission.directorNotes || '—'}</p>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Niche badge ──────────────────────────────────────────────────────────────

function NicheBadge({ niche }: { niche: NicheAnalysis }) {
  return (
    <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}
      className="backdrop-blur-sm border rounded-xl px-3 py-2.5 flex flex-col gap-1"
      style={{ background: 'rgba(234,88,12,0.06)', borderColor: 'rgba(234,88,12,0.20)', boxShadow: '0 0 20px rgba(234,88,12,0.06)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>Niche</span>
        <span className="text-[10px] font-mono" style={{ color: '#EA580C' }}>{niche.confidence}% confident</span>
      </div>
      <p className="text-sm font-black text-white capitalize">{niche.niche}</p>
      <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.20)' }}>Style → {niche.styleKey}</p>
    </motion.div>
  );
}

function LanguageBadge({ language, isRTL }: { language: string; isRTL: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Globe className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.30)' }} />
      <span className="text-[10px] font-mono uppercase" style={{ color: 'rgba(255,255,255,0.50)' }}>{language}</span>
      {isRTL && <span className="text-[9px] font-bold px-1 rounded" style={{ color: '#EA580C', border: '1px solid rgba(234,88,12,0.30)' }}>RTL</span>}
    </div>
  );
}

// ─── Dashboard state ──────────────────────────────────────────────────────────

interface DashboardState {
  words: WordTimestamp[];
  wordCount: number | null;
  duration: number | null;
  language: string | null;
  isRTL: boolean;
  niche: NicheAnalysis | null;
  pipeline: PipelineResult | null;
  viralScore: number | null;
}

const EMPTY_STATE: DashboardState = {
  words: [], wordCount: null, duration: null, language: null,
  isRTL: false, niche: null, pipeline: null, viralScore: null,
};

// ─── Tab panels ───────────────────────────────────────────────────────────────

function NichePulseTab({
  state, isProcessing, phase, profile, missionDay, setMissionDay, videoSrc,
  activeStyle, setActiveStyle, onFile, onRender, isRendering,
}: {
  state: DashboardState;
  isProcessing: boolean;
  phase: string;
  profile: BusinessProfile;
  missionDay: number;
  setMissionDay: React.Dispatch<React.SetStateAction<number>>;
  videoSrc: string | undefined;
  activeStyle: string;
  setActiveStyle: (s: string) => void;
  onFile: (f: File) => void;
  onRender: () => void;
  isRendering: boolean;
}) {
  const { words, wordCount, duration, language, isRTL, niche, pipeline, viralScore } = state;
  const hasData = wordCount !== null;
  const highlightColor = niche?.styleKey === 'hvac' ? '#FFFF00' : '#EA580C';
  const styleList = ['barber', 'gym', 'hvac', 'vibrant', 'minimal'];
  const todayMission = profile.contentPlan?.[(missionDay - 1) % 30] ?? null;
  const profileIsRTL = profile.language === 'he' || profile.language === 'he+en';

  return (
    <div className="grid grid-cols-[260px_1fr_280px] h-full overflow-hidden min-h-0">
      {/* Left */}
      <div className="border-r flex flex-col gap-4 p-5 overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.20)' }}>Upload</p>
          <UploadZone onFile={onFile} isProcessing={isProcessing} phase={phase} />
        </div>

        <AnimatePresence>
          {niche && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={spring}>
              <NicheBadge niche={niche} />
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.20)' }}>Metrics</p>
          <div className="flex flex-col gap-2">
            <MetricCard label="Words" icon={BarChart3} loading={isProcessing && wordCount === null} value={wordCount?.toString()} sub={duration !== null ? `${duration.toFixed(1)}s total` : undefined} />
            <MetricCard label="Compression" icon={TrendingUp} loading={isProcessing && pipeline === null} value={pipeline ? `${pipeline.metrics.compressionRatio}%` : undefined} sub={pipeline ? `${pipeline.metrics.timeSaved.toFixed(1)}s removed` : undefined} />
            <MetricCard label="Ramp Zones" icon={Zap} loading={isProcessing && pipeline === null} value={pipeline?.ramp ? pipeline.ramp.totalZones.toString() : pipeline ? '0' : undefined} sub={pipeline?.ramp ? `avg ${pipeline.ramp.averageRamp.toFixed(2)}s anticipation` : undefined} />
            <MetricCard label="Style" icon={FileVideo} loading={isProcessing && niche === null} value={niche ? niche.styleKey.charAt(0).toUpperCase() + niche.styleKey.slice(1) : undefined} sub={niche ? '9:16 · detected niche' : undefined} />
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.20)' }}>Caption Mode</p>
          <div className="flex flex-col gap-1.5">
            {styleList.map((style) => (
              <motion.button
                key={style}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveStyle(style)}
                className="flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer"
                style={{
                  borderColor: activeStyle === style ? 'rgba(234,88,12,0.40)' : 'rgba(255,255,255,0.06)',
                  background: activeStyle === style ? 'rgba(234,88,12,0.08)' : 'rgba(255,255,255,0.02)',
                  color: activeStyle === style ? '#EA580C' : 'rgba(255,255,255,0.30)',
                }}
              >
                {style}
                {activeStyle === style && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#EA580C' }} />}
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {hasData && !isProcessing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={spring}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onRender}
                disabled={isRendering}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-colors cursor-pointer"
                style={{
                  background: isRendering ? 'rgba(255,255,255,0.04)' : '#EA580C',
                  border: isRendering ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  color: isRendering ? 'rgba(255,255,255,0.20)' : '#fff',
                }}
              >
                {isRendering
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Rendering…</>
                  : <><Sparkles className="w-4 h-4" /> Magic Render <Download className="w-4 h-4" /></>}
              </motion.button>
              <p className="text-[9px] text-center mt-2 font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
                Burns Hebrew captions · Speed ramp · Downloads MP4
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center */}
      <div
        className="flex flex-col items-center p-6 overflow-y-auto gap-6"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(234,88,12,0.04) 0%, transparent 60%)' }}
      >
        {todayMission && (
          <div className="w-full" style={{ maxWidth: 420 }}>
            <MissionCard mission={todayMission} day={missionDay} isRTL={profileIsRTL} />
            {profile.contentPlan.length > 1 && (
              <div className="mt-2 flex items-center justify-between px-1">
                <button onClick={() => setMissionDay((d) => Math.max(1, d - 1))} disabled={missionDay <= 1} className="text-[10px] font-mono transition-colors cursor-pointer disabled:opacity-30" style={{ color: 'rgba(255,255,255,0.25)' }}>← prev</button>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.20)' }}>{missionDay} / 30</span>
                <button onClick={() => setMissionDay((d) => Math.min(30, d + 1))} disabled={missionDay >= 30} className="text-[10px] font-mono transition-colors cursor-pointer disabled:opacity-30" style={{ color: 'rgba(255,255,255,0.25)' }}>next →</button>
              </div>
            )}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring, delay: 0.18 }}
          style={{ maxWidth: 340, width: '100%', filter: 'drop-shadow(0 32px 60px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(234,88,12,0.06))' }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={videoSrc ?? 'empty'} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
              <VideoCanvas words={words} videoSrc={videoSrc} isRTL={isRTL} highlightColor={highlightColor} onFileSelect={onFile} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.20)' }} />
          {isProcessing && wordCount === null ? (
            <Skeleton className="h-3 w-48" />
          ) : hasData ? (
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{wordCount} words · {isRTL ? 'RTL' : 'LTR'} · 4-word cues</span>
          ) : (
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>Upload a video to film today&apos;s mission</span>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="border-l flex flex-col gap-4 p-5 overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <GlassCard className="p-5 flex flex-col items-center gap-4" orange>
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold self-start" style={{ color: 'rgba(255,255,255,0.20)' }}>Viral Confidence</p>
          <div className="relative flex flex-col items-center">
            <HolographicSphere confidence={viralScore ?? 0} size={200} />
            <motion.div className="flex flex-col items-center -mt-4" key={viralScore ?? 'none'} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
              <span className="text-4xl font-black text-white leading-none tabular-nums">{viralScore ?? 0}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {viralScore === null ? 'awaiting upload' : viralScore >= 75 ? 'HIGH VIRALITY' : viralScore >= 45 ? 'BUILDING' : 'LOW'}
              </span>
            </motion.div>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div className="h-full rounded-full" style={{ background: '#EA580C' }} initial={{ width: 0 }} animate={{ width: `${viralScore ?? 0}%` }} transition={{ ...spring, delay: 0.2 }} />
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col items-center p-4">
          {isProcessing && viralScore === null ? (
            <div className="flex flex-col items-center gap-3 py-4"><Skeleton className="w-[180px] h-[100px] rounded-xl" /><Skeleton className="h-3 w-28" /></div>
          ) : (
            <ViralGauge value={viralScore ?? 0} size={220} />
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function ProjectListTab({ profile, isRTL }: { profile: BusinessProfile; isRTL: boolean }) {
  const [selected, setSelected] = useState(0);
  const missions = profile.contentPlan ?? [];

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Mission list */}
      <div className="w-64 border-r flex flex-col overflow-y-auto shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {missions.map((m, i) => (
          <button
            key={m.day}
            onClick={() => setSelected(i)}
            className="flex items-center gap-3 px-4 py-3 text-left border-b transition-colors"
            style={{
              borderColor: 'rgba(255,255,255,0.04)',
              background: selected === i ? 'rgba(234,88,12,0.08)' : 'transparent',
            }}
          >
            <span
              className="w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center shrink-0"
              style={{ background: selected === i ? '#EA580C' : 'rgba(255,255,255,0.06)', color: selected === i ? '#fff' : 'rgba(255,255,255,0.30)' }}
            >
              {m.day}
            </span>
            <span
              className="text-xs font-semibold leading-tight truncate"
              style={{ color: selected === i ? '#fff' : 'rgba(255,255,255,0.40)' }}
            >
              {m.missionTitle}
            </span>
          </button>
        ))}
      </div>

      {/* Detail view */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(234,88,12,0.03) 0%, transparent 60%)' }}>
        {missions[selected] && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={spring}
              className="max-w-xl mx-auto flex flex-col gap-5"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ color: '#EA580C', background: 'rgba(234,88,12,0.10)', border: '1px solid rgba(234,88,12,0.20)' }}>
                  Day {missions[selected].day}
                </span>
              </div>
              <h2 className="text-2xl font-black leading-tight text-white">{missions[selected].missionTitle}</h2>

              <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>Hook Script</p>
                <p
                  className="text-sm leading-relaxed whitespace-pre-line text-white"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  style={isRTL ? { fontFamily: 'var(--font-rubik)' } : {}}
                >
                  {missions[selected].hookScript || '—'}
                </p>
              </div>

              <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>Director Notes</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>{missions[selected].directorNotes || '—'}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function ViralInsightsTab({ state, logs }: { state: DashboardState; logs: LogEntry[] }) {
  const { viralScore, niche, pipeline, wordCount, duration } = state;

  const factors = [
    { label: 'Hook Strength', value: viralScore ? Math.min(100, Math.round(viralScore * 0.35 * 2.86)) : 0, weight: '35%' },
    { label: 'Visual Variety', value: viralScore ? Math.min(100, Math.round(viralScore * 0.20 * 5)) : 0, weight: '20%' },
    { label: 'Transformation Arc', value: viralScore ? Math.min(100, Math.round(viralScore * 0.20 * 5)) : 0, weight: '20%' },
    { label: 'RTL / Cultural Fit', value: niche ? (state.isRTL ? 85 : 50) : 0, weight: '15%' },
    { label: 'CTA Clarity', value: viralScore ? Math.min(100, Math.round(viralScore * 0.10 * 10)) : 0, weight: '10%' },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4 max-w-4xl">
        {[
          { label: 'Viral Score', value: viralScore !== null ? `${viralScore}/100` : '—', sub: viralScore !== null ? (viralScore >= 75 ? 'High virality' : 'Building') : 'Upload to score' },
          { label: 'Words Spoken', value: wordCount !== null ? wordCount.toString() : '—', sub: duration !== null ? `in ${duration.toFixed(1)}s` : 'No audio yet' },
          { label: 'Compression', value: pipeline ? `${pipeline.metrics.compressionRatio}%` : '—', sub: pipeline ? `${pipeline.metrics.timeSaved.toFixed(1)}s removed` : 'No video yet' },
        ].map(({ label, value, sub }) => (
          <GlassCard key={label} className="p-4 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</p>
          </GlassCard>
        ))}
      </div>

      {/* Virality breakdown */}
      <div className="max-w-4xl">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.30)' }}>Virality Breakdown</p>
        <div className="flex flex-col gap-3">
          {factors.map(({ label, value, weight }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="flex items-center justify-between" style={{ width: 200 }}>
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>{label}</span>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{weight}</span>
              </div>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: '#EA580C' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ ...spring, delay: 0.1 }}
                />
              </div>
              <span className="text-xs font-mono tabular-nums text-white w-8 text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ghost Feed */}
      <div className="max-w-4xl flex-1">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.30)' }}>Ghost Feed</p>
        <LogFeed entries={logs} maxHeight={320} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const profile = useSuiteStore((s) => s.profile);
  const [missionDay, setMissionDay] = useState(1);
  const [state, setState] = useState<DashboardState>(EMPTY_STATE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [phase, setPhase] = useState('');
  const [activeStyle, setActiveStyle] = useState<string>(
    INDUSTRY_STYLE_MAP[profile.industry] ?? 'barber'
  );
  const [isRendering, setIsRendering] = useState(false);
  const [activeTab, setActiveTab] = useState<DashTab>('pulse');
  const uploadedFileRef = useRef<File | null>(null);

  useEffect(() => {
    setActiveStyle(INDUSTRY_STYLE_MAP[profile.industry] ?? 'barber');
    const created = new Date(profile.createdAt).getTime();
    const dayIndex = Math.floor((Date.now() - created) / 86_400_000) % 30;
    setMissionDay(dayIndex + 1);
  }, [profile]);

  const pushLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev.slice(-99), entry]);
  }, []);

  const handleSSEEvent = useCallback((event: string, data: SSEEventMap[keyof SSEEventMap]) => {
    switch (event) {
      case 'log': {
        const p = data as SSEEventMap['log'];
        pushLog(makeLogEntry(p.level, p.message, p.detail));
        if (p.level === 'engine') setPhase(p.message);
        break;
      }
      case 'words': {
        const p = data as SSEEventMap['words'];
        setState((s) => ({ ...s, words: p.words, wordCount: p.wordCount, duration: p.duration, language: p.language, isRTL: p.isRTL }));
        break;
      }
      case 'niche': {
        const p = data as SSEEventMap['niche'];
        setState((s) => ({ ...s, niche: p, viralScore: p.viralScore }));
        setActiveStyle(p.styleKey);
        break;
      }
      case 'pipeline': {
        const p = data as SSEEventMap['pipeline'];
        setState((s) => ({ ...s, pipeline: p }));
        break;
      }
      case 'done': { setIsProcessing(false); setPhase(''); break; }
      case 'error': { setIsProcessing(false); setPhase(''); break; }
    }
  }, [pushLog]);

  const handleRender = useCallback(async () => {
    const file = uploadedFileRef.current;
    if (!file || state.words.length === 0) return;
    setIsRendering(true);
    pushLog(makeLogEntry('engine', 'MAGIC RENDER started — running FFmpeg…'));
    try {
      const form = new FormData();
      form.append('video', file);
      form.append('words', JSON.stringify(state.words));
      form.append('styleKey', activeStyle || state.niche?.styleKey || 'barber');
      form.append('isRTL', String(state.isRTL));
      form.append('duration', String(state.duration ?? state.words[state.words.length - 1]?.end ?? 0));
      const res = await fetch('/api/render', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Render failed' }));
        pushLog(makeLogEntry('error', 'Render failed', (err as { error: string }).error));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${file.name.replace(/\.[^.]+$/, '')}-ghost.mp4`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      pushLog(makeLogEntry('success', 'MP4 downloaded — render complete'));
    } catch (err) {
      pushLog(makeLogEntry('error', 'Render error', String(err)));
    } finally { setIsRendering(false); }
  }, [state, activeStyle, pushLog]);

  const handleFile = useCallback(async (file: File) => {
    uploadedFileRef.current = file;
    setState(EMPTY_STATE);
    setLogs([]);
    setVideoSrc(URL.createObjectURL(file));
    setIsProcessing(true);
    setPhase('Uploading…');
    const form = new FormData();
    form.append('video', file);
    try {
      const response = await fetch('/api/process', { method: 'POST', body: form });
      if (!response.body) { pushLog(makeLogEntry('error', 'No response body')); setIsProcessing(false); return; }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lastDouble = buffer.lastIndexOf('\n\n');
        if (lastDouble === -1) continue;
        const complete = buffer.slice(0, lastDouble + 2);
        buffer = buffer.slice(lastDouble + 2);
        for (const { event, data } of parseSSEBuffer(complete)) {
          handleSSEEvent(event, data as SSEEventMap[keyof SSEEventMap]);
        }
      }
    } catch (err) {
      pushLog(makeLogEntry('error', 'Stream failed', String(err)));
      setIsProcessing(false);
    }
  }, [handleSSEEvent, pushLog]);

  const profileIsRTL = profile?.language === 'he' || profile?.language === 'he+en';

  // profile always defined via useSuiteStore default

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#0a0a0a', color: '#fff' }}>

      {/* Dashboard header */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EA580C', boxShadow: '0 0 12px rgba(234,88,12,0.30)' }}>
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-sm tracking-tight">{profile.businessName}</span>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.20)' }} />
          <span className="text-[10px] font-mono border rounded px-1.5 py-0.5 backdrop-blur-sm" style={{ color: 'rgba(255,255,255,0.30)', borderColor: 'rgba(255,255,255,0.08)' }}>
            {profile.industry}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {state.language && <LanguageBadge language={state.language} isRTL={state.isRTL} />}
          <button
            onClick={() => { router.push('/'); }}
            className="flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            <Settings className="w-3 h-3" />
            <span className="text-[10px]">Reset</span>
          </button>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'animate-ping' : 'animate-pulse'}`} style={{ background: isProcessing ? '#EA580C' : 'rgba(234,88,12,0.60)' }} />
            <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.30)' }}>
              {isProcessing ? phase || 'Processing…' : 'Brain Engine · Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex items-center gap-1 px-6 py-2 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              style={{ color: active ? '#fff' : 'rgba(255,255,255,0.35)', background: active ? 'rgba(234,88,12,0.10)' : 'transparent' }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: active ? '#EA580C' : 'rgba(255,255,255,0.35)' }} />
              {label}
              {active && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-px rounded-full"
                  style={{ background: '#EA580C' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'pulse' && (
            <motion.div key="pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
              <NichePulseTab
                state={state}
                isProcessing={isProcessing}
                phase={phase}
                profile={profile}
                missionDay={missionDay}
                setMissionDay={setMissionDay}
                videoSrc={videoSrc}
                activeStyle={activeStyle}
                setActiveStyle={setActiveStyle}
                onFile={handleFile}
                onRender={handleRender}
                isRendering={isRendering}
              />
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
              <ProjectListTab profile={profile} isRTL={profileIsRTL} />
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
              <ViralInsightsTab state={state} logs={logs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
