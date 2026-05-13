'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';

import VideoCanvas from '@/components/dashboard/VideoCanvas';
import ViralGauge from '@/components/dashboard/ViralGauge';
import LogFeed, { makeLogEntry } from '@/components/dashboard/LogFeed';
import type { LogEntry } from '@/components/dashboard/LogFeed';
import type { WordTimestamp } from '@/components/dashboard/VideoCanvas';
import type { NicheAnalysis, PipelineResult, SSEEventMap } from '@/types/api';
import type { BusinessProfile, ContentMission } from '@/types/profile';
import { PROFILE_STORAGE_KEY, INDUSTRY_STYLE_MAP } from '@/types/profile';
import type { Transition } from 'framer-motion';

// ─── 3D components — SSR disabled ────────────────────────────────────────────

const HolographicSphere = dynamic(
  () => import('@/components/3d/HolographicSphere'),
  { ssr: false, loading: () => <div style={{ width: 200, height: 200 }} /> }
);

// ─── Spring config ────────────────────────────────────────────────────────────

const spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };
const fastSpring: Transition = { type: 'spring', stiffness: 300, damping: 30 };

// ─── Glass card primitive ─────────────────────────────────────────────────────

function GlassCard({
  children,
  className = '',
  orange = false,
}: {
  children: React.ReactNode;
  className?: string;
  orange?: boolean;
}) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl ${
        orange ? 'shadow-[0_0_40px_rgba(234,88,12,0.08)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/[0.06] ${className}`} />;
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, loading = false,
}: {
  label: string; value?: string; sub?: string; icon: React.ComponentType<{ className?: string }>; loading?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={fastSpring}
      className="flex items-center gap-3 backdrop-blur-sm bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 cursor-default"
    >
      <div className="w-8 h-8 rounded-lg bg-[#ea580c]/10 border border-[#ea580c]/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#ea580c]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-semibold">{label}</p>
        {loading ? (
          <>
            <Skeleton className="h-4 w-16 mt-1" />
            <Skeleton className="h-2.5 w-24 mt-1" />
          </>
        ) : (
          <>
            <p className="text-base font-black text-white leading-tight">{value ?? '—'}</p>
            {sub && <p className="text-[10px] text-white/25 font-mono">{sub}</p>}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFile, isProcessing, phase,
}: {
  onFile: (f: File) => void; isProcessing: boolean; phase: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDrag, setIsDrag] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDrag(false);
      const file = Array.from(e.dataTransfer.files).find(
        (f) => f.type.startsWith('video/') || f.type.startsWith('audio/')
      );
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <motion.div
      whileHover={{ scale: isProcessing ? 1 : 1.01 }}
      whileTap={{ scale: isProcessing ? 1 : 0.98 }}
      transition={fastSpring}
      className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
        isDrag
          ? 'border-[#ea580c]/60 bg-[#ea580c]/5 shadow-[0_0_20px_rgba(234,88,12,0.1)]'
          : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
      onDragLeave={() => setIsDrag(false)}
      onDrop={handleDrop}
      onClick={() => !isProcessing && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <div className="flex flex-col items-center gap-2 py-6 px-4">
        {isProcessing ? (
          <Loader2 className="w-6 h-6 text-[#ea580c] animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-white/20" />
        )}
        <p className="text-xs text-white/30 font-medium text-center leading-snug">
          {isProcessing ? phase || 'Processing…' : 'Drop video / audio or click'}
        </p>
      </div>
    </motion.div>
  );
}

// ─── SSE parser ───────────────────────────────────────────────────────────────

function parseSSEBuffer(buffer: string): Array<{ event: string; data: unknown }> {
  const events: Array<{ event: string; data: unknown }> = [];
  const blocks = buffer.split('\n\n');
  for (const block of blocks) {
    if (!block.trim()) continue;
    let event = '';
    let dataStr = '';
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

// ─── Niche badge ──────────────────────────────────────────────────────────────

function NicheBadge({ niche }: { niche: NicheAnalysis }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="backdrop-blur-sm bg-[#ea580c]/[0.06] border border-[#ea580c]/20 rounded-xl px-3 py-2.5 flex flex-col gap-1 shadow-[0_0_20px_rgba(234,88,12,0.06)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-semibold">Niche</span>
        <span className="text-[10px] text-[#ea580c] font-mono">{niche.confidence}% confident</span>
      </div>
      <p className="text-sm font-black text-white capitalize">{niche.niche}</p>
      <p className="text-[10px] text-white/20 font-mono">Style → {niche.styleKey}</p>
    </motion.div>
  );
}

// ─── Language badge ───────────────────────────────────────────────────────────

function LanguageBadge({ language, isRTL }: { language: string; isRTL: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm bg-white/[0.04] border border-white/[0.08]">
      <Globe className="w-3 h-3 text-white/30" />
      <span className="text-[10px] font-mono text-white/50 uppercase">{language}</span>
      {isRTL && (
        <span className="text-[9px] font-bold text-[#ea580c] border border-[#ea580c]/30 rounded px-1">RTL</span>
      )}
    </div>
  );
}

// ─── Mission card ─────────────────────────────────────────────────────────────

function MissionCard({ mission, day, isRTL }: { mission: ContentMission; day: number; isRTL: boolean }) {
  const [tab, setTab] = useState<'script' | 'director'>('script');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="w-full backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4 shadow-[0_0_40px_rgba(234,88,12,0.06)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#ea580c] bg-[#ea580c]/10 border border-[#ea580c]/20 rounded-full px-2.5 py-0.5 uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-3 h-3" /> Mission · Day {day}
        </span>
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.06] p-0.5">
          <button
            onClick={() => setTab('script')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
              tab === 'script' ? 'bg-[#ea580c] text-white' : 'text-white/30 hover:text-white/60'
            }`}
          >
            <BookOpen className="w-3 h-3" /> Script
          </button>
          <button
            onClick={() => setTab('director')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
              tab === 'director' ? 'bg-[#ea580c] text-white' : 'text-white/30 hover:text-white/60'
            }`}
          >
            <Camera className="w-3 h-3" /> Director
          </button>
        </div>
      </div>

      <h3 className="text-base font-black leading-tight text-white">{mission.missionTitle}</h3>

      <AnimatePresence mode="wait">
        {tab === 'script' ? (
          <motion.div
            key="script"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl bg-black/40 border border-white/[0.06] p-3"
          >
            <p
              className="text-sm text-white/80 leading-relaxed whitespace-pre-line"
              dir={isRTL ? 'rtl' : 'ltr'}
              style={isRTL ? { fontFamily: 'var(--font-rubik)' } : {}}
            >
              {mission.hookScript || '—'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="director"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl bg-black/40 border border-white/[0.06] p-3"
          >
            <p className="text-xs text-white/50 leading-relaxed">{mission.directorNotes || '—'}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [missionDay, setMissionDay] = useState(1);
  const [state, setState] = useState<DashboardState>(EMPTY_STATE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [phase, setPhase] = useState('');
  const [activeStyle, setActiveStyle] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const uploadedFileRef = useRef<File | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) { router.push('/onboarding'); return; }
      const p = JSON.parse(raw) as BusinessProfile;
      setProfile(p);
      setActiveStyle(INDUSTRY_STYLE_MAP[p.industry] ?? 'barber');
      const created = new Date(p.createdAt).getTime();
      const dayIndex = Math.floor((Date.now() - created) / 86_400_000) % 30;
      setMissionDay(dayIndex + 1);
    } catch {
      router.push('/onboarding');
    }
  }, [router]);

  const pushLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev.slice(-99), entry]);
  }, []);

  const handleSSEEvent = useCallback(
    (event: string, data: SSEEventMap[keyof SSEEventMap]) => {
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
    },
    [pushLog]
  );

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
      a.href = url;
      a.download = `${file.name.replace(/\.[^.]+$/, '')}-ghost.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushLog(makeLogEntry('success', 'MP4 downloaded — render complete'));
    } catch (err) {
      pushLog(makeLogEntry('error', 'Render error', String(err)));
    } finally {
      setIsRendering(false);
    }
  }, [state, activeStyle, pushLog]);

  const handleFile = useCallback(
    async (file: File) => {
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
    },
    [handleSSEEvent, pushLog]
  );

  const { words, wordCount, duration, language, isRTL, niche, pipeline, viralScore } = state;
  const hasData = wordCount !== null;
  const highlightColor = niche?.styleKey === 'hvac' ? '#FFFF00' : '#ea580c';
  const styleList = ['barber', 'gym', 'hvac', 'vibrant', 'minimal'];
  const profileIsRTL = profile?.language === 'he' || profile?.language === 'he+en';
  const todayMission = profile?.contentPlan?.[(missionDay - 1) % 30] ?? null;

  if (!profile) return <div className="min-h-screen bg-[#0a0a0a]" />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">

      {/* ── Nav ── glassmorphism header ────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-white/[0.03] border-b border-white/[0.06] shrink-0 sticky top-0 z-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#ea580c] flex items-center justify-center shadow-lg shadow-[#ea580c]/30">
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-sm tracking-tight">Ghost Creator</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
          <span className="text-xs text-white font-semibold">{profile.businessName}</span>
          <span className="text-[10px] text-white/30 font-mono border border-white/[0.08] rounded px-1.5 py-0.5 backdrop-blur-sm">
            {profile.industry}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {language && <LanguageBadge language={language} isRTL={isRTL} />}
          <button
            onClick={() => { localStorage.removeItem(PROFILE_STORAGE_KEY); router.push('/onboarding'); }}
            className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-white/50 transition-colors cursor-pointer"
          >
            <Settings className="w-3 h-3" /> Reset Profile
          </button>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg backdrop-blur-sm bg-white/[0.03] border border-white/[0.06]">
            <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-[#ea580c] animate-ping' : 'bg-[#ea580c]/60 animate-pulse'}`} />
            <span className="text-[11px] text-white/30 font-mono">
              {isProcessing ? phase || 'Processing…' : 'Brain Engine · Active'}
            </span>
          </div>
        </div>
      </motion.header>

      {/* ── Three-panel grid ───────────────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-[280px_1fr_300px] overflow-hidden min-h-0">

        {/* ── LEFT ── */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          className="border-r border-white/[0.05] flex flex-col gap-4 p-5 overflow-y-auto"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-semibold mb-3">Upload</p>
            <UploadZone onFile={handleFile} isProcessing={isProcessing} phase={phase} />
          </div>

          <AnimatePresence>
            {niche && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
              >
                <NicheBadge niche={niche} />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-semibold mb-3">Metrics</p>
            <div className="flex flex-col gap-2">
              <MetricCard label="Words" icon={BarChart3} loading={isProcessing && wordCount === null} value={wordCount?.toString()} sub={duration !== null ? `${duration.toFixed(1)}s total` : undefined} />
              <MetricCard label="Compression" icon={TrendingUp} loading={isProcessing && pipeline === null} value={pipeline ? `${pipeline.metrics.compressionRatio}%` : undefined} sub={pipeline ? `${pipeline.metrics.timeSaved.toFixed(1)}s removed` : undefined} />
              <MetricCard label="Ramp Zones" icon={Zap} loading={isProcessing && pipeline === null} value={pipeline?.ramp ? pipeline.ramp.totalZones.toString() : pipeline ? '0' : undefined} sub={pipeline?.ramp ? `avg ${pipeline.ramp.averageRamp.toFixed(2)}s anticipation` : undefined} />
              <MetricCard label="Style" icon={FileVideo} loading={isProcessing && niche === null} value={niche ? niche.styleKey.charAt(0).toUpperCase() + niche.styleKey.slice(1) : undefined} sub={niche ? '9:16 · detected niche' : undefined} />
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-semibold mb-3">Caption Mode</p>
            <div className="flex flex-col gap-1.5">
              {styleList.map((style) => {
                const isActive = activeStyle === style;
                return (
                  <motion.button
                    key={style}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveStyle(style)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#ea580c]/40 bg-[#ea580c]/[0.08] text-[#ea580c] shadow-[0_0_12px_rgba(234,88,12,0.08)]'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/30 hover:border-white/[0.12] hover:text-white/60'
                    }`}
                  >
                    {style}
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {hasData && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={spring}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRender}
                  disabled={isRendering}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-colors cursor-pointer ${
                    isRendering
                      ? 'bg-white/[0.04] border border-white/[0.06] text-white/20 cursor-not-allowed'
                      : 'bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-lg shadow-[#ea580c]/20 hover:shadow-[#ea580c]/40'
                  }`}
                >
                  {isRendering ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Rendering…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Magic Render <Download className="w-4 h-4" /></>
                  )}
                </motion.button>
                <p className="text-[9px] text-center text-white/15 mt-2 font-mono">
                  Burns Hebrew captions · Speed ramp · Downloads MP4
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>

        {/* ── CENTER ── Mission + floating 9:16 preview ──────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...spring, delay: 0.1 }}
          className="flex flex-col items-center p-6 overflow-y-auto gap-6"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(234,88,12,0.04) 0%, transparent 60%)' }}
        >
          {/* Mission card */}
          {todayMission && (
            <div className="w-full" style={{ maxWidth: 420 }}>
              <MissionCard mission={todayMission} day={missionDay} isRTL={profileIsRTL} />
              {profile.contentPlan.length > 1 && (
                <div className="mt-2 flex items-center justify-between px-1">
                  <button
                    onClick={() => setMissionDay((d) => Math.max(1, d - 1))}
                    disabled={missionDay <= 1}
                    className="text-[10px] text-white/25 hover:text-white/50 disabled:opacity-30 transition-colors font-mono cursor-pointer"
                  >
                    ← prev
                  </button>
                  <span className="text-[10px] text-white/20 font-mono">{missionDay} / 30</span>
                  <button
                    onClick={() => setMissionDay((d) => Math.min(30, d + 1))}
                    disabled={missionDay >= 30}
                    className="text-[10px] text-white/25 hover:text-white/50 disabled:opacity-30 transition-colors font-mono cursor-pointer"
                  >
                    next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 9:16 floating preview — Z-layer 3, floats above grid */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring, delay: 0.18 }}
            style={{ maxWidth: 340, width: '100%', filter: 'drop-shadow(0 32px 60px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(234,88,12,0.06))' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={videoSrc ?? 'empty'}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring}
              >
                <VideoCanvas
                  words={words}
                  videoSrc={videoSrc}
                  isRTL={isRTL}
                  highlightColor={highlightColor}
                  onFileSelect={handleFile}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Status line */}
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-white/20" />
            {isProcessing && wordCount === null ? (
              <Skeleton className="h-3 w-48" />
            ) : hasData ? (
              <span className="text-[10px] text-white/25 font-mono">
                {wordCount} words · {isRTL ? 'RTL' : 'LTR'} · 4-word cues
              </span>
            ) : (
              <span className="text-[10px] text-white/15 font-mono">
                Upload a video to film today&apos;s mission
              </span>
            )}
          </div>
        </motion.section>

        {/* ── RIGHT ── 3D Sphere + Viral Score + Log ─────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring, delay: 0.12 }}
          className="border-l border-white/[0.05] flex flex-col gap-4 p-5 overflow-y-auto"
        >
          {/* Holographic Sphere hero */}
          <GlassCard className="p-5 flex flex-col items-center gap-4" orange>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-semibold self-start">
              Viral Confidence
            </p>

            {/* Sphere + score */}
            <div className="relative flex flex-col items-center">
              <HolographicSphere
                confidence={viralScore ?? 0}
                size={200}
              />
              {/* Score overlay */}
              <motion.div
                className="flex flex-col items-center -mt-4"
                key={viralScore ?? 'none'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={spring}
              >
                <span className="text-4xl font-black text-white leading-none tabular-nums">
                  {viralScore ?? 0}
                </span>
                <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest mt-0.5">
                  {viralScore === null ? 'awaiting upload' : viralScore >= 75 ? 'HIGH VIRALITY' : viralScore >= 45 ? 'BUILDING' : 'LOW'}
                </span>
              </motion.div>
            </div>

            {/* Mini gauge bar */}
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#ea580c] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${viralScore ?? 0}%` }}
                transition={{ ...spring, delay: 0.2 }}
              />
            </div>
          </GlassCard>

          {/* Viral Gauge (numeric detail) */}
          <GlassCard className="flex flex-col items-center p-4">
            {isProcessing && viralScore === null ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Skeleton className="w-[180px] h-[100px] rounded-xl" />
                <Skeleton className="h-3 w-28" />
              </div>
            ) : (
              <ViralGauge value={viralScore ?? 0} size={220} />
            )}
          </GlassCard>

          {/* Ghost Feed */}
          <div className="flex-1 min-h-0">
            <LogFeed entries={logs} maxHeight={360} />
          </div>
        </motion.aside>
      </main>
    </div>
  );
}
