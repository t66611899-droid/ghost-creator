import { spawn } from 'child_process';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { generateASS, type ASSConfig } from './ass-generator';
import { extractSpeechSegments, type TimestampWord } from './silence-cutter';
import { buildRampZones, buildSpeedRampFilterGraph, DEFAULT_RAMP_CONFIG } from './speed-ramp';
import { getStyleConfig } from './style-config';

// Windows-style path for FFmpeg drawtext/ass (must use forward slashes or escaped backslashes)
const FFMPEG_BIN =
  process.env.FFMPEG_PATH ??
  'C:/Users/foxti/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe';

// Hebrew-capable system font for burn-in (David Bold is native Hebrew)
const HEBREW_FONT = 'C:/Windows/Fonts/davidbd.ttf';
const LATIN_FONT = 'C:/Windows/Fonts/arialbd.ttf';

export interface RenderInput {
  fileBuffer: Buffer;
  mimeType: string;
  filename: string;
  words: TimestampWord[];
  duration: number;
  styleKey: string;
  isRTL: boolean;
  onLog?: (msg: string) => void;
}

export type RenderOutput =
  | { success: true; mp4Buffer: Buffer; durationSec: number }
  | { success: false; error: string };

function runFFmpeg(args: string[], onLog?: (msg: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    proc.stderr.on('data', (chunk: Buffer) => {
      const line = chunk.toString().trim();
      if (line && onLog) onLog(line);
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

export async function renderVideo(input: RenderInput): Promise<RenderOutput> {
  const { fileBuffer, mimeType, filename, words, duration, styleKey, isRTL, onLog } = input;
  const log = (m: string) => { console.log('[renderer]', m); onLog?.(m); };

  const workDir = join(tmpdir(), `ghost-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  const isAudioOnly = mimeType.startsWith('audio/');
  const inputExt = filename.split('.').pop() ?? 'mp4';
  const inputPath = join(workDir, `input.${inputExt}`);
  const assPath = join(workDir, 'captions.ass');
  const concatPath = join(workDir, 'concat.txt');
  const silenceCutPath = join(workDir, 'silencecut.mp4');
  const outputPath = join(workDir, 'output.mp4');

  try {
    // ── 1. Write input file ──────────────────────────────────────────────────────
    await writeFile(inputPath, fileBuffer);
    log(`Input written: ${inputPath} (${(fileBuffer.length / 1024).toFixed(0)} KB)`);

    // ── 2. For audio-only: create black video background ─────────────────────────
    let videoInputPath = inputPath;
    if (isAudioOnly) {
      log('Audio-only input — generating black 1080×1920 background');
      const blackPath = join(workDir, 'black.mp4');
      await runFFmpeg([
        '-y',
        '-f', 'lavfi', '-i', `color=black:size=1080x1920:rate=30`,
        '-i', inputPath,
        '-c:v', 'libx264', '-crf', '28', '-preset', 'ultrafast',
        '-c:a', 'aac', '-b:a', '128k',
        '-shortest',
        blackPath,
      ], log);
      videoInputPath = blackPath;
    }

    // ── 3. Silence cutting via concat demuxer ────────────────────────────────────
    log('Computing speech segments…');
    const segments = extractSpeechSegments(words, 0.5);
    log(`${segments.length} segments found`);

    if (segments.length > 0) {
      const concatLines = segments.map(
        (s) => `file '${videoInputPath.replace(/\\/g, '/')}'\ninpoint ${s.start.toFixed(3)}\noutpoint ${s.end.toFixed(3)}`
      );
      await writeFile(concatPath, concatLines.join('\n'));

      await runFFmpeg([
        '-y',
        '-f', 'concat', '-safe', '0',
        '-i', concatPath,
        '-c', 'copy',
        silenceCutPath,
      ], log);
      log('Silence cut complete');
    } else {
      // No segments — copy through
      await runFFmpeg(['-y', '-i', videoInputPath, '-c', 'copy', silenceCutPath], log);
    }

    // ── 4. Speed ramp (barber style) ─────────────────────────────────────────────
    let rampedPath = silenceCutPath;
    if (styleKey === 'barber' && segments.length > 1) {
      const rampedOut = join(workDir, 'ramped.mp4');
      const zones = buildRampZones(segments, DEFAULT_RAMP_CONFIG);
      if (zones.length > 0) {
        log(`Applying speed ramp — ${zones.length} zones`);
        const fg = buildSpeedRampFilterGraph(zones, DEFAULT_RAMP_CONFIG);
        await runFFmpeg([
          '-y', '-i', silenceCutPath,
          '-filter_complex', fg,
          '-map', '[outv]', '-map', '[outa]',
          '-c:v', 'libx264', '-crf', '22', '-preset', 'fast',
          '-c:a', 'aac', '-b:a', '128k',
          rampedOut,
        ], log);
        rampedPath = rampedOut;
        log('Speed ramp applied');
      }
    }

    // ── 5. Generate ASS subtitle file ─────────────────────────────────────────────
    log('Generating ASS subtitles…');
    const style = getStyleConfig(styleKey);
    const fontFile = isRTL ? HEBREW_FONT : LATIN_FONT;

    const assConfig: Partial<ASSConfig> = {
      fontName: isRTL ? 'David' : style.caption.fontFamily.replace(/\s+/g, ' '),
      fontSize: style.caption.fontSize,
      primaryColor: style.caption.color,
      highlightColor: style.animation.wordHighlightColor,
      isRTL,
      wordsPerCue: 4,
      playResX: 1080,
      playResY: 1920,
    };

    const assContent = generateASS(words, assConfig);
    await writeFile(assPath, assContent, 'utf8');
    log(`ASS file written (${words.length} words)`);

    // ── 6. Burn captions via libass ───────────────────────────────────────────────
    // Windows path for FFmpeg filter value: forward slashes, drive colon escaped as \:
    // Fontconfig on Windows automatically scans C:\Windows\Fonts — no fontsdir needed.
    const assFilterPath = assPath
      .replace(/\\/g, '/')         // backslashes → forward slashes
      .replace(/^([A-Za-z]):/, (_, d) => `${d}\\:`);  // C: → C\:

    log('Burning captions with libass…');
    await runFFmpeg([
      '-y', '-i', rampedPath,
      '-vf', `ass='${assFilterPath}'`,
      '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath,
    ], log);
    log('Caption burn complete');

    // ── 7. Read result ────────────────────────────────────────────────────────────
    const mp4Buffer = await readFile(outputPath);
    log(`Output: ${(mp4Buffer.length / 1024 / 1024).toFixed(1)} MB`);

    return { success: true, mp4Buffer, durationSec: duration };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
