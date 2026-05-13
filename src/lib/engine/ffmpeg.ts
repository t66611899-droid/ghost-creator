import { spawn } from 'node:child_process';
import path from 'node:path';
import type { EngineBus } from './events';
import type { EngineStep, SilenceGap, SpeechSegment } from './types';

export function getFfmpegPath(): string {
  return process.env.FFMPEG_PATH?.trim() || 'ffmpeg';
}

export function getFfprobePath(): string {
  return process.env.FFPROBE_PATH?.trim() || 'ffprobe';
}

interface RunOpts {
  bus?: EngineBus;
  step: EngineStep;
  label?: string;
}

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runProcess(cmd: string, args: string[], opts: RunOpts): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const { bus, step, label } = opts;
    bus?.log(step, 'cmd', `${label ? `[${label}] ` : ''}${path.basename(cmd)} ${args.map(quote).join(' ')}`);
    const child = spawn(cmd, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d: Buffer) => {
      const s = d.toString();
      stdout += s;
      for (const line of s.split(/\r?\n/)) if (line) bus?.log(step, 'stdout', line);
    });
    child.stderr.on('data', (d: Buffer) => {
      const s = d.toString();
      stderr += s;
      for (const line of s.split(/\r?\n/)) if (line) bus?.log(step, 'stderr', line);
    });
    child.on('error', (err) => {
      bus?.log(step, 'error', `process error: ${err.message}`);
      reject(err);
    });
    child.on('close', (code) => resolve({ exitCode: code ?? 0, stdout, stderr }));
  });
}

function quote(arg: string): string {
  return /\s/.test(arg) ? `"${arg}"` : arg;
}

export async function probeDurationSec(input: string, bus: EngineBus): Promise<number> {
  const { stdout, exitCode, stderr } = await runProcess(
    getFfprobePath(),
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', input],
    { bus, step: 'init', label: 'probe' },
  );
  if (exitCode !== 0) throw new Error(`ffprobe failed: ${stderr.trim() || 'unknown'}`);
  const dur = parseFloat(stdout.trim());
  if (!Number.isFinite(dur)) throw new Error(`ffprobe duration parse failed: "${stdout.trim()}"`);
  return dur;
}

export async function extractAudioWav(input: string, output: string, bus: EngineBus): Promise<void> {
  const { exitCode, stderr } = await runProcess(
    getFfmpegPath(),
    ['-y', '-i', input, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', output],
    { bus, step: 'audio', label: 'extract-wav' },
  );
  if (exitCode !== 0) throw new Error(`audio extract failed: ${stderr.trim().slice(-400)}`);
}

export async function detectSilence(
  input: string,
  thresholdDb: number,
  minDur: number,
  bus: EngineBus,
): Promise<SilenceGap[]> {
  const { stderr, exitCode } = await runProcess(
    getFfmpegPath(),
    [
      '-hide_banner',
      '-nostats',
      '-i',
      input,
      '-af',
      `silencedetect=noise=${thresholdDb}dB:d=${minDur}`,
      '-f',
      'null',
      '-',
    ],
    { bus, step: 'silence', label: 'silencedetect' },
  );
  if (exitCode !== 0) throw new Error(`silencedetect failed: ${stderr.trim().slice(-400)}`);

  const gaps: SilenceGap[] = [];
  const startRe = /silence_start:\s*([0-9.]+)/g;
  const endRe = /silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/g;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = startRe.exec(stderr))) starts.push(parseFloat(m[1]));
  let i = 0;
  while ((m = endRe.exec(stderr))) {
    const end = parseFloat(m[1]);
    const duration = parseFloat(m[2]);
    const start = starts[i++] ?? Math.max(0, end - duration);
    gaps.push({ start, end, duration });
  }
  return gaps;
}

export function speechSegmentsFromSilence(
  gaps: SilenceGap[],
  totalDuration: number,
  edgePadSec = 0.05,
): SpeechSegment[] {
  const segs: SpeechSegment[] = [];
  let cursor = 0;
  for (const g of gaps) {
    const start = Math.max(0, cursor - edgePadSec);
    const end = Math.min(totalDuration, g.start + edgePadSec);
    if (end - start > 0.15) segs.push({ start, end, duration: end - start });
    cursor = g.end;
  }
  if (totalDuration - cursor > 0.15) {
    segs.push({ start: Math.max(0, cursor - edgePadSec), end: totalDuration, duration: totalDuration - cursor + edgePadSec });
  }
  return segs;
}

export async function concatRoughCut(
  input: string,
  segments: SpeechSegment[],
  output: string,
  bus: EngineBus,
): Promise<void> {
  if (segments.length === 0) throw new Error('no segments to concat');
  const filterParts: string[] = [];
  segments.forEach((s, i) => {
    filterParts.push(`[0:v]trim=start=${s.start.toFixed(3)}:end=${s.end.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`);
    filterParts.push(`[0:a]atrim=start=${s.start.toFixed(3)}:end=${s.end.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`);
  });
  const labels = segments.map((_, i) => `[v${i}][a${i}]`).join('');
  const filter = `${filterParts.join(';')};${labels}concat=n=${segments.length}:v=1:a=1[v][a]`;

  const { exitCode, stderr } = await runProcess(
    getFfmpegPath(),
    [
      '-y',
      '-i',
      input,
      '-filter_complex',
      filter,
      '-map',
      '[v]',
      '-map',
      '[a]',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '22',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      output,
    ],
    { bus, step: 'render', label: 'concat-cut' },
  );
  if (exitCode !== 0) throw new Error(`concat render failed: ${stderr.trim().slice(-400)}`);
}
