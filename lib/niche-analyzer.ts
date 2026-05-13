import OpenAI from 'openai';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export interface NicheAnalysis {
  niche: string;
  styleKey: string;
  confidence: number;
  viralScore: number;
  language: string;
  isRTL: boolean;
  reasoning: string;
}

const STYLE_KEYS = ['barber', 'gym', 'hvac', 'vibrant', 'minimal'] as const;

const SYSTEM_PROMPT = `You are a content niche classifier for short-form social media videos.

Given a transcript (which may be in any language including Hebrew, Arabic, Spanish, etc.),
identify the specific business niche and the best visual style for viral short-form content.

Available styleKey values and when to use them:
- "barber"  → barbershops, hair salons, grooming reveals, beauty, fades, lineups
- "gym"     → fitness, weightlifting, CrossFit, sports, nutrition, body transformation
- "hvac"    → HVAC, plumbing, electrical, roofing, construction, trades, home improvement
- "vibrant" → restaurants, food, cooking, entertainment, comedy, lifestyle, travel
- "minimal" → professional services, education, medical, legal, corporate, real estate

Viral score criteria (0-100):
- 80-100: Strong hook, emotional language, clear before/after, transformation content
- 60-79: Good pacing potential, relatable scenario, niche authority
- 40-59: Generic content, no strong hook, low emotional charge
- 0-39: Unclear message, poor structure, low niche signal

Respond with ONLY valid JSON. No markdown, no code fences.`;

const USER_PROMPT = (transcript: string, language: string) =>
  `Transcript (language: ${language}):\n\n"${transcript.slice(0, 2000)}"`;

export async function analyzeNiche(
  transcript: string,
  language: string,
  isRTL: boolean,
  apiKey: string
): Promise<NicheAnalysis> {
  if (!apiKey) return fallback(language, isRTL);

  // Try each model in OPENROUTER_HOOK_MODELS until one succeeds
  const modelsEnv = process.env.OPENROUTER_HOOK_MODELS ?? '';
  const models = modelsEnv
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  if (models.length === 0) models.push('meta-llama/llama-3.3-70b-instruct:free');

  const client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: { 'HTTP-Referer': 'https://ghost-creator.local', 'X-Title': 'Ghost Creator' },
  });

  let raw: string = '{}';

  for (const model of models) {
    try {
      const completion = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 256,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT(transcript, language) },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? '{}';
      break;
    } catch (err) {
      console.error(`[niche-analyzer] model ${model} failed:`, err);
    }
  }

  if (raw === '{}') return fallback(language, isRTL);

  try {
    const parsed = JSON.parse(raw) as Partial<NicheAnalysis>;
    const styleKey = STYLE_KEYS.includes(parsed.styleKey as typeof STYLE_KEYS[number])
      ? (parsed.styleKey as string)
      : 'minimal';

    return {
      niche: parsed.niche ?? 'unknown',
      styleKey,
      confidence: clamp(parsed.confidence ?? 50),
      viralScore: clamp(parsed.viralScore ?? 50),
      language,
      isRTL,
      reasoning: parsed.reasoning ?? '',
    };
  } catch {
    return fallback(language, isRTL);
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function fallback(language: string, isRTL: boolean): NicheAnalysis {
  return {
    niche: 'unknown',
    styleKey: 'minimal',
    confidence: 0,
    viralScore: 0,
    language,
    isRTL,
    reasoning: 'Niche detection unavailable — using default style.',
  };
}
