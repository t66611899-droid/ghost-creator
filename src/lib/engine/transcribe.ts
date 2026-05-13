import fs from 'node:fs';
import path from 'node:path';
import type { EngineBus } from './events';
import type { TimestampWord } from './types';

export interface TranscribeOut {
  text: string;
  language?: string;
  words: TimestampWord[];
  provider: 'deepgram' | 'whisper';
  raw: unknown;
}

export async function transcribeAudio(audioPath: string, bus: EngineBus): Promise<TranscribeOut> {
  const stat = fs.statSync(audioPath);
  bus.log('transcribe', 'info', `audio: ${path.basename(audioPath)} (${formatBytes(stat.size)})`);

  if (process.env.DEEPGRAM_API_KEY) {
    try {
      return await transcribeWithDeepgram(audioPath, bus);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      bus.log('transcribe', 'warn', `Deepgram failed (${msg.slice(0, 160)}) — falling back to Whisper`);
    }
  } else {
    bus.log('transcribe', 'warn', 'DEEPGRAM_API_KEY missing — using OpenAI Whisper');
  }
  return transcribeWithWhisper(audioPath, bus);
}

/* ─── Deepgram ───────────────────────────────────────────── */

interface DeepgramWord {
  word: string;
  punctuated_word?: string;
  start: number;
  end: number;
  confidence?: number;
}

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      detected_language?: string;
      alternatives?: Array<{
        transcript?: string;
        confidence?: number;
        words?: DeepgramWord[];
      }>;
    }>;
  };
  err_code?: string;
  err_msg?: string;
}

async function transcribeWithDeepgram(audioPath: string, bus: EngineBus): Promise<TranscribeOut> {
  const apiKey = process.env.DEEPGRAM_API_KEY!;
  const model = process.env.DEEPGRAM_MODEL || 'nova-2';

  const params = new URLSearchParams({
    model,
    smart_format: 'true',
    punctuate: 'true',
    detect_language: 'true',
    utterances: 'false',
    paragraphs: 'false',
  });
  const url = `https://api.deepgram.com/v1/listen?${params.toString()}`;

  const audio = await fs.promises.readFile(audioPath);
  bus.log('transcribe', 'info', `POST ${url} provider=deepgram model=${model}`);

  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'audio/wav',
    },
    body: new Uint8Array(audio),
  });
  bus.log('transcribe', 'info', `← ${res.status} ${res.statusText} in ${Date.now() - t0}ms`);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Deepgram error ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as DeepgramResponse;
  if (data.err_code) {
    throw new Error(`Deepgram error ${data.err_code}: ${data.err_msg ?? ''}`);
  }

  const channel = data.results?.channels?.[0];
  const alt = channel?.alternatives?.[0];
  if (!alt) throw new Error('Deepgram returned no alternatives');

  const words: TimestampWord[] = (alt.words ?? []).map((w) => ({
    word: w.punctuated_word ?? w.word,
    start: w.start,
    end: w.end,
    confidence: w.confidence,
  }));

  const language = channel?.detected_language;
  bus.log(
    'transcribe',
    'data',
    `deepgram → ${alt.transcript?.length ?? 0} chars · ${words.length} words · lang=${language ?? 'unknown'} · conf=${alt.confidence?.toFixed(3) ?? '?'}`,
  );

  return {
    text: alt.transcript ?? '',
    language,
    words,
    provider: 'deepgram',
    raw: data,
  };
}

/* ─── OpenAI Whisper (fallback) ──────────────────────────── */

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';
const WHISPER_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';

async function transcribeWithWhisper(audioPath: string, bus: EngineBus): Promise<TranscribeOut> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('No transcription provider configured (need DEEPGRAM_API_KEY or OPENAI_API_KEY)');

  const fileBuf = await fs.promises.readFile(audioPath);
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(fileBuf)], { type: 'audio/wav' }), path.basename(audioPath));
  form.append('model', WHISPER_MODEL);
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('timestamp_granularities[]', 'segment');

  bus.log('transcribe', 'info', `POST ${OPENAI_URL} provider=whisper model=${WHISPER_MODEL}`);
  const t0 = Date.now();
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  bus.log('transcribe', 'info', `← ${res.status} ${res.statusText} in ${Date.now() - t0}ms`);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Whisper error ${res.status}: ${text.slice(0, 400)}`);
  }

  const json = (await res.json()) as {
    text?: string;
    language?: string;
    words?: Array<{ word: string; start: number; end: number }>;
  };

  const words: TimestampWord[] = Array.isArray(json.words)
    ? json.words.map((w) => ({ word: w.word, start: w.start, end: w.end }))
    : [];

  bus.log(
    'transcribe',
    'data',
    `whisper → ${json.text?.length ?? 0} chars · ${words.length} words · lang=${json.language ?? 'unknown'}`,
  );

  return {
    text: json.text ?? '',
    language: json.language,
    words,
    provider: 'whisper',
    raw: json,
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
