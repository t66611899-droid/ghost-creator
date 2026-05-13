export type EngineStep =
  | 'init'
  | 'audio'
  | 'transcribe'
  | 'silence'
  | 'hooks'
  | 'render'
  | 'done'
  | 'error';

export type EngineEventLevel = 'info' | 'cmd' | 'stdout' | 'stderr' | 'data' | 'warn' | 'error' | 'success';

export interface EngineLogEvent {
  kind: 'log';
  step: EngineStep;
  level: EngineEventLevel;
  message: string;
  ts: number;
}

export interface EngineProgressEvent {
  kind: 'progress';
  step: EngineStep;
  pct: number;
  label?: string;
  ts: number;
}

export interface EngineStepStartEvent {
  kind: 'step:start';
  step: EngineStep;
  label: string;
  ts: number;
}

export interface EngineStepDoneEvent {
  kind: 'step:done';
  step: EngineStep;
  durationMs: number;
  ts: number;
}

export interface EngineResultEvent {
  kind: 'result';
  result: EngineResult;
  ts: number;
}

export interface EngineErrorEvent {
  kind: 'fatal';
  step: EngineStep;
  message: string;
  ts: number;
}

export type EngineEvent =
  | EngineLogEvent
  | EngineProgressEvent
  | EngineStepStartEvent
  | EngineStepDoneEvent
  | EngineResultEvent
  | EngineErrorEvent;

export interface TimestampWord {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface SilenceGap {
  start: number;
  end: number;
  duration: number;
}

export interface SpeechSegment {
  start: number;
  end: number;
  duration: number;
}

export interface ViralHookOut {
  type: 'contrarian' | 'educational' | 'story';
  label: string;
  hookLine: string;
  rationale: string;
  predictedScore: number;
  retention: number;
  reach: string;
  startSec: number;
  endSec: number;
}

export interface RemotionBridge {
  version: 1;
  inputVideo: string;
  totalDurationSec: number;
  fps: number;
  composition: 'GhostCut';
  cuts: Array<{ start: number; end: number; durationSec: number }>;
  captions: TimestampWord[];
  selectedHooks: ViralHookOut[];
  presetKey: string;
}

export interface EngineConfig {
  videoPath: string;
  jobId: string;
  jobDir: string;
  silenceThresholdDb: number;
  silenceMinDurSec: number;
  presetKey: 'barber' | 'gym' | 'realestate';
  fps: number;
}

export interface EngineResult {
  jobId: string;
  jobDir: string;
  durationSec: number;
  silenceGaps: SilenceGap[];
  speechSegments: SpeechSegment[];
  compressionRatio: number;
  timeSavedSec: number;
  transcript: {
    text: string;
    words: TimestampWord[];
    language?: string;
  };
  hooks: ViralHookOut[];
  artifacts: {
    audioWav: string;
    silenceLog: string;
    transcriptJson: string;
    cutsManifest: string;
    remotionBridge: string;
    roughCutMp4?: string;
  };
}
