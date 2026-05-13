/**
 * Ghost Creator - Comprehensive Type Definitions
 * Central export for all Brain module types
 */

// ─────────────────────────────────────────────────────────────
// SILENCE-CUTTER Types
// ─────────────────────────────────────────────────────────────

export interface TimestampWord {
  word: string;
  start: number;
  end: number;
}

export interface SpeechSegment {
  start: number;
  end: number;
  duration: number;
}

export interface SilenceGap {
  start: number;
  end: number;
  duration: number;
}

export interface TrimMetrics {
  totalDuration: number;
  speechDuration: number;
  silenceDuration: number;
  compressionRatio: number;
  timeSaved: number;
}

// ─────────────────────────────────────────────────────────────
// KARAOKE-GENERATOR Types
// ─────────────────────────────────────────────────────────────

export interface KaraokeWord {
  word: string;
  start: number;
  end: number;
  position: number;
}

export interface KaraokeCue {
  index: number;
  start: number;
  end: number;
  words: KaraokeWord[];
  fullText: string;
}

export interface KaraokeJsonOutput {
  cues: Array<{
    index: number;
    start: number;
    end: number;
    words: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
}

// ─────────────────────────────────────────────────────────────
// STYLE-CONFIG Types
// ─────────────────────────────────────────────────────────────

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  color: string;
  backgroundColor: string;
  opacity: number;
  borderStyle: number;
  borderWidth: number;
  shadowDepth: number;
  alignment: 'left' | 'center' | 'right';
}

export interface VideoStyle {
  aspectRatio: '9:16' | '16:9' | '1:1';
  backgroundColor: string;
  maxBrightness: number;
  vibrance: number;
  saturation: number;
}

export interface AnimationStyle {
  wordHighlightColor: string;
  wordHighlightDuration: number;
  captionFadeInDuration: number;
  captionFadeOutDuration: number;
}

export interface AudioStyle {
  duckingAmount: number;
  duckingThreshold: number;
}

export interface StyleConfig {
  name: string;
  description: string;
  niche: string;
  caption: CaptionStyle;
  video: VideoStyle;
  animation: AnimationStyle;
  audio: AudioStyle;
}

// ─────────────────────────────────────────────────────────────
// AUDIO-DUCKING Types
// ─────────────────────────────────────────────────────────────

export interface AudioDuckingConfig {
  targetDb: number;
  attackMs: number;
  releaseMs: number;
  threshold: number;
}

export interface VolumeChange {
  time: number;
  volume: number;
}

// ─────────────────────────────────────────────────────────────
// PIPELINE-ORCHESTRATOR Types
// ─────────────────────────────────────────────────────────────

export interface PipelineConfig {
  silenceThreshold: number;
  style: string;
  wordsPerCue: number;
  audioReduceFactor: number;
  outputDir: string;
}

export interface FfmpegFilters {
  video: string;
  audio: string;
}

export interface PipelineOutput {
  speechSegments: SpeechSegment[];
  silenceGaps: SilenceGap[];
  metrics: TrimMetrics;
  srtContent: string;
  styleConfig: StyleConfig;
  ffmpegFilters: FfmpegFilters;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─────────────────────────────────────────────────────────────
// Whisper API Response Types
// ─────────────────────────────────────────────────────────────

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
  words?: WhisperWord[];
}

export interface WhisperTranscription {
  text: string;
  language: string;
  segments: WhisperSegment[];
  duration?: number;
}

// ─────────────────────────────────────────────────────────────
// FFmpeg Command Types
// ─────────────────────────────────────────────────────────────

export interface TrimCommand {
  start: number;
  end: number;
  inputFile: string;
  outputFile: string;
  command: string;
}

export interface ConcatListEntry {
  file: string;
  duration?: number;
}

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

export interface TranscriptionResponse {
  transcription: string;
}

export interface PipelineResponse {
  success: boolean;
  data?: PipelineOutput;
  error?: string;
  metrics?: TrimMetrics;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// UI Component Props Types
// ─────────────────────────────────────────────────────────────

export interface VideoUploadProps {
  onTranscriptionComplete?: (data: TranscriptionResponse) => void;
  onError?: (error: ErrorResponse) => void;
}

export interface CaptionPreviewProps {
  cues: KaraokeCue[];
  style: StyleConfig;
}

export interface StatsDisplayProps {
  metrics: TrimMetrics;
  gaps: SilenceGap[];
  segments: SpeechSegment[];
}
