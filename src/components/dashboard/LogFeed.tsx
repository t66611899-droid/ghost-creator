'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Zap, Clock, Scissors } from 'lucide-react';

export type LogLevel = 'success' | 'error' | 'info' | 'warn' | 'engine';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  detail?: string;
  ts: number; // ms epoch
}

interface LogFeedProps {
  entries: LogEntry[];
  maxHeight?: number;
}

const ICON: Record<LogLevel, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warn: Clock,
  engine: Zap,
};

const COLOR: Record<LogLevel, string> = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#6b7280',
  warn: '#f59e0b',
  engine: '#ea580c',
};

const BADGE: Record<LogLevel, string> = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-white/5 text-[#6b7280] border-white/10',
  warn: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  engine: 'bg-orange-500/10 text-[#ea580c] border-orange-500/20',
};

export default function LogFeed({ entries, maxHeight = 360 }: LogFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <Scissors className="w-3 h-3 text-[#ea580c]" />
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#6b7280]">
            Engine Log
          </span>
        </div>
        <span className="text-[10px] text-[#333] font-mono">{entries.length} events</span>
      </div>

      <div
        className="flex-1 overflow-y-auto rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-2 space-y-1"
        style={{ maxHeight }}
      >
        <AnimatePresence initial={false}>
          {entries.map((entry) => {
            const Icon = ICON[entry.level];
            const relTime = formatRelativeTime(entry.ts);

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-start gap-2 rounded-lg px-2.5 py-2 hover:bg-[#161616] transition-colors group"
              >
                <Icon
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  style={{ color: COLOR[entry.level] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#d1d5db] font-medium leading-snug truncate">
                    {entry.message}
                  </p>
                  {entry.detail && (
                    <p className="text-[10px] text-[#555] font-mono mt-0.5 truncate">
                      {entry.detail}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${BADGE[entry.level]}`}
                  >
                    {entry.level}
                  </span>
                  <span className="text-[10px] text-[#333] font-mono group-hover:text-[#555]">
                    {relTime}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#2a2a2a]">
            <Zap className="w-6 h-6 mb-2" />
            <p className="text-xs">Waiting for pipeline…</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 1000) return 'now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  return `${Math.floor(diff / 3_600_000)}h`;
}

// ─── Factory helpers for the dashboard to build log entries ──────────────────

let _seq = 0;

export function makeLogEntry(
  level: LogLevel,
  message: string,
  detail?: string
): LogEntry {
  return { id: `log-${++_seq}-${Date.now()}`, level, message, detail, ts: Date.now() };
}

export function logsFromDiagnostics(diagnostics: {
  totalZones: number;
  skippedZones: number;
  shortestRamp: number;
  longestRamp: number;
  averageRamp: number;
}): LogEntry[] {
  const now = Date.now();
  return [
    { id: `d-zones-${now}`, level: 'engine', message: `${diagnostics.totalZones} ramp zones built`, detail: `${diagnostics.skippedZones} skipped (silence < 1 frame)`, ts: now },
    { id: `d-avg-${now}`, level: 'info', message: `Avg anticipation: ${diagnostics.averageRamp.toFixed(2)}s`, detail: `min ${diagnostics.shortestRamp.toFixed(2)}s / max ${diagnostics.longestRamp.toFixed(2)}s`, ts: now + 1 },
  ];
}
