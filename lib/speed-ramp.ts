import type { SpeechSegment } from './silence-cutter';

// ─── Public config ────────────────────────────────────────────────────────────

export interface SpeedRampConfig {
  /** Seconds of silence to keep before the snap, played at rampSpeed. Default 1.5. */
  anticipationDuration: number;
  /** Playback speed of the anticipation window. Default 1.5. Must be ≤ 2.0 (atempo limit). */
  rampSpeed: number;
  /** Source video frame rate. Used to align snap timestamps to frame boundaries. Default 30. */
  fps: number;
}

export const DEFAULT_RAMP_CONFIG: SpeedRampConfig = {
  anticipationDuration: 1.5,
  rampSpeed: 1.5,
  fps: 30,
};

/**
 * Blubarber Edge: the reveal intensity at the snap point.
 * - 'lineup' → tight zoom (hair edge revealed with precision)
 * - 'fade'   → gentle zoom (gradual reveal, softer entry)
 */
export type RevealIntensity = 'lineup' | 'fade';

// ─── Core data shape ──────────────────────────────────────────────────────────

export interface RampZone {
  /** Frame-aligned start of the anticipation window (inside silence). */
  rampStart: number;
  /** Frame-aligned moment speech resumes — the snap. */
  snapPoint: number;
  /** Frame-aligned end of speech segment. */
  speechEnd: number;
  /** Actual anticipation duration (≤ anticipationDuration when silence is shorter). */
  rampDuration: number;
  /** Controls zoom intensity applied at the snap. */
  revealIntensity: RevealIntensity;
  /** Index of the SpeechSegment this zone leads into. */
  segmentIndex: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Rounds a timestamp to the nearest frame boundary. */
function alignToFrame(timestamp: number, fps: number): number {
  return Math.round(timestamp * fps) / fps;
}

/**
 * Zoom scale values per reveal intensity.
 * Applied to the body window via a scale filter at render time.
 */
const ZOOM_SCALE: Record<RevealIntensity, number> = {
  lineup: 1.06,
  fade: 1.02,
};

// ─── Zone builder ─────────────────────────────────────────────────────────────

/**
 * Derives RampZone entries from speech segments.
 *
 * Each zone covers:
 *   [rampStart … snapPoint]  → played at rampSpeed  (anticipation)
 *   [snapPoint … speechEnd]  → played at 1.0x        (the reveal / speech body)
 *
 * The first segment is skipped — there is no preceding silence to ramp through.
 * A zone is also skipped when the silence gap is shorter than one frame.
 *
 * @param segments      Speech segments from extractSpeechSegments()
 * @param config        Speed ramp parameters
 * @param intensities   Optional per-segment reveal intensity override (indexed by segment position)
 */
export function buildRampZones(
  segments: SpeechSegment[],
  config: SpeedRampConfig = DEFAULT_RAMP_CONFIG,
  intensities?: RevealIntensity[]
): RampZone[] {
  const { anticipationDuration, fps } = config;
  const minFrameDuration = 1 / fps;
  const zones: RampZone[] = [];

  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];

    const snapPoint = alignToFrame(curr.start, fps);
    const speechEnd = alignToFrame(curr.end, fps);

    // Ramp cannot reach back into the previous speech segment
    const earliestRampStart = alignToFrame(prev.end, fps);
    const idealRampStart = alignToFrame(snapPoint - anticipationDuration, fps);
    const rampStart = Math.max(earliestRampStart, idealRampStart);
    const rampDuration = snapPoint - rampStart;

    // Skip if silence gap is shorter than one frame — nothing to ramp
    if (rampDuration < minFrameDuration) continue;

    zones.push({
      rampStart,
      snapPoint,
      speechEnd,
      rampDuration,
      revealIntensity: intensities?.[i] ?? 'fade',
      segmentIndex: i,
    });
  }

  return zones;
}

// ─── Filter graph builder ─────────────────────────────────────────────────────

/**
 * Builds the FFmpeg complex filtergraph string for all ramp zones.
 *
 * Video strategy per zone:
 *   trim + setpts=(PTS-STARTPTS)/{speed}  → compress timestamps = faster playback
 *   trim + setpts=PTS-STARTPTS            → real-time playback (speech body)
 *   Optional scale filter on body for reveal zoom (Blubarber Edge)
 *
 * Audio strategy per zone:
 *   atrim + atempo={speed} + asetpts      → 1.5x audio speed during ramp
 *   atrim + asetpts                       → 1.0x audio during speech body
 *
 * All pieces are concatenated in timeline order into [outv] and [outa].
 *
 * NOTE: atempo is limited to the range [0.5, 2.0] — single filter is sufficient
 * at the default 1.5x rampSpeed. If you ever increase rampSpeed above 2.0,
 * chain two atempo filters: atempo=2.0,atempo=X/2.0
 */
export function buildSpeedRampFilterGraph(
  zones: RampZone[],
  config: SpeedRampConfig = DEFAULT_RAMP_CONFIG
): string {
  if (zones.length === 0) return '';

  const { rampSpeed } = config;
  const videoFilters: string[] = [];
  const audioFilters: string[] = [];
  const videoLabels: string[] = [];
  const audioLabels: string[] = [];

  for (const zone of zones) {
    const { rampStart, snapPoint, speechEnd, revealIntensity, segmentIndex: i } = zone;
    const rs = rampStart.toFixed(6);
    const sp = snapPoint.toFixed(6);
    const se = speechEnd.toFixed(6);
    const zoom = ZOOM_SCALE[revealIntensity];

    // Ramp window: compressed PTS = faster playback
    videoFilters.push(
      `[0:v]trim=${rs}:${sp},setpts=(PTS-STARTPTS)/${rampSpeed}[rv${i}]`
    );

    // Body window: real-time, with reveal zoom scaled uniformly
    videoFilters.push(
      `[0:v]trim=${sp}:${se},setpts=PTS-STARTPTS,scale=iw*${zoom}:ih*${zoom}:flags=lanczos,crop=iw/${zoom}:ih/${zoom}[bv${i}]`
    );

    // Ramp audio: atempo speeds up to match video compression
    audioFilters.push(
      `[0:a]atrim=${rs}:${sp},atempo=${rampSpeed},asetpts=PTS-STARTPTS[ra${i}]`
    );

    // Body audio: pass through
    audioFilters.push(
      `[0:a]atrim=${sp}:${se},asetpts=PTS-STARTPTS[ba${i}]`
    );

    videoLabels.push(`[rv${i}]`, `[bv${i}]`);
    audioLabels.push(`[ra${i}]`, `[ba${i}]`);
  }

  const totalParts = zones.length * 2;
  const videoConcat = `${videoLabels.join('')}concat=n=${totalParts}:v=1:a=0[outv]`;
  const audioConcat = `${audioLabels.join('')}concat=n=${totalParts}:v=0:a=1[outa]`;

  return [
    ...videoFilters,
    videoConcat,
    ...audioFilters,
    audioConcat,
  ].join(';\n');
}

// ─── Command builder ──────────────────────────────────────────────────────────

/**
 * Returns a ready-to-run FFmpeg command that applies all speed ramps.
 * Falls back to a passthrough copy when there are no zones to process.
 */
export function buildSpeedRampCommand(
  inputFile: string,
  outputFile: string,
  zones: RampZone[],
  config: SpeedRampConfig = DEFAULT_RAMP_CONFIG
): string {
  const filterGraph = buildSpeedRampFilterGraph(zones, config);

  if (!filterGraph) {
    return `ffmpeg -i "${inputFile}" -c copy "${outputFile}"`;
  }

  return [
    `ffmpeg -i "${inputFile}"`,
    `-filter_complex "${filterGraph.replace(/\n/g, ' ')}"`,
    `-map "[outv]" -map "[outa]"`,
    `-c:v libx264 -crf 22 -preset medium`,
    `-c:a aac -b:a 128k`,
    `"${outputFile}"`,
  ].join(' \\\n  ');
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

export interface RampDiagnostics {
  totalZones: number;
  skippedZones: number;
  shortestRamp: number;
  longestRamp: number;
  averageRamp: number;
}

/**
 * Returns timing stats for the ramp zones — useful for UI display and debugging.
 */
export function getRampDiagnostics(
  segments: SpeechSegment[],
  zones: RampZone[]
): RampDiagnostics {
  const possibleZones = Math.max(0, segments.length - 1);
  const durations = zones.map((z) => z.rampDuration);

  return {
    totalZones: zones.length,
    skippedZones: possibleZones - zones.length,
    shortestRamp: durations.length ? Math.min(...durations) : 0,
    longestRamp: durations.length ? Math.max(...durations) : 0,
    averageRamp: durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0,
  };
}
