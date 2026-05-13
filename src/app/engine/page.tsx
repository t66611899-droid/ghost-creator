'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Cpu,
  Sparkles,
  UploadCloud,
  FileVideo,
  Power,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { LiveConsole } from '@/components/engine/LiveConsole';
import { cn } from '@/lib/utils';
import type { EngineResult } from '@/lib/engine/types';

const PRESETS = [
  { key: 'barber', label: 'Barber', tint: 'from-amber-400 to-orange-700' },
  { key: 'gym', label: 'Gym', tint: 'from-emerald-400 to-slate-900' },
  { key: 'realestate', label: 'Real Estate', tint: 'from-sky-400 to-slate-900' },
] as const;

type PresetKey = (typeof PRESETS)[number]['key'];

interface JobStart {
  jobId: string;
  jobDir: string;
  streamUrl: string;
}

export default function EnginePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<PresetKey>('barber');
  const [silenceThresholdDb, setSilenceThresholdDb] = useState(-30);
  const [silenceMinDurSec, setSilenceMinDurSec] = useState(0.5);
  const [roughCut, setRoughCut] = useState(true);
  const [job, setJob] = useState<JobStart | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EngineResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onPick = (f: File | null | undefined) => {
    if (!f) return;
    setFile(f);
    setError(null);
    setJob(null);
    setResult(null);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    onPick(e.dataTransfer.files?.[0]);
  };

  const start = useCallback(async () => {
    if (!file) {
      setError('pick an .mp4 file first');
      return;
    }
    setStarting(true);
    setError(null);
    setResult(null);
    setJob(null); // clear any stale jobId before requesting a new one
    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('preset', preset);
      fd.append('silenceThresholdDb', String(silenceThresholdDb));
      fd.append('silenceMinDurSec', String(silenceMinDurSec));
      fd.append('roughCut', String(roughCut));
      const res = await fetch('/api/engine/start', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `start failed: ${res.status}`);
      }
      const j = (await res.json()) as JobStart;
      setJob(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStarting(false);
    }
  }, [file, preset, silenceThresholdDb, silenceMinDurSec, roughCut]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] font-sans text-white">
      <Backdrop />
      <Header />
      <main className="relative z-10 mx-auto max-w-[1440px] px-8 pb-20 pt-10">
        <Hero />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <section className="flex flex-col gap-5">
            <UploadZone
              file={file}
              onPick={onPick}
              onDrop={onDrop}
              onBrowse={() => fileInput.current?.click()}
            />
            <input
              ref={fileInput}
              type="file"
              accept="video/mp4,video/quicktime,video/x-matroska"
              hidden
              onChange={(e) => onPick(e.target.files?.[0])}
            />

            <ConfigCard
              preset={preset}
              setPreset={setPreset}
              silenceThresholdDb={silenceThresholdDb}
              setSilenceThresholdDb={setSilenceThresholdDb}
              silenceMinDurSec={silenceMinDurSec}
              setSilenceMinDurSec={setSilenceMinDurSec}
              roughCut={roughCut}
              setRoughCut={setRoughCut}
            />

            <button
              onClick={start}
              disabled={!file || starting}
              className={cn(
                'group relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl text-base font-extrabold uppercase tracking-[0.18em] transition-all',
                file && !starting
                  ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 text-white shadow-[0_20px_60px_-12px_rgba(168,85,247,0.6)] hover:scale-[1.01]'
                  : 'cursor-not-allowed border border-white/[0.08] bg-white/[0.03] text-white/35',
              )}
            >
              <Power className="h-4 w-4" />
              {starting ? 'Booting engine…' : job ? 'Start new job' : 'Start engine'}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>

            {error && (
              <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-xs font-semibold text-red-200">
                {error}
              </p>
            )}

            {result && <ResultPanel result={result} />}
          </section>

          <section>
            <LiveConsole
              key={job?.streamUrl ?? 'idle'}
              streamUrl={job?.streamUrl ?? null}
              onResult={(r) => setResult(r)}
              onFatal={(m) => setError(m)}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function Backdrop() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="ambient-drift absolute -left-40 top-[-10%] h-[640px] w-[640px] rounded-full bg-violet-700/[0.18] blur-[140px]" />
        <div
          className="ambient-drift absolute -right-32 top-[20%] h-[520px] w-[520px] rounded-full bg-fuchsia-600/[0.14] blur-[140px]"
          style={{ animationDelay: '-4s' }}
        />
        <div
          className="ambient-drift absolute bottom-[-20%] left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-sky-500/[0.07] blur-[160px]"
          style={{ animationDelay: '-7s' }}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[1] grain" />
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050505]/70 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/55 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-[0_0_30px_-4px_rgba(217,70,239,0.55)]">
            <Cpu className="h-4 w-4" />
            <span className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">Ghost Creator · Engine</p>
            <p className="text-[11px] font-medium text-white/45">Brain v0.4 · Hybrid pipeline</p>
          </div>
        </div>
        <Link
          href="/review"
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.06]"
        >
          ← Review dashboard
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3"
    >
      <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 backdrop-blur-xl">
        <Sparkles className="h-3 w-3 text-fuchsia-300" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">
          Engine · live
        </span>
      </div>
      <h1 className="display text-[44px] font-extrabold leading-[1.05] text-white">
        Drop the raw take.{' '}
        <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
          Get the cut.
        </span>
      </h1>
      <p className="max-w-2xl text-sm font-medium text-white/55 text-balance">
        Pipeline runs on real FFmpeg + Whisper + DeepSeek. Every stdout/stderr line and every
        API response is streamed to the console — no fake progress bars.
      </p>
    </motion.div>
  );
}

function UploadZone({
  file,
  onPick,
  onDrop,
  onBrowse,
}: {
  file: File | null;
  onPick: (f: File | null) => void;
  onDrop: (e: React.DragEvent<HTMLLabelElement>) => void;
  onBrowse: () => void;
}) {
  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="glass group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-dashed px-6 py-10 text-center transition-colors hover:border-fuchsia-400/30"
      onClick={onBrowse}
    >
      {file ? (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 ring-1 ring-white/15">
            <FileVideo className="h-5 w-5" />
          </span>
          <p className="text-sm font-bold tracking-tight">{file.name}</p>
          <p className="font-mono text-[11px] text-white/45">{formatBytes(file.size)} · ready</p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPick(null);
            }}
            className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 hover:text-white/85"
          >
            Replace
          </button>
        </>
      ) : (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 transition-transform group-hover:scale-105">
            <UploadCloud className="h-5 w-5 text-fuchsia-300" />
          </span>
          <p className="text-sm font-bold tracking-tight">Drop an MP4 here</p>
          <p className="text-xs text-white/45">or click to browse · max ~500MB recommended</p>
        </>
      )}
    </label>
  );
}

function ConfigCard({
  preset,
  setPreset,
  silenceThresholdDb,
  setSilenceThresholdDb,
  silenceMinDurSec,
  setSilenceMinDurSec,
  roughCut,
  setRoughCut,
}: {
  preset: PresetKey;
  setPreset: (p: PresetKey) => void;
  silenceThresholdDb: number;
  setSilenceThresholdDb: (n: number) => void;
  silenceMinDurSec: number;
  setSilenceMinDurSec: (n: number) => void;
  roughCut: boolean;
  setRoughCut: (b: boolean) => void;
}) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Pipeline config</p>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-semibold text-white/45">
          tuned at runtime
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-white/65">Niche preset</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={cn(
                'group relative overflow-hidden rounded-2xl border px-3 py-2.5 text-left text-xs font-bold transition-colors',
                preset === p.key
                  ? 'border-white/25 bg-white/[0.06]'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20',
              )}
            >
              <span
                className={cn(
                  'absolute inset-0 -z-10 opacity-30 transition-opacity bg-gradient-to-br',
                  p.tint,
                  preset === p.key ? 'opacity-50' : 'opacity-0 group-hover:opacity-25',
                )}
              />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <Slider
          label="Silence threshold"
          unit="dB"
          min={-50}
          max={-15}
          step={1}
          value={silenceThresholdDb}
          onChange={setSilenceThresholdDb}
          hint="quieter threshold = more cut"
        />
        <Slider
          label="Min silence duration"
          unit="s"
          min={0.2}
          max={2}
          step={0.05}
          value={silenceMinDurSec}
          onChange={setSilenceMinDurSec}
          hint="shorter = aggressive cut"
        />
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
        <input
          type="checkbox"
          checked={roughCut}
          onChange={(e) => setRoughCut(e.target.checked)}
          className="h-4 w-4 accent-fuchsia-500"
        />
        <div className="flex-1">
          <p className="text-xs font-bold tracking-tight">Produce rough-cut MP4</p>
          <p className="text-[11px] text-white/45">FFmpeg concat-trim. Slower, but you can scrub the result.</p>
        </div>
      </label>
    </div>
  );
}

function Slider({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
  hint,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold text-white/65">{label}</p>
        <p className="font-mono text-[11px] font-bold text-fuchsia-200">
          {value}
          <span className="text-white/40">{unit}</span>
        </p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 w-full accent-fuchsia-400"
      />
      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/35">{hint}</p>
    </div>
  );
}

function ResultPanel({ result }: { result: EngineResult }) {
  const compPct = Math.round(result.compressionRatio * 100);
  const hasRoughCut = !!result.artifacts.roughCutMp4;
  const videoUrl = `/api/engine/video/${result.jobId}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-strong rounded-3xl p-5"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        <p className="text-sm font-extrabold tracking-tight">Pipeline complete</p>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          {result.jobId}
        </span>
      </div>

      {hasRoughCut && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-black/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/85">
              Rough cut · proof
            </p>
            <a
              href={`${videoUrl}?download=1`}
              download={`${result.jobId}-rough-cut.mp4`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-white/85 transition-colors hover:bg-white/[0.12]"
            >
              <Download className="h-3 w-3" />
              Download Cut
            </a>
          </div>
          <video
            key={result.jobId}
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-xl bg-black"
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Source" value={`${result.durationSec.toFixed(1)}s`} />
        <Stat label="Kept" value={`${compPct}%`} tint="text-emerald-300" />
        <Stat label="Saved" value={`${result.timeSavedSec.toFixed(1)}s`} tint="text-amber-300" />
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Selected hooks</p>
        {result.hooks.map((h) => (
          <div
            key={h.type + h.startSec}
            className="rounded-2xl border border-white/[0.06] bg-black/30 p-3"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]">
                {h.type}
              </span>
              <span className="text-[11px] font-bold text-white/65">score {h.predictedScore}</span>
              <span className="ml-auto font-mono text-[10px] text-white/40">
                {h.startSec.toFixed(2)}–{h.endSec.toFixed(2)}s
              </span>
            </div>
            <p className="mt-2 text-[13px] font-semibold text-white/95">{h.hookLine}</p>
            {h.rationale && <p className="mt-1 text-[11px] text-white/45">{h.rationale}</p>}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {Object.entries(result.artifacts)
          .filter(([, v]) => !!v)
          .map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] text-white/65"
              title={v as string}
            >
              <Download className="h-3 w-3" />
              {k}
            </span>
          ))}
      </div>
    </motion.div>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className={cn('mt-1 text-xl font-extrabold tracking-tight', tint || 'text-white')}>{value}</p>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
