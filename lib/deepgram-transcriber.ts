import type { ProcessedTranscription } from './transcription-processor';
import { validatePipelineInput } from './pipeline-orchestrator';

const RTL_REGEX = /[֐-׿؀-ۿ܀-ݏ]/;
const RTL_LANG_CODES = new Set(['he', 'iw', 'ar', 'fa', 'ur', 'yi']);

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

interface DeepgramResponse {
  metadata?: { detected_language?: string; duration?: number };
  results?: {
    channels?: Array<{
      detected_language?: string;
      alternatives?: Array<{
        transcript: string;
        words?: DeepgramWord[];
      }>;
    }>;
  };
}

export type DeepgramResult =
  | { success: true; data: ProcessedTranscription }
  | { success: false; error: string };

export async function transcribeWithDeepgram(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  apiKey: string
): Promise<DeepgramResult> {
  const url = new URL('https://api.deepgram.com/v1/listen');
  url.searchParams.set('model', 'nova-2');
  url.searchParams.set('language', 'multi');   // auto-detect; supports Hebrew
  url.searchParams.set('detect_language', 'true');
  url.searchParams.set('punctuate', 'true');
  url.searchParams.set('words', 'true');
  url.searchParams.set('smart_format', 'true');
  url.searchParams.set('utterances', 'false');

  async function callDeepgram(queryUrl: URL): Promise<DeepgramResponse | { error: string }> {
    try {
      const res = await fetch(queryUrl.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': mimeType,
        },
        body: new Uint8Array(buffer),
      });
      if (!res.ok) {
        const text = await res.text();
        return { error: `Deepgram ${res.status}: ${text.slice(0, 200)}` };
      }
      const raw = (await res.json()) as DeepgramResponse;
      console.log('[deepgram] raw detected_language:', raw.results?.channels?.[0]?.detected_language ?? raw.metadata?.detected_language);
      return raw;
    } catch (err) {
      return { error: `Network error: ${String(err)}` };
    }
  }

  // ── First attempt: auto-detect language ──────────────────────────────────────
  const attempt1 = await callDeepgram(url);
  if ('error' in attempt1) return { success: false, error: attempt1.error };

  let raw = attempt1;
  let channel = raw.results?.channels?.[0];
  let alt = channel?.alternatives?.[0];

  // ── Garble detection: retry with language=he if output looks wrong ───────────
  // Garbled: no Hebrew chars in transcript + fewer than 1.5 words/sec (synthetic TTS signal)
  const isGarbled =
    alt?.words?.length &&
    !RTL_REGEX.test(alt.transcript ?? '') &&
    alt.words.length / (raw.metadata?.duration ?? alt.words[alt.words.length - 1].end ?? 1) < 1.5;

  if (isGarbled) {
    console.log('[deepgram] garbled output detected — retrying with language=he');
    const heUrl = new URL(url.toString());
    heUrl.searchParams.delete('language');
    heUrl.searchParams.delete('detect_language');
    heUrl.searchParams.set('language', 'he');
    const attempt2 = await callDeepgram(heUrl);
    if (!('error' in attempt2)) {
      raw = attempt2;
      channel = raw.results?.channels?.[0];
      alt = channel?.alternatives?.[0];
    }
  }

  if (!alt?.words?.length) {
    return {
      success: false,
      error: 'Deepgram returned no word-level timestamps. Check audio contains speech.',
    };
  }

  // Use punctuated_word when available for display, fall back to plain word
  const words = alt.words
    .map((w) => ({
      word: (w.punctuated_word ?? w.word).trim(),
      start: w.start,
      end: w.end,
    }))
    .filter((w) => w.word.length > 0 && w.end > w.start);

  if (words.length === 0) {
    return { success: false, error: 'All words filtered — check audio quality.' };
  }

  const validation = validatePipelineInput(words);
  if (!validation.valid) {
    return { success: false, error: `Validation: ${validation.errors.join(', ')}` };
  }

  const language =
    channel?.detected_language ??
    raw.metadata?.detected_language ??
    'he'; // default to he after forced retry

  const isRTL =
    RTL_LANG_CODES.has(language.toLowerCase()) || RTL_REGEX.test(alt.transcript);

  const duration = raw.metadata?.duration ?? words[words.length - 1].end;

  return {
    success: true,
    data: {
      text: alt.transcript,
      words,
      wordCount: words.length,
      duration,
      language,
      isRTL,
    },
  };
}
