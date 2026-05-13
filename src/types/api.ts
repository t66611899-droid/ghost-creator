// ─── Core word/transcription types ───────────────────────────────────────────

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionResponse {
  transcription: string;
  words: WordTimestamp[];
  wordCount: number;
  duration: number;
  language: string;
  isRTL: boolean;
}

// ─── Niche analysis ───────────────────────────────────────────────────────────

export interface NicheAnalysis {
  niche: string;
  styleKey: string;
  confidence: number;
  viralScore: number;
  language: string;
  isRTL: boolean;
  reasoning: string;
}

// ─── Pipeline metrics ─────────────────────────────────────────────────────────

export interface PipelineMetrics {
  totalDuration: number;
  speechDuration: number;
  silenceDuration: number;
  compressionRatio: number;
  timeSaved: number;
}

export interface RampDiagnostics {
  totalZones: number;
  skippedZones: number;
  shortestRamp: number;
  longestRamp: number;
  averageRamp: number;
}

export interface PipelineResult {
  metrics: PipelineMetrics;
  ramp: RampDiagnostics | null;
  segmentCount: number;
  styleKey: string;
  srtContent: string;
}

// ─── SSE event payloads  (/api/process streams these) ─────────────────────────

export interface SSELogPayload {
  level: 'engine' | 'success' | 'error' | 'info' | 'warn';
  message: string;
  detail?: string;
}

export interface SSEWordsPayload {
  words: WordTimestamp[];
  wordCount: number;
  duration: number;
  language: string;
  isRTL: boolean;
}

export interface SSENichePayload extends NicheAnalysis {}

export interface SSEPipelinePayload extends PipelineResult {}

export interface SSEErrorPayload {
  message: string;
}

export type SSEEventMap = {
  log: SSELogPayload;
  words: SSEWordsPayload;
  niche: SSENichePayload;
  pipeline: SSEPipelinePayload;
  done: Record<string, never>;
  error: SSEErrorPayload;
};

// ─── HTTP error response ──────────────────────────────────────────────────────

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: string[];
}
