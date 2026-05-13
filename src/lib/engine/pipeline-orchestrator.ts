import fs from 'node:fs';
import path from 'node:path';
import {
  concatRoughCut,
  detectSilence,
  extractAudioWav,
  getFfmpegPath,
  getFfprobePath,
  probeDurationSec,
  speechSegmentsFromSilence,
} from './ffmpeg';
import { selectHooks } from './hooks-selector';
import { transcribeAudio } from './transcribe';
import type { EngineBus } from './events';
import type { EngineConfig, EngineResult, RemotionBridge, SpeechSegment } from './types';

export interface OrchestratorOptions {
  produceRoughCut?: boolean;
}

export async function runPipeline(
  cfg: EngineConfig,
  bus: EngineBus,
  opts: OrchestratorOptions = { produceRoughCut: true },
): Promise<EngineResult> {
  ensureDir(cfg.jobDir);
  bus.stepStart('init', 'Initializing engine');
  bus.log('init', 'info', `job=${cfg.jobId} preset=${cfg.presetKey} fps=${cfg.fps}`);
  bus.log('init', 'info', `videoPath=${cfg.videoPath}`);
  bus.log('init', 'info', `silence threshold=${cfg.silenceThresholdDb}dB minDur=${cfg.silenceMinDurSec}s`);

  const totalDuration = await probeDurationSec(cfg.videoPath, bus);
  bus.log('init', 'data', `duration=${totalDuration.toFixed(2)}s`);
  bus.stepDone('init', 0);

  // ─── A: Audio extraction ─────────────────────────────────
  bus.stepStart('audio', 'Extracting audio (16kHz mono PCM)');
  const tA = Date.now();
  const audioWav = path.join(cfg.jobDir, 'audio.wav');
  await extractAudioWav(cfg.videoPath, audioWav, bus);
  bus.log('audio', 'success', `audio.wav (${formatBytes(fs.statSync(audioWav).size)})`);
  bus.stepDone('audio', Date.now() - tA);

  // ─── B: Transcription ────────────────────────────────────
  bus.stepStart('transcribe', 'Transcribing speech (Deepgram primary, Whisper fallback)');
  const tB = Date.now();
  const transcript = await transcribeAudio(audioWav, bus);
  const transcriptJson = path.join(cfg.jobDir, 'transcript.json');
  await fs.promises.writeFile(transcriptJson, JSON.stringify(transcript, null, 2));
  bus.log(
    'transcribe',
    'success',
    `transcript.json saved · provider=${transcript.provider} · ${transcript.words.length} words`,
  );
  bus.stepDone('transcribe', Date.now() - tB);

  // ─── C: Silence detection & cut planning ─────────────────
  bus.stepStart('silence', 'Detecting silence (FFmpeg silencedetect)');
  const tC = Date.now();
  const silenceGaps = await detectSilence(audioWav, cfg.silenceThresholdDb, cfg.silenceMinDurSec, bus);
  bus.log('silence', 'data', `gaps=${silenceGaps.length}`);

  const speechSegments = speechSegmentsFromSilence(silenceGaps, totalDuration);
  const speechDuration = speechSegments.reduce((s, x) => s + x.duration, 0);
  const compressionRatio = totalDuration > 0 ? speechDuration / totalDuration : 1;
  const timeSavedSec = Math.max(0, totalDuration - speechDuration);
  bus.log(
    'silence',
    'data',
    `segments=${speechSegments.length} kept=${speechDuration.toFixed(2)}s (${(compressionRatio * 100).toFixed(1)}%) saved=${timeSavedSec.toFixed(2)}s`,
  );

  const silenceLog = path.join(cfg.jobDir, 'silence.json');
  await fs.promises.writeFile(silenceLog, JSON.stringify({ silenceGaps, speechSegments, totalDuration }, null, 2));
  bus.log('silence', 'success', `silence.json saved`);
  bus.stepDone('silence', Date.now() - tC);

  // ─── D: AI hook selection ────────────────────────────────
  bus.stepStart('hooks', 'Selecting 3 viral hooks (OpenRouter / DeepSeek)');
  const tD = Date.now();
  const hooks = await selectHooks(transcript, cfg.presetKey, bus);
  hooks.forEach((h) =>
    bus.log('hooks', 'data', `${h.type.toUpperCase()} (${h.predictedScore}) → ${h.hookLine.slice(0, 80)}`),
  );
  bus.stepDone('hooks', Date.now() - tD);

  // ─── Render bridge JSON ──────────────────────────────────
  bus.stepStart('render', 'Render — bridge JSON + rough-cut MP4');
  bus.log('render', 'info', '═══ RENDER START ═══');
  const tR = Date.now();

  await preflightRender(cfg, bus);

  const cuts = speechSegments.map((s: SpeechSegment) => ({
    start: round3(s.start),
    end: round3(s.end),
    durationSec: round3(s.duration),
  }));
  bus.log('render', 'data', `cuts to render: ${cuts.length}`);

  const bridge: RemotionBridge = {
    version: 1,
    inputVideo: path.resolve(cfg.videoPath),
    totalDurationSec: round3(totalDuration),
    fps: cfg.fps,
    composition: 'GhostCut',
    cuts,
    captions: transcript.words,
    selectedHooks: hooks,
    presetKey: cfg.presetKey,
  };

  const cutsManifest = path.join(cfg.jobDir, 'cuts.json');
  const remotionBridge = path.join(cfg.jobDir, 'remotion.bridge.json');
  await fs.promises.writeFile(cutsManifest, JSON.stringify({ cuts, totalDurationSec: bridge.totalDurationSec }, null, 2));
  await fs.promises.writeFile(remotionBridge, JSON.stringify(bridge, null, 2));
  bus.log('render', 'success', `cuts.json + remotion.bridge.json saved → ${cfg.jobDir}`);

  let roughCutMp4: string | undefined;
  if (!opts.produceRoughCut) {
    bus.log('render', 'warn', 'rough-cut skipped (produceRoughCut=false)');
  } else if (cuts.length === 0) {
    bus.log(
      'render',
      'warn',
      '⚠ rough-cut SKIPPED: cuts array is empty (no speech segments detected — try lowering silence threshold)',
    );
  } else {
    bus.log('render', 'info', `concat ${cuts.length} segments via FFmpeg filter_complex (path=${getFfmpegPath()})`);
    roughCutMp4 = path.join(cfg.jobDir, 'rough-cut.mp4');
    await concatRoughCut(cfg.videoPath, speechSegments, roughCutMp4, bus);
    const mp4Size = fs.statSync(roughCutMp4).size;
    bus.log('render', 'success', `rough-cut.mp4 ready → ${roughCutMp4} (${formatBytes(mp4Size)})`);
  }

  bus.log('render', 'success', `═══ RENDER SUCCESS in ${Date.now() - tR}ms ═══`);
  bus.stepDone('render', Date.now() - tR);

  const result: EngineResult = {
    jobId: cfg.jobId,
    jobDir: cfg.jobDir,
    durationSec: totalDuration,
    silenceGaps,
    speechSegments,
    compressionRatio,
    timeSavedSec,
    transcript: { text: transcript.text, words: transcript.words, language: transcript.language },
    hooks,
    artifacts: {
      audioWav,
      silenceLog,
      transcriptJson,
      cutsManifest,
      remotionBridge,
      roughCutMp4,
    },
  };

  bus.result(result);
  bus.stepDone('done', 0);
  return result;
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

async function preflightRender(cfg: EngineConfig, bus: EngineBus): Promise<void> {
  bus.log('render', 'info', `preflight: jobDir=${cfg.jobDir}`);

  // 1. jobDir exists + is writable (Windows ignores POSIX modes; we test by writing a probe file)
  fs.mkdirSync(cfg.jobDir, { recursive: true });
  const probe = path.join(cfg.jobDir, '.write-probe');
  try {
    await fs.promises.writeFile(probe, 'ok', 'utf8');
    await fs.promises.unlink(probe);
    bus.log('render', 'data', `jobDir writable ✓`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`jobDir not writable (${cfg.jobDir}): ${msg}`);
  }

  // 2. Source video still exists
  if (!fs.existsSync(cfg.videoPath)) {
    throw new Error(`source video missing at render time: ${cfg.videoPath}`);
  }
  bus.log('render', 'data', `source video ✓ ${path.resolve(cfg.videoPath)}`);

  // 3. FFmpeg/FFprobe binary exist
  const ff = getFfmpegPath();
  const ffp = getFfprobePath();
  if (path.isAbsolute(ff) && !fs.existsSync(ff)) {
    throw new Error(`FFMPEG_PATH does not exist: ${ff}`);
  }
  if (path.isAbsolute(ffp) && !fs.existsSync(ffp)) {
    throw new Error(`FFPROBE_PATH does not exist: ${ffp}`);
  }
  bus.log('render', 'data', `ffmpeg=${ff}`);
  bus.log('render', 'data', `ffprobe=${ffp}`);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
