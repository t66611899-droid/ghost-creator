'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, CheckCircle2, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  EngineEvent,
  EngineEventLevel,
  EngineResult,
  EngineStep,
} from '@/lib/engine/types';

const LEVEL_COLOR: Record<EngineEventLevel, string> = {
  info: 'text-sky-300',
  cmd: 'text-fuchsia-300',
  stdout: 'text-white/70',
  stderr: 'text-amber-200/80',
  data: 'text-emerald-300',
  warn: 'text-amber-300',
  error: 'text-red-300',
  success: 'text-emerald-300',
};

const STEP_LABEL: Record<EngineStep, string> = {
  init: 'Init',
  audio: 'A · Audio',
  transcribe: 'B · Transcribe',
  silence: 'C · Silence',
  hooks: 'D · Hooks',
  render: 'Render',
  done: 'Done',
  error: 'Error',
};

const STEP_ORDER: EngineStep[] = ['init', 'audio', 'transcribe', 'silence', 'hooks', 'render'];

export interface LiveConsoleProps {
  streamUrl: string | null;
  onResult?: (r: EngineResult) => void;
  onFatal?: (msg: string) => void;
  className?: string;
}

interface LogLine {
  step: EngineStep;
  level: EngineEventLevel;
  message: string;
  ts: number;
}

interface StepState {
  status: 'idle' | 'running' | 'done' | 'error';
  label?: string;
  durationMs?: number;
}

export function LiveConsole({ streamUrl, onResult, onFatal, className }: LiveConsoleProps) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [stepStates, setStepStates] = useState<Record<EngineStep, StepState>>(() =>
    Object.fromEntries(STEP_ORDER.concat('done', 'error').map((s) => [s, { status: 'idle' }])) as Record<
      EngineStep,
      StepState
    >,
  );
  const [closed, setClosed] = useState(false);
  const [stale, setStale] = useState<{ status: number; hint?: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef(true);

  useEffect(() => {
    if (!streamUrl) return;
    const ctrl = new AbortController();

    const push = (e: EngineEvent) => {
      if (e.kind === 'log') {
        setLines((prev) => prev.concat({ step: e.step, level: e.level, message: e.message, ts: e.ts }));
      } else if (e.kind === 'step:start') {
        setStepStates((prev) => ({ ...prev, [e.step]: { status: 'running', label: e.label } }));
        setLines((prev) =>
          prev.concat({ step: e.step, level: 'info', message: `▶ ${e.label}`, ts: e.ts }),
        );
      } else if (e.kind === 'step:done') {
        setStepStates((prev) => ({
          ...prev,
          [e.step]: { ...(prev[e.step] || { status: 'done' }), status: 'done', durationMs: e.durationMs },
        }));
      } else if (e.kind === 'progress') {
        setLines((prev) => prev.concat({ step: e.step, level: 'info', message: `progress ${Math.round(e.pct)}%`, ts: e.ts }));
      } else if (e.kind === 'result') {
        onResult?.(e.result);
      } else if (e.kind === 'fatal') {
        setStepStates((prev) => ({
          ...prev,
          [e.step]: { status: 'error', label: e.message },
        }));
        setLines((prev) => prev.concat({ step: e.step, level: 'error', message: `FATAL: ${e.message}`, ts: e.ts }));
        onFatal?.(e.message);
      }
    };

    consumeSse(streamUrl, ctrl.signal, {
      onEvent: (e) => push(e),
      onClose: () => setClosed(true),
      onStale: (status, hint) => {
        setStale({ status, hint });
        setClosed(true);
        onFatal?.(hint || `stream not available (HTTP ${status})`);
      },
    });

    return () => ctrl.abort();
  }, [streamUrl, onResult, onFatal]);

  // Auto-stick scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickyRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickyRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const totalLines = lines.length;
  const lastLine = lines[lines.length - 1];

  return (
    <div className={cn('glass-strong relative overflow-hidden rounded-3xl', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-black/40 ring-1 ring-white/15">
            <Terminal className="h-3.5 w-3.5 text-emerald-300" />
          </span>
          <p className="text-sm font-bold tracking-tight">Live Processing Console</p>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            {totalLines} lines
          </span>
        </div>
        <StreamStatus closed={closed} stale={stale} streamUrl={streamUrl} />
      </header>

      <StepStrip states={stepStates} />

      {stale && (
        <div className="border-b border-amber-400/25 bg-amber-400/[0.06] px-5 py-3 text-amber-200">
          <p className="text-xs font-bold uppercase tracking-[0.18em]">
            Stale job · HTTP {stale.status}
          </p>
          <p className="mt-1 text-[12px] font-medium text-amber-100/80">
            {stale.hint || 'This job no longer exists on the server (likely a dev-server restart). Click Start engine to begin a new run — old EventSource has been aborted.'}
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="thin-scroll relative h-[460px] overflow-y-auto bg-black/40 px-5 py-3 font-mono text-[12px] leading-[1.55]"
      >
        {totalLines === 0 && !stale ? (
          <p className="text-white/35">
            <ChevronRight className="mr-1.5 inline-block h-3 w-3 -translate-y-px text-white/30" />
            Waiting for engine to start…
          </p>
        ) : (
          lines.map((l, i) => <LineRow key={i} line={l} />)
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-2.5">
        <p className="truncate font-mono text-[10px] text-white/45">
          {lastLine ? `${STEP_LABEL[lastLine.step]} · ${lastLine.message.slice(0, 80)}` : '—'}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
          {closed ? 'closed' : 'streaming'}
        </p>
      </footer>
    </div>
  );
}

function StreamStatus({
  closed,
  stale,
  streamUrl,
}: {
  closed: boolean;
  stale: { status: number } | null;
  streamUrl: string | null;
}) {
  if (!streamUrl) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        Idle
      </span>
    );
  }
  if (stale) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
        <AlertTriangle className="h-3 w-3" />
        Stale {stale.status}
      </span>
    );
  }
  if (closed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">
      <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 neon-pulse" />
      Streaming
    </span>
  );
}

function StepStrip({ states }: { states: Record<EngineStep, StepState> }) {
  return (
    <div className="grid grid-cols-6 gap-2 border-b border-white/[0.06] px-5 py-3">
      {STEP_ORDER.map((s) => {
        const st = states[s];
        return (
          <div
            key={s}
            className={cn(
              'rounded-xl border px-2.5 py-2 transition-colors',
              st.status === 'idle' && 'border-white/[0.06] bg-white/[0.02] text-white/40',
              st.status === 'running' && 'border-fuchsia-400/30 bg-fuchsia-400/[0.08] text-fuchsia-200',
              st.status === 'done' && 'border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-200',
              st.status === 'error' && 'border-red-400/40 bg-red-500/[0.08] text-red-200',
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{STEP_LABEL[s]}</p>
              <StepIcon status={st.status} />
            </div>
            <p className="mt-1 truncate font-mono text-[10px] text-white/55">
              {st.status === 'done'
                ? `${(st.durationMs ?? 0).toLocaleString()}ms`
                : st.label || (st.status === 'idle' ? 'pending' : '…')}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function StepIcon({ status }: { status: StepState['status'] }) {
  if (status === 'running') return <Loader2 className="h-3 w-3 animate-spin" />;
  if (status === 'done') return <CheckCircle2 className="h-3 w-3" />;
  if (status === 'error') return <AlertTriangle className="h-3 w-3" />;
  return <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />;
}

function LineRow({ line }: { line: LogLine }) {
  const time = useMemo(() => {
    const d = new Date(line.ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  }, [line.ts]);
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex gap-3"
    >
      <span className="shrink-0 text-white/30">{time}</span>
      <span className="shrink-0 text-white/40">{STEP_LABEL[line.step].padEnd(14, ' ')}</span>
      <span className={cn('shrink-0 font-bold uppercase tracking-wider', LEVEL_COLOR[line.level])}>
        {line.level.padEnd(6, ' ')}
      </span>
      <span className={cn('whitespace-pre-wrap break-all', LEVEL_COLOR[line.level])}>{line.message}</span>
    </motion.div>
  );
}

function pad(n: number, w = 2) {
  return n.toString().padStart(w, '0');
}

/* ─── SSE consumer (fetch + ReadableStream) ───────────────
 * EventSource silently retries on close and hides HTTP status,
 * so a stale jobId becomes a 404 storm. fetch lets us detect 4xx
 * once and stop cleanly.
 * ───────────────────────────────────────────────────────── */

interface SseHandlers {
  onEvent: (e: EngineEvent) => void;
  onClose: () => void;
  onStale: (status: number, hint?: string) => void;
}

async function consumeSse(url: string, signal: AbortSignal, h: SseHandlers): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      signal,
      headers: { Accept: 'text/event-stream' },
      cache: 'no-store',
    });
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return;
    h.onStale(0, `network error: ${(err as Error).message}`);
    return;
  }

  if (!res.ok) {
    let hint: string | undefined;
    try {
      const body = await res.text();
      const parsed = JSON.parse(body) as { hint?: string; error?: string; jobId?: string; knownJobs?: string[] };
      hint =
        parsed.hint ||
        (parsed.error
          ? `${parsed.error}${parsed.jobId ? ` (jobId=${parsed.jobId})` : ''}`
          : undefined);
    } catch {
      // body wasn't JSON — leave hint undefined
    }
    h.onStale(res.status, hint);
    return;
  }

  if (!res.body) {
    h.onClose();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // SSE message boundary is a blank line.
      let sep = buf.indexOf('\n\n');
      while (sep >= 0) {
        const chunk = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        sep = buf.indexOf('\n\n');

        let event = 'message';
        const dataLines: string[] = [];
        for (const line of chunk.split('\n')) {
          if (line.startsWith(':')) continue; // comment / keep-alive
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        }
        if (event === 'close') {
          h.onClose();
          return;
        }
        if (dataLines.length === 0) continue;
        try {
          h.onEvent(JSON.parse(dataLines.join('\n')) as EngineEvent);
        } catch {
          // ignore parse errors on malformed frame
        }
      }
    }
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') return;
    h.onStale(0, `read error: ${(err as Error).message}`);
    return;
  }

  h.onClose();
}
