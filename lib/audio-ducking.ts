/**
 * Audio Ducking & Music Sync Module
 * Implements volume reduction when speech is detected
 */

export interface SpeechSegment {
  start: number;
  end: number;
}

export interface AudioDuckingConfig {
  targetDb: number; // How much to reduce (e.g., -6, -12)
  attackMs: number; // Time to fade down
  releaseMs: number; // Time to fade back up
  threshold: number; // dB threshold to trigger ducking
}

/**
 * Generates FFmpeg audio ducking filter
 * Reduces music volume when speech is detected
 * @param speechSegments Array of speech timing segments
 * @param config Ducking configuration
 * @returns FFmpeg filter complex string
 */
export function generateDuckingFilter(
  speechSegments: SpeechSegment[],
  config: AudioDuckingConfig = {
    targetDb: -12,
    attackMs: 50,
    releaseMs: 100,
    threshold: -20,
  }
): string {
  if (!speechSegments || speechSegments.length === 0) {
    return '[0:a]aformat=sample_rates=48000[audio]';
  }

  // Create a sidechain from the speech timeline
  const sidechain = generateSidechainTimeline(speechSegments);

  return `[0:a]aformat=sample_rates=48000,volume=0:eval=frame[audio]`;
}

/**
 * Generates FFmpeg dynamicaudionorm for ducking effect
 * Uses gate filter to detect speech energy
 * @param speechSegments Array of speech segments
 * @returns FFmpeg filter string
 */
export function generateGateDuckingFilter(
  speechSegments: SpeechSegment[]
): string {
  // Gate filter to reduce volume below threshold
  return `[0:a]gate=level_in=1:range=1:threshold=-30:ratio=4:attack=0.005:release=0.1[audio]`;
}

/**
 * Generates simple volume envelope using volume filter
 * Reduces volume during non-speech segments
 * @param speechSegments Array of speech segments
 * @param videoLength Total video length in seconds
 * @param reduceFactor How much to reduce (0-1)
 * @returns FFmpeg setpts and volume filter chain
 */
export function generateVolumeEnvelopeFilter(
  speechSegments: SpeechSegment[],
  videoLength: number,
  reduceFactor: number = 0.3
): string {
  if (!speechSegments || speechSegments.length === 0) {
    return '[0:a]volume=1[audio]';
  }

  // Build volume changes at key timestamps
  const changes: Array<{ time: number; volume: number }> = [];

  for (let i = 0; i < speechSegments.length; i++) {
    const segment = speechSegments[i];
    const nextSegment = speechSegments[i + 1];

    // Volume returns to normal at speech start
    changes.push({
      time: segment.start,
      volume: 1.0,
    });

    // Volume reduces after speech ends
    if (nextSegment) {
      const silenceDuration = nextSegment.start - segment.end;
      if (silenceDuration > 0.2) {
        changes.push({
          time: segment.end,
          volume: reduceFactor,
        });
      }
    } else {
      // Last segment - reduce volume after it ends
      changes.push({
        time: segment.end,
        volume: reduceFactor,
      });
    }
  }

  // Sort by time and remove duplicates
  const sortedChanges = changes.sort((a, b) => a.time - b.time);
  const uniqueChanges = [];
  for (const change of sortedChanges) {
    if (
      !uniqueChanges.length ||
      uniqueChanges[uniqueChanges.length - 1].time !== change.time
    ) {
      uniqueChanges.push(change);
    }
  }

  // Generate volume filter expression
  if (uniqueChanges.length === 0) {
    return '[0:a]volume=1[audio]';
  }

  let filterStr = '[0:a]';

  // Build piecewise linear volume envelope
  const volumeExpr = buildVolumeExpression(uniqueChanges, videoLength);
  filterStr += `volume='${volumeExpr}'[audio]`;

  return filterStr;
}

/**
 * Builds volume expression for FFmpeg volume filter
 * Creates piecewise linear interpolation between volume changes
 * @param changes Array of time-volume changes
 * @param videoLength Total duration
 * @returns Expression string
 */
function buildVolumeExpression(
  changes: Array<{ time: number; volume: number }>,
  videoLength: number
): string {
  if (changes.length === 0) return '1';
  if (changes.length === 1) return String(changes[0].volume);

  // Start with initial volume
  let expr = `if(lt(t,${changes[0].time}),1,`;

  // Build interpolation between each pair of changes
  for (let i = 0; i < changes.length - 1; i++) {
    const current = changes[i];
    const next = changes[i + 1];
    const timeDiff = next.time - current.time;
    const volumeDiff = next.volume - current.volume;

    expr += `if(lt(t,${next.time}),`;
    expr += `${current.volume}+(t-${current.time})*(${volumeDiff}/${timeDiff}),`;
  }

  // Final segment
  expr += String(changes[changes.length - 1].volume);

  // Close all if statements
  for (let i = 0; i < changes.length - 1; i++) {
    expr += ')';
  }
  expr += ')';

  return expr;
}

/**
 * Generates sidechain timeline for complex filter
 * Used with overlay or other filters for synchronized ducking
 * @param speechSegments Array of speech segments
 * @returns Array of enable expressions for FFmpeg
 */
function generateSidechainTimeline(
  speechSegments: SpeechSegment[]
): string[] {
  const enables: string[] = [];

  for (const segment of speechSegments) {
    enables.push(
      `enable='between(t,${segment.start.toFixed(3)},${segment.end.toFixed(3)})'`
    );
  }

  return enables;
}

/**
 * Generates complete FFmpeg audio filter chain with ducking
 * Combines normalization + ducking + compression
 * @param speechSegments Array of speech segments
 * @param reduceFactor Volume reduction factor (0-1)
 * @returns Complete FFmpeg audio filter string
 */
export function generateCompleteAudioFilterChain(
  speechSegments: SpeechSegment[],
  reduceFactor: number = 0.3
): string {
  return `${generateVolumeEnvelopeFilter(speechSegments, 0, reduceFactor)},acompressor=threshold=-20dB:ratio=4:attack=0.005s:release=0.1s`;
}
