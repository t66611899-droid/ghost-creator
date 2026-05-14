'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transition } from 'framer-motion';
import {
  Film, Upload, Trash2, Zap, CheckCircle, AlertCircle,
  Loader2, Play, Sparkles, ChevronDown, FileVideo,
} from 'lucide-react';
import {
  useSuiteStore,
  PRESET_SPEED,
  type VaultClip,
  type BlubarberPreset,
} from '@/store/useSuiteStore';
import type { TimelineWord } from '@/components/video/RemotionCanvas';

// ─── RemotionCanvas — SSR disabled ───────────────────────────────────────────

const RemotionCanvas = dynamic(
  () => import('@/components/video/RemotionCanvas'),
  { ssr: false, loading: () => <div style={{ width: 280, height: Math.round(280 * 16 / 9) }} /> }
);

// ─── Springs ──────────────────────────────────────────────────────────────────

const spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };
const fast: Transition = { type: 'spring', stiffness: 300, damping: 30 };
const snap: Transition = { type: 'spring', stiffness: 500, damping: 40 };

// ─── Preset options ───────────────────────────────────────────────────────────

const PRESET_OPTIONS: { value: BlubarberPreset; label: string; speed: string; color: string }[] = [
  { value: 'barber',      label: 'Barber',        speed: '0.12s cuts · Reveal Flash', color: '#EA580C' },
  { value: 'gym',         label: 'Gym / Fitness', speed: '0.08s cuts · Bass-Drop',    color: '#EA580C' },
  { value: 'hvac',        label: 'HVAC / Trades', speed: '0.22s cuts · Diagnostic',   color: '#FFFF00' },
  { value: 'real-estate', label: 'Real Estate',   speed: '0.28s cuts · Luxury Dolly', color: '#EA580C' },
  { value: 'other',       label: 'Other',         speed: '0.18s cuts · Standard',     color: '#EA580C' },
];

// ─── Demo words ──────────────────────────────────────────────────────────────

const DEMO_WORDS: TimelineWord[] = [
  { word: 'Watch', start: 0.0, end: 0.4, isReveal: true, isKeyword: true },
  { word: 'this', start: 0.4, end: 0.7 },
  { word: 'transform', start: 0.7, end: 1.2, isKeyword: true },
  { word: 'happen', start: 1.2, end: 1.6 },
  { word: 'LIVE', start: 1.8, end: 2.3, isReveal: true, isKeyword: true },
  { word: 'in', start: 2.3, end: 2.5 },
  { word: 'front', start: 2.5, end: 2.8 },
  { word: 'of', start: 2.8, end: 2.95 },
  { word: 'your', start: 2.95, end: 3.2 },
  { word: 'eyes', start: 3.2, end: 3.7 },
  { word: 'No', start: 4.0, end: 4.2, isReveal: true, isKeyword: true },
  { word: 'filters', start: 4.2, end: 4.7 },
  { word: 'Just', start: 5.0, end: 5.25, isReveal: true, isKeyword: true },
  { word: 'GHOST', start: 5.25, end: 5.8, isKeyword: true },
  { word: 'CREATOR', start: 5.8, end: 6.5, isKeyword: true },
];

// ─── Thumbnail capture utility ────────────────────────────────────────────────

async function captureThumbnail(file: File, objectUrl: string): Promise<{ thumbnail: string | undefined; duration: number }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('video/')) {
      resolve({ thumbnail: undefined, duration: 0 });
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;
    video.crossOrigin = 'anonymous';

    const cleanup = () => { video.remove(); };
    const timeoutId = setTimeout(() => { cleanup(); resolve({ thumbnail: undefined, duration: 0 }); }, 8000);

    video.onloadedmetadata = () => {
      // Seek to 1s (or middle if shorter)
      const target = Math.min(1.0, video.duration / 2);
      video.currentTime = target;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const W = 320, H = Math.round(W * (video.videoHeight / video.videoWidth || 16/9));
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) { clearTimeout(timeoutId); cleanup(); resolve({ thumbnail: undefined, duration: video.duration }); return; }
        ctx.drawImage(video, 0, 0, W, H);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        clearTimeout(timeoutId);
        const dur = video.duration;
        cleanup();
        resolve({ thumbnail: dataUrl, duration: dur });
      } catch {
        clearTimeout(timeoutId);
        cleanup();
        resolve({ thumbnail: undefined, duration: video.duration });
      }
    };

    video.onerror = () => { clearTimeout(timeoutId); cleanup(); resolve({ thumbnail: undefined, duration: 0 }); };
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VaultClip['status'] }) {
  const cfg = {
    queued:     { label: 'Queued',     color: 'rgba(255,255,255,0.30)', bg: 'rgba(255,255,255,0.06)' },
    processing: { label: 'Processing', color: '#EA580C',                bg: 'rgba(234,88,12,0.12)' },
    done:       { label: 'Done',       color: '#4ade80',                bg: 'rgba(74,222,128,0.12)' },
    error:      { label: 'Error',      color: '#f87171',                bg: 'rgba(248,113,113,0.12)' },
  }[status];

  const Icon = status === 'processing' ? Loader2
    : status === 'done' ? CheckCircle
    : status === 'error' ? AlertCircle
    : Play;

  return (
    <span
      className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon className={`w-2.5 h-2.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

// ─── Clip row ─────────────────────────────────────────────────────────────────

function ClipRow({
  clip, isSelected, onSelect, onRemove,
}: {
  clip: VaultClip; isSelected: boolean; onSelect: () => void; onRemove: () => void;
}) {
  const sizeMB = (clip.size / 1_048_576).toFixed(1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={spring}
      onClick={onSelect}
      className="group flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl transition-colors"
      style={{
        background: isSelected ? 'rgba(234,88,12,0.10)' : 'rgba(255,255,255,0.02)',
        border: isSelected ? '1px solid rgba(234,88,12,0.30)' : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Thumbnail */}
      <div
        className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {clip.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.thumbnail} alt={clip.name} className="w-full h-full object-cover" />
        ) : (
          <FileVideo className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.20)' }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate" title={clip.name}>{clip.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {sizeMB} MB{clip.duration > 0 ? ` · ${clip.duration.toFixed(1)}s` : ''}
          </span>
          <StatusBadge status={clip.status} />
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        style={{ color: 'rgba(248,113,113,0.7)' }}
        title="Remove from vault"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ─── Drop zone (react-dropzone) ───────────────────────────────────────────────

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) onFiles(accepted);
  }, [onFiles]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg'],
    },
    multiple: true,
    noKeyboard: false,
  });

  const borderColor = isDragReject ? '#f87171'
    : isDragActive ? '#EA580C'
    : 'rgba(234,88,12,0.45)';

  return (
    <div
      {...getRootProps()}
      className="relative rounded-2xl cursor-pointer transition-all p-8 flex flex-col items-center gap-3 text-center"
      style={{
        // Per directive: backdrop-blur-2xl, bg-[#0A0A0A]/50, Vivid Orange dashed border
        background: 'rgba(10,10,10,0.50)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `2px dashed ${borderColor}`,
        boxShadow: isDragActive
          ? '0 0 32px rgba(234,88,12,0.25), inset 0 0 24px rgba(234,88,12,0.08)'
          : '0 0 12px rgba(234,88,12,0.04)',
      }}
    >
      <input {...getInputProps()} />

      <motion.div
        animate={isDragActive ? { scale: 1.15, rotate: [0, -5, 5, 0] } : { scale: 1, rotate: 0 }}
        transition={fast}
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: isDragActive ? 'rgba(234,88,12,0.18)' : 'rgba(234,88,12,0.10)',
          border: '1px solid rgba(234,88,12,0.25)',
        }}
      >
        <Upload className="w-7 h-7" style={{ color: '#EA580C' }} />
      </motion.div>

      <div>
        <p className="text-sm font-black text-white">
          {isDragActive ? 'Drop to ingest' : isDragReject ? 'Unsupported format' : 'Drop clips here'}
        </p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>
          MP4 · MOV · AVI · WebM · MP3 · WAV — drag-drop or click
        </p>
      </div>

      <span
        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
        style={{ color: '#EA580C', background: 'rgba(234,88,12,0.10)', border: '1px solid rgba(234,88,12,0.25)' }}
      >
        Multi-Upload · Real File Handling
      </span>
    </div>
  );
}

// ─── Blubarber Edge panel ─────────────────────────────────────────────────────

function BlubarberEdgePanel({
  preset, onPreset, onApply, isApplying, selectedCount,
}: {
  preset: BlubarberPreset;
  onPreset: (p: BlubarberPreset) => void;
  onApply: () => void;
  isApplying: boolean;
  selectedCount: number;
}) {
  const [open, setOpen] = useState(true);
  const selected = PRESET_OPTIONS.find((p) => p.value === preset) ?? PRESET_OPTIONS[0];
  const speed = PRESET_SPEED[preset];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(10,10,10,0.50)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(234,88,12,0.20)',
        boxShadow: '0 0 40px rgba(234,88,12,0.08)',
      }}
    >
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.30)' }}>
            <Zap className="w-3.5 h-3.5" style={{ color: '#EA580C' }} />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-white">Blubarber Edge</p>
            <p className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.40)' }}>
              {selected.speed}
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 transition-transform" style={{ color: 'rgba(255,255,255,0.40)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={snap} className="overflow-hidden">
            <div className="px-4 pb-4 flex flex-col gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.15em] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Industry Preset</p>
                <div className="flex flex-col gap-1">
                  {PRESET_OPTIONS.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onPreset(opt.value)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-all"
                      style={{
                        background: preset === opt.value ? 'rgba(234,88,12,0.12)' : 'rgba(255,255,255,0.03)',
                        border: preset === opt.value ? '1px solid rgba(234,88,12,0.40)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: preset === opt.value ? '#fff' : 'rgba(255,255,255,0.50)' }}>
                        {opt.label}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: preset === opt.value ? '#EA580C' : 'rgba(255,255,255,0.25)' }}>
                        {opt.speed.split(' · ')[0]}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  ['Dead Air Purge', '> 0.4s silence → cut'],
                  ['Keyword Zoom', '1.2× on impact words'],
                  ['Reveal Flash', 'Orange pulse · sentence start'],
                  ['Transition Speed', `${speed}s · ${selected.label}`],
                  ['Captions', 'Hormozi · Vivid Orange'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.40)' }}>{k}</span>
                    <span className="text-[9px] font-mono" style={{ color: '#EA580C' }}>{v}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: selectedCount === 0 ? 1 : 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onApply}
                disabled={isApplying || selectedCount === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: isApplying ? 'rgba(255,255,255,0.06)' : '#EA580C', color: '#fff' }}
              >
                {isApplying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Apply to {selectedCount > 0 ? `${selectedCount} Clip${selectedCount > 1 ? 's' : ''}` : 'Clips'}</>
                )}
              </motion.button>

              {selectedCount === 0 && (
                <p className="text-[9px] text-center font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Drop or select clips to apply
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MediaVaultPage() {
  const {
    vaultClips, addClip, updateClip, removeClip,
    blubarberPreset, setBlubarberPreset,
    previewClipId, setPreviewClipId,
    profile,
  } = useSuiteStore();

  const [isApplying, setIsApplying] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const objectUrlMapRef = useRef<Map<string, string>>(new Map());

  // ─── Reattach object URLs for clips that were persisted ─────────────────
  // (objectUrls are not persisted, so vaultClips loaded from storage need new ones)
  // Note: actual File objects are lost on reload — we can only reattach for in-session clips
  useEffect(() => {
    return () => {
      // Cleanup: revoke all object URLs on unmount
      for (const url of objectUrlMapRef.current.values()) URL.revokeObjectURL(url);
      objectUrlMapRef.current.clear();
    };
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID();
      const objectUrl = URL.createObjectURL(file);
      objectUrlMapRef.current.set(id, objectUrl);

      const clip: VaultClip = {
        id,
        name: file.name,
        size: file.size,
        duration: 0,
        status: 'queued',
        styleKey: blubarberPreset,
        objectUrl,
      };
      addClip(clip);

      // Auto-select first one
      if (!useSuiteStore.getState().previewClipId) {
        setPreviewClipId(id);
      }

      // Capture thumbnail + duration async (non-blocking)
      captureThumbnail(file, objectUrl).then(({ thumbnail, duration }) => {
        updateClip(id, { thumbnail, duration });
      });
    }
  }, [addClip, updateClip, blubarberPreset, setPreviewClipId]);

  const handleRemove = useCallback((id: string) => {
    const url = objectUrlMapRef.current.get(id);
    if (url) { URL.revokeObjectURL(url); objectUrlMapRef.current.delete(id); }
    removeClip(id);
    if (useSuiteStore.getState().previewClipId === id) {
      setPreviewClipId(null);
    }
  }, [removeClip, setPreviewClipId]);

  const handleApplyBlubarber = useCallback(async () => {
    const targets = vaultClips.map((c) => c.id);
    if (targets.length === 0) return;

    setIsApplying(true);
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 600);

    for (const id of targets) {
      updateClip(id, { status: 'processing', styleKey: blubarberPreset });
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
      updateClip(id, { status: 'done' });
    }
    setIsApplying(false);
  }, [vaultClips, updateClip, blubarberPreset]);

  const previewClip = vaultClips.find((c) => c.id === previewClipId);
  const previewStyle = previewClip?.styleKey ?? blubarberPreset;
  const accentColor = previewStyle === 'hvac' ? '#FFFF00' : '#EA580C';

  return (
    <div className="flex flex-col h-full min-h-0 relative" style={{ color: '#fff' }}>

      {/* Reveal Flash global overlay */}
      <AnimatePresence>
        {flashActive && (
          <motion.div
            key="reveal-flash"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'linear' }}
            className="absolute inset-0 pointer-events-none z-50"
            style={{ background: 'rgba(234,88,12,0.20)', mixBlendMode: 'screen' }}
          />
        )}
      </AnimatePresence>

      {/* Page header */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(10,10,10,0.50)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.25)' }}>
            <Film className="w-3.5 h-3.5" style={{ color: '#EA580C' }} />
          </div>
          <span className="text-sm font-black tracking-tight">Media Vault</span>
          <span className="text-[10px] font-mono border rounded px-1.5 py-0.5" style={{ color: 'rgba(255,255,255,0.30)', borderColor: 'rgba(255,255,255,0.08)' }}>
            {vaultClips.length} clip{vaultClips.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ color: '#EA580C', background: 'rgba(234,88,12,0.10)', border: '1px solid rgba(234,88,12,0.20)' }}
        >
          {profile.businessName} · {blubarberPreset}
        </span>
      </div>

      {/* Three-column body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: Upload + clip list */}
        <div
          className="flex flex-col gap-3 p-4 overflow-y-auto shrink-0"
          style={{ width: 300, borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          <DropZone onFiles={handleFiles} />

          {vaultClips.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 mt-2">
                <p className="text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Vault Clips
                </p>
                <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {vaultClips.length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <AnimatePresence>
                  {vaultClips.map((clip) => (
                    <ClipRow
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

        {/* CENTER: Magic Preview */}
        <div
          className="flex-1 flex flex-col items-center justify-center gap-5 p-6 overflow-y-auto"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(234,88,12,0.04) 0%, transparent 65%)' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#EA580C' }}>
              Magic Preview
            </span>
            <p className="text-[10px] font-mono text-center" style={{ color: 'rgba(255,255,255,0.30)' }}>
              {previewClip
                ? `${previewClip.name} · ${previewClip.duration.toFixed(1)}s · ${previewStyle}`
                : 'Demo — drop a clip to ingest a real .mp4'}
            </p>
          </div>

          <div style={{ filter: 'drop-shadow(0 32px 60px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(234,88,12,0.08))' }}>
            <RemotionCanvas
              words={DEMO_WORDS}
              duration={7.5}
              styleKey={previewStyle === 'real-estate' ? 'minimal' : previewStyle}
              missionTitle="GHOST CREATOR · Live Preview"
              highlightColor={accentColor}
              showRevealFlash={true}
              transitionSpeed={PRESET_SPEED[blubarberPreset]}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {[
              'Reveal Flash',
              '1.2× Keyword Zoom',
              'Dead Air Purge',
              `${PRESET_SPEED[blubarberPreset]}s Transitions`,
            ].map((label) => (
              <span
                key={label}
                className="text-[9px] font-semibold px-2.5 py-1 rounded-full"
                style={{ color: '#EA580C', background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.20)' }}
              >
                ✦ {label}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT: Blubarber Edge panel + stats */}
        <div
          className="flex flex-col gap-4 p-4 overflow-y-auto shrink-0"
          style={{ width: 300, borderLeft: '1px solid rgba(255,255,255,0.05)' }}
        >
          <BlubarberEdgePanel
            preset={blubarberPreset}
            onPreset={setBlubarberPreset}
            onApply={handleApplyBlubarber}
            isApplying={isApplying}
            selectedCount={vaultClips.length}
          />

          {vaultClips.length > 0 && (
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{
                background: 'rgba(10,10,10,0.50)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p className="text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Vault Status
              </p>
              {(
                [
                  ['Total Clips', vaultClips.length],
                  ['Queued', vaultClips.filter((c) => c.status === 'queued').length],
                  ['Processing', vaultClips.filter((c) => c.status === 'processing').length],
                  ['Done', vaultClips.filter((c) => c.status === 'done').length],
                ] as [string, number][]
              ).map(([label, count]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>{label}</span>
                  <span className="text-xs font-black text-white tabular-nums">{count}</span>
                </div>
              ))}

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.30)' }}>Batch progress</span>
                  <span className="text-[9px] font-mono" style={{ color: '#EA580C' }}>
                    {Math.round(vaultClips.filter((c) => c.status === 'done').length / vaultClips.length * 100)}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: '#EA580C' }}
                    animate={{ width: `${vaultClips.filter((c) => c.status === 'done').length / vaultClips.length * 100}%` }}
                    transition={spring}
                  />
                </div>
              </div>
            </div>
          )}

          {vaultClips.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Film className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.25)' }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.40)' }}>No clips in vault</p>
              <p className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.20)' }}>Drop files to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
