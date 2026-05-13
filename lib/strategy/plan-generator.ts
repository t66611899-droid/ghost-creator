import OpenAI from 'openai';
import type { BusinessProfile, ContentMission, ContentLanguage, Industry, Tone } from '@/types/profile';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// ─── Analysis result ─────────────────────────────────────────────────────────

export interface AnalysisResult {
  businessName: string;
  industry: Industry;
  targetAudience: string;
  tone: Tone;
  language: ContentLanguage;
  confidence: number;
}

// Priority: env-specified strategy model → Gemini 2.5 Pro → llama fallback
function getStrategyModels(): string[] {
  const envModel = process.env.STRATEGY_MODEL;
  if (envModel) return [envModel];
  return [
    'google/gemini-2.5-pro-exp-03-25:free',
    'google/gemini-2.5-pro-preview-05-06',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-20b:free',
  ];
}

function scriptLangInstruction(lang: ContentLanguage): string {
  if (lang === 'he') return 'Write hookScript entirely in Hebrew (Unicode RTL script). No Latin characters.';
  if (lang === 'en') return 'Write hookScript entirely in English.';
  return 'Write hookScript in both Hebrew and English: start with the Hebrew lines, then an English translation on a new line. Use actual Hebrew Unicode characters.';
}

function buildSystemPrompt(): string {
  return `You are a world-class viral content strategist for local businesses on TikTok, Instagram Reels, and YouTube Shorts.
You generate 30-day content roadmaps: each day is a unique 30-60 second short-form video mission.

RULES:
- Every mission MUST be unique — no repeated hooks, angles, or formats across the 30 days
- Vary mission types: transformations, tutorials, behind-the-scenes, challenges, trending sounds, client testimonials, process reveals, myths busted, Q&A, day-in-the-life
- Scale virality across the month: days 1-10 = trust-building, 11-20 = authority, 21-30 = conversion-optimised
- directorNotes must be precise: shot type (close-up/medium/wide), camera movement (pan/zoom/static/dolly), framing, lighting mood, timing cues
- hookScript must be written in the specified language — Hebrew MUST use real Unicode characters (שלום not "shalom")
- hookScript should be punchy: maximum 4-6 short sentences, designed to stop the scroll in the first 2 seconds
- Return ONLY a valid JSON array. No markdown fences, no explanation, no trailing comma.`;
}

function buildUserPrompt(profile: BusinessProfile): string {
  const langInstruction = scriptLangInstruction(profile.language);

  return `Business profile:
- Name: "${profile.businessName}"
- Industry: ${profile.industry}
- Target audience: ${profile.targetAudience}
- Tone: ${profile.tone}
- Script language: ${profile.language}

Language instruction: ${langInstruction}

Generate exactly 30 content missions. Return a JSON array:
[
  {
    "day": 1,
    "missionTitle": "Short catchy mission name (max 60 chars)",
    "hookScript": "The exact on-camera script",
    "directorNotes": "Camera angles, movements, framing, lighting, timing cues"
  }
]`;
}

export async function generateRoadmap(
  profile: BusinessProfile,
  apiKey: string
): Promise<ContentMission[]> {
  const client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      'HTTP-Referer': 'https://ghost-creator.local',
      'X-Title': 'Ghost Creator Strategy Engine',
    },
  });

  const models = getStrategyModels();
  let rawJson = '';

  for (const model of models) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.85,
        max_tokens: 8192,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(profile) },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? '';
      if (content.trim().startsWith('[')) {
        rawJson = content.trim();
        break;
      }
      // Strip markdown fences if model ignored the instruction
      const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        rawJson = fenceMatch[1].trim();
        break;
      }
    } catch (err) {
      console.error(`[plan-generator] model ${model} failed:`, err);
    }
  }

  if (!rawJson) {
    console.error('[plan-generator] all models failed — returning fallback missions');
    return buildFallbackPlan(profile);
  }

  try {
    const parsed = JSON.parse(rawJson) as Partial<ContentMission>[];
    const missions: ContentMission[] = parsed.slice(0, 30).map((m, i) => ({
      day: typeof m.day === 'number' ? m.day : i + 1,
      missionTitle: m.missionTitle ?? `Mission ${i + 1}`,
      hookScript: m.hookScript ?? '',
      directorNotes: m.directorNotes ?? 'Medium shot, static camera, natural light.',
    }));

    // Pad to 30 if model returned fewer
    while (missions.length < 30) {
      const d = missions.length + 1;
      missions.push({
        day: d,
        missionTitle: `Day ${d} — Coming soon`,
        hookScript: '',
        directorNotes: '',
      });
    }

    return missions;
  } catch (err) {
    console.error('[plan-generator] JSON parse failed:', err);
    return buildFallbackPlan(profile);
  }
}

// ─── analyzeDescription ──────────────────────────────────────────────────────

export async function analyzeDescription(
  description: string,
  apiKey: string
): Promise<AnalysisResult> {
  const client = new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      'HTTP-Referer': 'https://ghost-creator.local',
      'X-Title': 'Ghost Creator Strategy Engine',
    },
  });

  const systemPrompt = `You are a business analyst for a viral short-form video platform.
Extract structured profile data from a free-text business description.

Return ONLY valid JSON (no markdown, no explanation):
{
  "businessName": "extracted or inferred business name (string)",
  "industry": one of exactly: "Barber" | "Gym" | "HVAC" | "Real Estate" | "Other",
  "targetAudience": "concise 1-sentence audience description",
  "tone": one of exactly: "Bold & Confident" | "Friendly & Warm" | "Educational & Expert" | "Hype & Energy" | "Luxury & Aspirational",
  "language": one of exactly: "he" | "en" | "he+en",
  "confidence": a number between 0 and 1 reflecting how complete the description was
}

For language: if description is in Hebrew → "he", if bilingual → "he+en", else → "en".
Pick the most fitting industry even if not explicit. Infer tone from writing style.`;

  const models = [
    'google/gemini-2.5-pro-exp-03-25:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-20b:free',
  ];

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 30_000);

  try {
    for (const model of models) {
      try {
        const completion = await client.chat.completions.create(
          {
            model,
            temperature: 0.3,
            max_tokens: 512,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Business description:\n${description}` },
            ],
          },
          { signal: abortController.signal }
        );

        const content = completion.choices[0]?.message?.content?.trim() ?? '';
        const jsonStr = content.startsWith('{')
          ? content
          : (content.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? '').trim();

        if (!jsonStr) continue;

        const parsed = JSON.parse(jsonStr) as Partial<AnalysisResult>;
        return {
          businessName: parsed.businessName ?? 'My Business',
          industry: parsed.industry ?? 'Other',
          targetAudience: parsed.targetAudience ?? 'General audience',
          tone: parsed.tone ?? 'Bold & Confident',
          language: parsed.language ?? 'en',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
        };
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') throw err;
        console.error(`[analyzeDescription] model ${model} failed:`, err);
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return {
    businessName: 'My Business',
    industry: 'Other',
    targetAudience: 'General audience',
    tone: 'Bold & Confident',
    language: 'en',
    confidence: 0.1,
  };
}

// ─── Fallback for when the AI is unreachable ─────────────────────────────────

function buildFallbackPlan(profile: BusinessProfile): ContentMission[] {
  const isHebrew = profile.language === 'he' || profile.language === 'he+en';
  const hooks: [string, string, string][] = [
    ['The Hook Reveal', isHebrew ? 'זה מה שאנשים לא יודעים על ${profile.businessName}...' : `This is what people don't know about ${profile.businessName}…`, 'Start extreme close-up on product/work, slow zoom out to reveal full scene.'],
    ['Day in the Life', isHebrew ? 'הנה יום שלם ב${profile.businessName} — תוך 60 שניות' : `A full day at ${profile.businessName} — in 60 seconds.`, 'Time-lapse montage: 3 scenes × 4 seconds each. Quick cuts on beat.'],
    ['The Transformation', isHebrew ? 'לפני ואחרי — תראה את ההבדל' : 'Before vs After — watch the difference.', 'Split-screen: left=before (desaturated), right=after (vivid). Hard cut on beat drop.'],
    ['Client Reaction', isHebrew ? 'תראה מה הלקוח אמר אחרי שסיימנו...' : 'Watch what the client said after we finished…', 'Over-shoulder filming of client reaction. Zoom to face on emotional moment.'],
    ['Process Reveal', isHebrew ? 'אף אחד לא מראה את זה. אני מראה.' : "Nobody shows this. I will.", 'Overhead flat-lay showing tools/process. Stop-motion style with 0.5s cuts.'],
  ];

  return Array.from({ length: 30 }, (_, i) => {
    const [title, script, notes] = hooks[i % hooks.length];
    return {
      day: i + 1,
      missionTitle: `Day ${i + 1} — ${title}`,
      hookScript: script,
      directorNotes: notes,
    };
  });
}
