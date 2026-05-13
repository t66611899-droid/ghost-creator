import type { TimestampWord } from './silence-cutter';
import { validatePipelineInput } from './pipeline-orchestrator';

// RTL Unicode script ranges
const RTL_REGEX = /[֐-׿؀-ۿ܀-ݏݐ-ݿࢠ-ࣿיִ-﷽ﹰ-﻿]/;

export interface RawWhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface RawWhisperVerboseResponse {
  text: string;
  language?: string;
  words?: RawWhisperWord[];
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    words?: RawWhisperWord[];
  }>;
}

export interface ProcessedTranscription {
  text: string;
  words: TimestampWord[];
  wordCount: number;
  duration: number;
  language: string;
  isRTL: boolean;
}

export interface ProcessingError {
  code: 'NO_WORDS' | 'INVALID_WORDS' | 'VALIDATION_FAILED' | 'EMPTY_FILE';
  message: string;
  details?: string[];
}

export type ProcessingResult =
  | { success: true; data: ProcessedTranscription }
  | { success: false; error: ProcessingError };

function extractWords(response: RawWhisperVerboseResponse): RawWhisperWord[] {
  if (response.words && response.words.length > 0) return response.words;

  if (response.segments) {
    const segmentWords: RawWhisperWord[] = [];
    for (const seg of response.segments) {
      if (seg.words) segmentWords.push(...seg.words);
    }
    if (segmentWords.length > 0) return segmentWords;
  }

  return [];
}

function normaliseWords(raw: RawWhisperWord[]): TimestampWord[] {
  return raw
    .map((w) => ({
      word: w.word.trim(),
      start: w.start,
      end: w.end,
    }))
    .filter((w) => w.word.length > 0 && w.end > w.start);
}

function detectRTL(text: string, languageCode?: string): boolean {
  const RTL_LANGUAGE_CODES = new Set([
    'he', 'iw', // Hebrew
    'ar',       // Arabic
    'fa', 'per',// Persian/Farsi
    'ur',       // Urdu
    'yi',       // Yiddish
    'ckb',      // Sorani Kurdish
    'prs',      // Dari
  ]);

  if (languageCode && RTL_LANGUAGE_CODES.has(languageCode.toLowerCase())) return true;
  return RTL_REGEX.test(text);
}

export function processTranscription(
  response: RawWhisperVerboseResponse
): ProcessingResult {
  const rawWords = extractWords(response);

  if (rawWords.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_WORDS',
        message:
          'Whisper returned no word-level timestamps. Ensure timestamp_granularities includes "word" and the audio contains speech.',
      },
    };
  }

  const words = normaliseWords(rawWords);

  if (words.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_WORDS',
        message: 'All words were filtered during normalisation. Check audio quality.',
      },
    };
  }

  const validation = validatePipelineInput(words);
  if (!validation.valid) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Word timestamps failed pipeline validation.',
        details: validation.errors,
      },
    };
  }

  const language = response.language ?? 'unknown';
  const isRTL = detectRTL(response.text, language);
  const duration = words[words.length - 1].end;

  return {
    success: true,
    data: {
      text: response.text,
      words,
      wordCount: words.length,
      duration,
      language,
      isRTL,
    },
  };
}
