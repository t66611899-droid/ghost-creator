'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transition } from 'framer-motion';
import {
  Upload, Trash2, CheckCircle, AlertCircle, Loader2, Play, FileVideo, Sparkles,
} from 'lucide-react';
import { useSuiteStore, type VaultClip } from '@/store/useSuiteStore';
import { rememberFile, getFile, forgetFile } from '../../../lib/vault-file-store';

const VideoPreview = dynamic(() => import('@/components/video/VideoPreview'), {
  ssr: false,
  loading: () => <div style={{ width: 300, height: Math.round(300 * 16 / 9) }} />,
});

const ProcessingOverlay = dynamic(() => import('@/components/ui/ProcessingOverlay'), {
  ssr: false,
});

// ─── Springs ──────────────────────────────────────────────────────────────────

const spring: Transition = { type: 'spring', stiffness: 110, damping: 22 };
const fast: Transition = { type: 'spring', stiffness: 300, damping: 30 };

// ─── Thumbnail capture utility ────────────────────────────────────────────────

async function captureThumbnail(
  file: File,
  objectUrl: string,
): Promise<{ thumbnail: string | undefined; duration: number }> {
  if (!file.type.startsWith('video/')) {
    return { thumbnail: undefined, duration: 0 };
  }
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;
    video.crossOrigin = 'anonymous';

    const cleanup = () => video.remove();
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({ thumbnail: undefined, duration: 0 });
    }, 8000);

    video.onloadedmetadata = () => {
      const target = Math.min(1.0, video.duration / 2 || 0.5);
      try { video.currentTime = target; } catch { /* ignore */ }
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const W = 480;
        const H = Math.round(W * (video.videoHeight / video.videoWidth || 16 / 9));
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) { clearTimeout(timeoutId); cleanup(); resolve({ thumbnail: undefined, duration: video.duration }); return; }
        ctx.drawImage(video, 0, 0, W, H);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        clearTimeout(timeoutId);
        const dur = isFinite(video.duration) ? video.duration : 0;
        cleanup();
        resolve({ thumbnail: dataUrl, duration: dur });
      } catch {
        clearTimeout(timeoutId);
        cleanup();
        resolve({ thumbnail: undefined, duration: 0 });
      }
    };

    video.onerror = () => { clearTimeout(timeoutId); cleanup(); resolve({ thumbnail: undefined, duration: 0 }); };
  });
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function Status({ status }: { status: VaultClip['status'] }) {
  const cfg = {
    queued:     { label: 'Queued',     color: 'rgba(255,255,255,0.40)' },
    processing: { label: 'Processing', color: '#E0E0E0' },
    done:       { label: 'Done',       color: '#FFFFFF' },
    error:      { label: 'Error',      color: '#f87171' },
  }[status];

  const Icon = status === 'processing' ? Loader2
    : status === 'done' ? CheckCircle
    : status === 'error' ? AlertCircle
    : Play;

  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] tracking-[0.18em] uppercase"
      style={{ color: cfg.color, fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600 }}
    >
      <Icon className={`w-2.5 h-2.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

// ─── Clip card (thumbnail tile) ───────────────────────────────────────────────

function ClipCard({
  clip, isSelected, onSelect, onRemove,
}: {
  clip: VaultClip;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const sizeMB = (clip.size / 1_048_576).toFixed(1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={spring}
      onClick={onSelect}
      whileHover={{ y: -2 }}
      className="group relative flex flex-col cursor-pointer rounded-2xl overflow-hidden"
      style={{
        background: isSelected
          ? 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isSelected ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isSelected
          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.20) inset'
          : '0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full"
        style={{ aspectRatio: '9 / 16', background: '#000' }}
      >
        {clip.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clip.thumbnail}
            alt={clip.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileVideo className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.20)' }} />
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.30)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Play className="w-3.5 h-3.5 ml-0.5" style={{ color: '#fff' }} />
          </div>
        </div>

        {/* Trash */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          style={{
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.20)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Meta strip */}
      <div className="flex flex-col gap-1 px-3 py-2.5">
        <p
          className="text-[11px] truncate"
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 500,
          }}
          title={clip.name}
        >
          {clip.name}
        </p>
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] tabular-nums tracking-wider"
            style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-inter), sans-serif' }}
          >
            {sizeMB} MB{clip.duration > 0 ? ` · ${clip.duration.toFixed(1)}s` : ''}
          </span>
          <Status status={clip.status} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Drop zone (react-dropzone) ───────────────────────────────────────────────

function DropZone({ onFiles, empty }: { onFiles: (files: File[]) => void; empty: boolean }) {
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) onFiles(accepted);
  }, [onFiles]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
    },
    multiple: true,
  });

  const borderColor = isDragReject
    ? 'rgba(248,113,113,0.60)'
    : isDragActive
    ? 'rgba(255,255,255,0.55)'
    : 'rgba(255,255,255,0.18)';

  return (
    <div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-2xl flex flex-col items-center text-center transition-all ${empty ? 'py-12 px-6' : 'py-6 px-5'}`}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1.5px dashed ${borderColor}`,
        boxShadow: isDragActive
          ? '0 0 32px rgba(255,255,255,0.10), inset 0 0 24px rgba(255,255,255,0.04)'
          : undefined,
      }}
    >
      <input {...getInputProps()} />

      <motion.div
        animate={isDragActive ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
        transition={fast}
        className="rounded-2xl flex items-center justify-center mb-3"
        style={{
          width: empty ? 56 : 40,
          height: empty ? 56 : 40,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.14)',
        }}
      >
        <Upload
          className={empty ? 'w-6 h-6' : 'w-5 h-5'}
          style={{ color: 'rgba(255,255,255,0.75)' }}
        />
      </motion.div>

      <p
        className={empty ? 'text-2xl mb-1' : 'text-base mb-0.5'}
        style={{
          color: '#FFFFFF',
          fontFamily: 'var(--font-cormorant), serif',
          fontWeight: 400,
          letterSpacing: '0.005em',
        }}
      >
        {isDragActive ? 'Release to upload' : empty ? 'Begin with a clip' : 'Add more clips'}
      </p>
      <p
        className="text-[10px] tracking-[0.18em] uppercase"
        style={{
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      >
        Drag & drop, or click to browse
      </p>
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export default function StudioPage() {
  const {
    vaultClips, addClip, updateClip, removeClip,
    previewClipId, setPreviewClipId,
  } = useSuiteStore();

  const objectUrlMapRef = useRef<Map<string, string>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState('Processing');
  const [processingDetail, setProcessingDetail] = useState<string | undefined>();
  const [processingProgress, setProcessingProgress] = useState<number | undefined>();

  // Reconcile session: drop persisted clips that have no File ref anymore
  useEffect(() => {
    const orphans = vaultClips.filter((c) => !getFile(c.id));
    if (orphans.length > 0) {
      for (const c of orphans) removeClip(c.id);
      if (previewClipId && orphans.some((o) => o.id === previewClipId)) {
        setPreviewClipId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup all object URLs on unmount
  useEffect(() => {
    const map = objectUrlMapRef.current;
    return () => {
      for (const url of map.values()) URL.revokeObjectURL(url);
      map.clear();
    };
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID();
      const objectUrl = URL.createObjectURL(file);
      objectUrlMapRef.current.set(id, objectUrl);
      rememberFile(id, file);

      addClip({
        id,
        name: file.name,
        size: file.size,
        duration: 0,
        status: 'queued',
        objectUrl,
      });

      if (!useSuiteStore.getState().previewClipId) {
        setPreviewClipId(id);
      }

      // Async thumbnail + duration
      captureThumbnail(file, objectUrl).then(({ thumbnail, duration }) => {
        updateClip(id, { thumbnail, duration });
      });
    }
  }, [addClip, updateClip, setPreviewClipId]);

  const handleRemove = useCallback((id: string) => {
    const url = objectUrlMapRef.current.get(id);
    if (url) { URL.revokeObjectURL(url); objectUrlMapRef.current.delete(id); }
    forgetFile(id);
    removeClip(id);
    if (useSuiteStore.getState().previewClipId === id) {
      setPreviewClipId(null);
    }
  }, [removeClip, setPreviewClipId]);

  const PROCESS_STEPS: Record<string, string> = {
    'Uploading': 'Sending your clip to the studio',
    'Reading audio': 'Transcribing every word',
    'Analyzing pacing': 'Studying the cadence',
    'Composing cuts': 'Assembling the final edit',
    'Finalizing': 'Polishing the master',
  };

  const handleCreate = useCallback(async () => {
    const id = previewClipId;
    if (!id) return;
    const file = getFile(id);
    if (!file) return;

    setIsProcessing(true);
    setProcessingPhase('Uploading');
    setProcessingDetail(PROCESS_STEPS['Uploading']);
    setProcessingProgress(0.05);
    updateClip(id, { status: 'processing' });

    try {
      const form = new FormData();
      form.append('video', file);

      const res = await fetch('/api/process', { method: 'POST', body: form });
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let stepIdx = 0;
      const steps = ['Uploading', 'Reading audio', 'Analyzing pacing', 'Composing cuts', 'Finalizing'];

      const advance = () => {
        if (stepIdx < steps.length - 1) stepIdx++;
        const phase = steps[stepIdx];
        setProcessingPhase(phase);
        setProcessingDetail(PROCESS_STEPS[phase]);
        setProcessingProgress(Math.min(0.95, 0.1 + (stepIdx / steps.length) * 0.85));
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split on double-newline; keep tail
        const lastDouble = buffer.lastIndexOf('\n\n');
        if (lastDouble === -1) continue;
        const complete = buffer.slice(0, lastDouble + 2);
        buffer = buffer.slice(lastDouble + 2);

        // Parse SSE events and use them only to advance the silver loader narrative
        for (const block of complete.split('\n\n')) {
          if (!block.trim()) continue;
          let event = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
          }
          if (event === 'words') {
            // Audio transcription completed → advance to pacing
            setProcessingPhase('Analyzing pacing');
            setProcessingDetail(PROCESS_STEPS['Analyzing pacing']);
            setProcessingProgress(0.55);
          } else if (event === 'pipeline') {
            setProcessingPhase('Composing cuts');
            setProcessingDetail(PROCESS_STEPS['Composing cuts']);
            setProcessingProgress(0.85);
          } else if (event === 'done') {
            setProcessingPhase('Finalizing');
            setProcessingDetail(PROCESS_STEPS['Finalizing']);
            setProcessingProgress(1.0);
          } else if (event === 'log' && stepIdx === 0) {
            // First log tick → bump from upload to reading audio
            setProcessingPhase('Reading audio');
            setProcessingDetail(PROCESS_STEPS['Reading audio']);
            setProcessingProgress(0.25);
            stepIdx = 1;
          }
          // Suppress unused advance() warning
          void advance;
        }
      }

      updateClip(id, { status: 'done' });
      // Brief hold so user sees "Done"
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      updateClip(id, { status: 'error', error: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(undefined);
    }
  }, [previewClipId, updateClip]);

  const previewClip = vaultClips.find((c) => c.id === previewClipId);
  const previewUrl = previewClipId ? objectUrlMapRef.current.get(previewClipId) : undefined;
  const canCreate = !!previewClip && previewClip.status !== 'processing' && !isProcessing;

  return (
    <div className="flex flex-col h-full min-h-0 relative" style={{ color: '#FFFFFF' }}>

      {/* ProcessingOverlay — high-end silver loader */}
      <ProcessingOverlay
        visible={isProcessing}
        phase={processingPhase}
        detail={processingDetail}
        progress={processingProgress}
      />

      {/* Page header */}
      <div
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,10,10,0.40)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex flex-col gap-0.5">
          <h1
            className="text-2xl tracking-tight"
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontWeight: 400,
              color: '#FFFFFF',
              letterSpacing: '0.005em',
            }}
          >
            Studio
          </h1>
          <span
            className="text-[10px] tracking-[0.22em] uppercase"
            style={{
              color: 'rgba(255,255,255,0.40)',
              fontFamily: 'var(--font-inter), sans-serif',
              fontWeight: 500,
            }}
          >
            {vaultClips.length === 0
              ? 'Awaiting your first clip'
              : `${vaultClips.length} clip${vaultClips.length === 1 ? '' : 's'} in vault`}
          </span>
        </div>

        <motion.button
          whileHover={canCreate ? { scale: 1.02 } : {}}
          whileTap={canCreate ? { scale: 0.98 } : {}}
          onClick={handleCreate}
          disabled={!canCreate}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl cursor-pointer disabled:cursor-not-allowed transition-colors"
          style={{
            background: canCreate
              ? 'linear-gradient(180deg, #FFFFFF 0%, #D4D4D4 100%)'
              : 'rgba(255,255,255,0.04)',
            color: canCreate ? '#0A0A0A' : 'rgba(255,255,255,0.35)',
            border: canCreate ? '1px solid rgba(255,255,255,0.40)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: canCreate
              ? '0 8px 24px rgba(255,255,255,0.18), 0 0 1px rgba(255,255,255,0.40) inset'
              : 'none',
            fontFamily: 'var(--font-inter), sans-serif',
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: '0.20em',
            textTransform: 'uppercase',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Create
        </motion.button>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: Drop zone + clip grid */}
        <div
          className="flex flex-col gap-4 p-6 overflow-y-auto"
          style={{
            flex: '1 1 0',
            minWidth: 0,
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <DropZone onFiles={handleFiles} empty={vaultClips.length === 0} />

          {vaultClips.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 mt-2">
                <span
                  className="text-[10px] tracking-[0.20em] uppercase"
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontWeight: 600,
                  }}
                >
                  Vault
                </span>
                <span
                  className="text-[10px] tabular-nums tracking-wider"
                  style={{
                    color: 'rgba(255,255,255,0.30)',
                    fontFamily: 'var(--font-inter), sans-serif',
                  }}
                >
                  {vaultClips.length}
                </span>
              </div>

              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                }}
              >
                <AnimatePresence>
                  {vaultClips.map((clip) => (
                    <ClipCard
                      key={clip.id}
                      clip={clip}
                      isSelected={previewClipId === clip.id}
                      onSelect={() => setPreviewClipId(clip.id)}
                      onRemove={() => handleRemove(clip.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Real video preview */}
        <div
          className="flex flex-col items-center justify-center p-8 overflow-y-auto gap-6"
          style={{
            width: 460,
            borderLeft: 'none',
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.03) 0%, transparent 70%)',
          }}
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <span
              className="text-[10px] tracking-[0.22em] uppercase"
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontFamily: 'var(--font-inter), sans-serif',
                fontWeight: 600,
              }}
            >
              Preview
            </span>
            {previewClip ? (
              <p
                className="text-lg max-w-xs truncate"
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'var(--font-cormorant), serif',
                  fontWeight: 400,
                }}
              >
                {previewClip.name}
              </p>
            ) : (
              <p
                className="text-base italic"
                style={{
                  color: 'rgba(255,255,255,0.30)',
                  fontFamily: 'var(--font-cormorant), serif',
                  fontWeight: 300,
                }}
              >
                Select a clip from the vault
              </p>
            )}
          </div>

          <VideoPreview
            src={previewUrl}
            poster={previewClip?.thumbnail}
            width={320}
          />

          {previewClip && (
            <div className="flex flex-col items-center gap-1">
              <Status status={previewClip.status} />
              {previewClip.error && (
                <span
                  className="text-[10px] tracking-wide mt-1"
                  style={{ color: '#f87171', fontFamily: 'var(--font-inter), sans-serif' }}
                >
                  {previewClip.error}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
