/**
 * FFmpeg Pipeline Orchestrator
 * Coordinates all pipeline steps: silence-cutting, karaoke generation, styling, audio ducking
 */

import {
  extractSpeechSegments,
  detectSilenceGaps,
  calculateTrimMetrics,
  type TimestampWord,
  type SpeechSegment,
} from './silence-cutter';

import { generateKaraokeCues, generateSrtWithKaraoke } from './karaoke-generator';

import {
  getStyleConfig,
  generateFilterFromStyle,
  type StyleConfig,
} from './style-config';

import { generateCompleteAudioFilterChain } from './audio-ducking';

import {
  buildRampZones,
  buildSpeedRampFilterGraph,
  getRampDiagnostics,
  DEFAULT_RAMP_CONFIG,
  type SpeedRampConfig,
  type RampZone,
  type RampDiagnostics,
  type RevealIntensity,
} from './speed-ramp';

export interface PipelineConfig {
  silenceThreshold: number;
  style: string;
  wordsPerCue: number;
  audioReduceFactor: number;
  outputDir: string;
  /** When provided, generates speed-ramp data. Auto-enabled for the 'barber' style. */
  speedRamp?: Partial<SpeedRampConfig>;
  /** Per-segment reveal intensities for the Blubarber Edge zoom. */
  revealIntensities?: RevealIntensity[];
}

export interface PipelineOutput {
  speechSegments: SpeechSegment[];
  silenceGaps: Array<{ start: number; end: number; duration: number }>;
  metrics: {
    totalDuration: number;
    speechDuration: number;
    silenceDuration: number;
    compressionRatio: number;
    timeSaved: number;
  };
  srtContent: string;
  styleConfig: StyleConfig;
  ffmpegFilters: {
    video: string;
    audio: string;
  };
  /** Populated when speedRamp is enabled or style === 'barber'. */
  speedRamp?: {
    zones: RampZone[];
    filterGraph: string;
    diagnostics: RampDiagnostics;
  };
}

/**
 * Main pipeline orchestrator
 * Processes Whisper transcript through all transformation steps
 * @param words Word-level timestamps from Whisper
 * @param totalDuration Total video duration in seconds
 * @param config Pipeline configuration
 * @returns Complete pipeline output with all generated artifacts
 */
export function orchestratePipeline(
  words: TimestampWord[],
  totalDuration: number,
  config: PipelineConfig = {
    silenceThreshold: 0.5,
    style: 'barber',
    wordsPerCue: 5,
    audioReduceFactor: 0.3,
    outputDir: 'output',
  }
): PipelineOutput {
  // Step 1: Detect silence and extract speech segments
  const speechSegments = extractSpeechSegments(words, config.silenceThreshold);
  const silenceGaps = detectSilenceGaps(words, config.silenceThreshold);

  // Step 2: Generate timing metrics
  const metrics = calculateTrimMetrics(speechSegments, totalDuration);

  // Step 3: Generate karaoke cues
  const karaokeCues = generateKaraokeCues(words, config.wordsPerCue);

  // Step 4: Create SRT subtitle file
  const srtContent = generateSrtWithKaraoke(karaokeCues);

  // Step 5: Get style configuration
  const styleConfig = getStyleConfig(config.style);

  // Step 6: Generate FFmpeg filters
  const videoFilter = generateFilterFromStyle(
    styleConfig,
    `${config.outputDir}/captions.srt`
  );
  const audioFilter = generateCompleteAudioFilterChain(
    speechSegments,
    config.audioReduceFactor
  );

  // Speed ramp — auto-enabled for 'barber' style; can be explicitly opt-in for others
  const rampEnabled = config.style === 'barber' || config.speedRamp !== undefined;
  let speedRamp: PipelineOutput['speedRamp'];

  if (rampEnabled) {
    const rampConfig = { ...DEFAULT_RAMP_CONFIG, ...config.speedRamp };
    const zones = buildRampZones(speechSegments, rampConfig, config.revealIntensities);
    const filterGraph = buildSpeedRampFilterGraph(zones, rampConfig);
    const diagnostics = getRampDiagnostics(speechSegments, zones);
    speedRamp = { zones, filterGraph, diagnostics };
  }

  return {
    speechSegments,
    silenceGaps,
    metrics,
    srtContent,
    styleConfig,
    ffmpegFilters: {
      video: videoFilter,
      audio: audioFilter,
    },
    speedRamp,
  };
}

/**
 * Generates the complete FFmpeg command for the pipeline
 * @param inputFile Path to input video
 * @param pipelineOutput Output from orchestratePipeline
 * @param outputFile Path to final output video
 * @returns Complete FFmpeg command string
 */
export function generateFinalFfmpegCommand(
  inputFile: string,
  pipelineOutput: PipelineOutput,
  outputFile: string
): string {
  const { ffmpegFilters, speechSegments } = pipelineOutput;

  // Build segment trim commands
  const segmentCommands = speechSegments
    .map(
      (segment, i) =>
        `ffmpeg -ss ${segment.start.toFixed(3)} -to ${segment.end.toFixed(3)} -i "${inputFile}" -c copy "segment-${i}.mp4"`
    )
    .join('\n');

  // Build concat demuxer list
  const concatList = speechSegments
    .map((_, i) => `file 'segment-${i}.mp4'`)
    .join('\n');

  // Final render command
  const finalCommand = `ffmpeg -f concat -safe 0 -i concat-list.txt -vf "${ffmpegFilters.video}" -af "${ffmpegFilters.audio}" -c:v libx264 -crf 22 -preset medium -c:a aac -b:a 128k "${outputFile}"`;

  return `${segmentCommands}\n\n# Save to concat-list.txt:\n${concatList}\n\n${finalCommand}`;
}

/**
 * Validates pipeline input
 * @param words Word array from Whisper
 * @returns Validation result
 */
export function validatePipelineInput(words: TimestampWord[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(words) || words.length === 0) {
    errors.push('Words array is empty or not an array');
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (typeof word.start !== 'number' || word.start < 0) {
      errors.push(`Word ${i}: invalid start timestamp`);
    }
    if (typeof word.end !== 'number' || word.end < word.start) {
      errors.push(`Word ${i}: invalid end timestamp`);
    }
    if (!word.word || typeof word.word !== 'string') {
      errors.push(`Word ${i}: missing or invalid word text`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
