import type { EngineBus } from './events';
import type { TimestampWord, ViralHookOut } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Verified live against https://openrouter.ai/api/v1/models on 2026-05-10.
const DEFAULT_CHAIN = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'google/gemma-4-31b-it:free',
];

const SYSTEM = `You are a viral short-form video strategist for niche local businesses (barber, gym, real-estate).
Your job: read a verbatim transcript of a vertical short and pick THREE distinct viral hooks for the FIRST 3 SECONDS.
Return STRICT JSON only — no prose, no markdown, no code fences.

Output schema:
{
  "hooks": [
    {
      "type": "contrarian" | "educational" | "story",
      "label": "string (max 18 chars)",
      "hookLine": "string (max 140 chars, the first line viewer hears/reads)",
      "rationale": "string (1 short sentence on why this works for this clip)",
      "predictedScore": number (0-100),
      "retention": number (0-100, predicted % at 15s),
      "reach": "string like '120K – 290K'",
      "startSec": number (where in the video this hook starts, 0 if rewriting opening),
      "endSec": number (where it ends — usually <= 3.0)
    }
  ]
}

Rules:
- Exactly 3 hooks, one of EACH type (contrarian, educational, story).
- Hooks must be grounded in the transcript content — do not invent facts.
- hookLine should sound like spoken English; punchy, conversational, no emojis.
- Prefer pattern-interrupts and concrete numbers.
- Output MUST be a single valid JSON object that matches the schema above.`;

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string; code?: number | string };
}

export async function selectHooks(
  transcript: { text: string; words: TimestampWord[] },
  presetKey: string,
  bus: EngineBus,
): Promise<ViralHookOut[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY missing — Hook Selection cannot run');
  }

  const chain = parseChain(process.env.OPENROUTER_HOOK_MODELS) ?? DEFAULT_CHAIN;
  const userPrompt = buildUserPrompt(transcript, presetKey);
  bus.log('hooks', 'info', `chain=[${chain.join(' → ')}] promptChars=${userPrompt.length}`);

  const errors: string[] = [];

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    bus.log('hooks', 'info', `attempt ${i + 1}/${chain.length}: model=${model}`);
    try {
      const content = await callOpenRouter(model, userPrompt, apiKey, bus);
      bus.log('hooks', 'success', `model=${model} returned ${content.length} chars`);
      return parseHookJson(content);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${model}: ${msg.slice(0, 200)}`);
      bus.log('hooks', 'warn', `model=${model} failed → falling through`);
    }
  }

  const summary = errors.join(' || ');
  throw new Error(`Hook Selection failed on ALL ${chain.length} models. Errors: ${summary}`);
}

async function callOpenRouter(
  model: string,
  userPrompt: string,
  apiKey: string,
  bus: EngineBus,
): Promise<string> {
  bus.log('hooks', 'cmd', `POST ${OPENROUTER_URL} model=${model}`);
  const t0 = Date.now();
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ghost-creator.local',
      'X-Title': 'Ghost Creator Engine',
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 900,
      // NOTE: response_format json_object is NOT supported by every open-weight model
      // on OpenRouter. We rely on the SYSTEM prompt + tolerant parser instead.
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  bus.log('hooks', 'info', `← ${res.status} ${res.statusText} in ${Date.now() - t0}ms`);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    bus.log(
      'hooks',
      'error',
      `OpenRouter non-200 — status=${res.status} statusText=${res.statusText} model=${model}`,
    );
    bus.log('hooks', 'stderr', `RAW BODY: ${body || '(empty)'}`);
    throw new Error(`OpenRouter ${res.status} on ${model}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  if (data.error) {
    bus.log('hooks', 'error', `OpenRouter logical error on ${model}: ${JSON.stringify(data.error)}`);
    throw new Error(`OpenRouter logical error on ${model}: ${data.error.message ?? JSON.stringify(data.error)}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    bus.log('hooks', 'error', `empty content on ${model}; raw=${JSON.stringify(data).slice(0, 600)}`);
    throw new Error(`empty content from ${model}`);
  }
  return content;
}

function buildUserPrompt(transcript: { text: string; words: TimestampWord[] }, presetKey: string): string {
  const previewSec = 6;
  const opener = transcript.words
    .filter((w) => w.start <= previewSec)
    .map((w) => w.word)
    .join('')
    .trim();
  return [
    `NICHE PRESET: ${presetKey}`,
    `FIRST ${previewSec}s OF SPOKEN AUDIO: """${opener || '(no words detected in opening)'}"""`,
    '',
    'FULL TRANSCRIPT:',
    `"""${transcript.text.trim()}"""`,
    '',
    'Reply with the JSON object only. No prose, no fences.',
  ].join('\n');
}

function parseChain(raw: string | undefined): string[] | null {
  if (!raw) return null;
  const arr = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
}

function parseHookJson(raw: string): ViralHookOut[] {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Hook JSON parse failed: "${cleaned.slice(0, 200)}"`);
    parsed = JSON.parse(match[0]);
  }

  const arr = Array.isArray((parsed as { hooks?: unknown[] }).hooks)
    ? ((parsed as { hooks: unknown[] }).hooks as Array<Partial<ViralHookOut>>)
    : [];

  if (arr.length === 0) {
    throw new Error(`parsed JSON has no "hooks" array: ${cleaned.slice(0, 200)}`);
  }

  return arr.slice(0, 3).map((h, i) => ({
    type: (h.type ?? (['contrarian', 'educational', 'story'] as const)[i] ?? 'contrarian') as ViralHookOut['type'],
    label: String(h.label ?? `Hook ${i + 1}`).slice(0, 24),
    hookLine: String(h.hookLine ?? '').slice(0, 240),
    rationale: String(h.rationale ?? ''),
    predictedScore: clamp(Number(h.predictedScore ?? 70), 0, 100),
    retention: clamp(Number(h.retention ?? 60), 0, 100),
    reach: String(h.reach ?? '50K – 150K'),
    startSec: Math.max(0, Number(h.startSec ?? 0)),
    endSec: Math.max(0.5, Number(h.endSec ?? 3)),
  }));
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
