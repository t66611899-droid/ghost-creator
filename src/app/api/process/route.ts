import { NextRequest } from 'next/server';
import { transcribeWithDeepgram } from '../../../../lib/deepgram-transcriber';
import { analyzeNiche } from '../../../../lib/niche-analyzer';
import { orchestratePipeline } from '../../../../lib/pipeline-orchestrator';
import type {
  SSELogPayload,
  SSEWordsPayload,
  SSENichePayload,
  SSEPipelinePayload,
  SSEEventMap,
} from '@/types/api';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const encoder = new TextEncoder();

function sseChunk<E extends keyof SSEEventMap>(event: E, data: SSEEventMap[E]): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const send = <E extends keyof SSEEventMap>(event: E, data: SSEEventMap[E]) => {
        try { controller.enqueue(sseChunk(event, data)); } catch { /* stream closed */ }
      };

      const log = (level: SSELogPayload['level'], message: string, detail?: string) =>
        send('log', { level, message, detail });

      try {
        // ── Validate API keys ───────────────────────────────────────────────
        const deepgramKey = process.env.DEEPGRAM_API_KEY;
        const openrouterKey = process.env.OPENROUTER_API_KEY;

        if (!deepgramKey) {
          log('error', 'DEEPGRAM_API_KEY is not configured', 'Add it to your .env.local file');
          send('error', { message: 'DEEPGRAM_API_KEY missing' });
          return;
        }

        // ── Parse upload ────────────────────────────────────────────────────
        const formData = await request.formData();
        const file = formData.get('video') as File | null;

        if (!file) {
          log('error', 'No file received in request');
          send('error', { message: 'No file provided' });
          return;
        }

        if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
          log('error', 'Unsupported file type', file.type);
          send('error', { message: 'File must be video or audio' });
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          log('error', 'File exceeds 100 MB limit', `${(file.size / 1024 / 1024).toFixed(1)} MB received`);
          send('error', { message: 'File too large' });
          return;
        }

        log('info', `Received: ${file.name}`, `${(file.size / 1024 / 1024).toFixed(1)} MB · ${file.type}`);

        // ── Step 1: Transcribe (Deepgram nova-2) ───────────────────────────
        log('engine', 'Deepgram nova-2 transcribing…', 'language=multi · word timestamps');

        const buffer = Buffer.from(await file.arrayBuffer());

        const transcriptionResult = await transcribeWithDeepgram(
          buffer,
          file.type,
          file.name,
          deepgramKey
        );

        if (!transcriptionResult.success) {
          log('error', transcriptionResult.error);
          send('error', { message: transcriptionResult.error });
          return;
        }

        const { text, words, wordCount, duration, language, isRTL } = transcriptionResult.data;

        const wordsPayload: SSEWordsPayload = { words, wordCount, duration, language, isRTL };
        send('words', wordsPayload);
        log('success', `${wordCount} words extracted`, `${duration.toFixed(1)}s · lang: ${language}${isRTL ? ' · RTL' : ''}`);

        // ── Step 2: Niche analysis (OpenRouter) ────────────────────────────
        log('engine', 'Analyzing content niche via OpenRouter…');

        const niche = await analyzeNiche(text, language, isRTL, openrouterKey ?? '');

        const nichePayload: SSENichePayload = niche;
        send('niche', nichePayload);
        log(
          'success',
          `Niche: ${niche.niche} → style: ${niche.styleKey}`,
          niche.reasoning
        );
        log('info', `Viral score: ${niche.viralScore} · Confidence: ${niche.confidence}%`);

        // ── Step 3: Pipeline orchestration ──────────────────────────────────
        log('engine', 'Running pipeline orchestrator…');

        const pipelineOutput = orchestratePipeline(words, duration, {
          silenceThreshold: 0.5,
          style: niche.styleKey,
          wordsPerCue: 4,
          audioReduceFactor: 0.3,
          outputDir: 'output',
        });

        const { metrics, speechSegments, speedRamp } = pipelineOutput;
        const ramp = speedRamp?.diagnostics ?? null;

        const pipelinePayload: SSEPipelinePayload = {
          metrics,
          ramp,
          segmentCount: speechSegments.length,
          styleKey: niche.styleKey,
          srtContent: pipelineOutput.srtContent,
        };
        send('pipeline', pipelinePayload);

        log('success', `${speechSegments.length} speech segments · ${metrics.compressionRatio}% speech`, `${metrics.timeSaved.toFixed(1)}s silence removed`);

        if (ramp) {
          log('engine', `${ramp.totalZones} ramp zones · avg ${ramp.averageRamp.toFixed(2)}s anticipation`, `min ${ramp.shortestRamp.toFixed(2)}s / max ${ramp.longestRamp.toFixed(2)}s`);
        }

        log('success', 'Pipeline complete — preview ready');
        send('done', {});

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('error', `Unhandled error: ${message}`);
        send('error', { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
