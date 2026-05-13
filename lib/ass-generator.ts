import type { TimestampWord } from './silence-cutter';

export interface ASSConfig {
  fontName: string;
  fontSize: number;
  primaryColor: string;   // hex '#RRGGBB' — active/default word color
  highlightColor: string; // hex '#RRGGBB' — currently spoken word
  isRTL: boolean;
  wordsPerCue: number;
  playResX: number;
  playResY: number;
}

export const DEFAULT_ASS_CONFIG: ASSConfig = {
  fontName: 'David',
  fontSize: 80,
  primaryColor: '#FFFFFF',
  highlightColor: '#EA580C',
  isRTL: false,
  wordsPerCue: 4,
  playResX: 1080,
  playResY: 1920,
};

// Seconds → ASS timestamp H:MM:SS.cs
function toASSTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.min(99, Math.round((sec - Math.floor(sec)) * 100));
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

// '#RRGGBB' → '&H00BBGGRR' (ASS stores ABGR little-endian)
function toASSColor(hex: string): string {
  const c = hex.replace('#', '').padStart(6, '0');
  return `&H00${c.slice(4, 6)}${c.slice(2, 4)}${c.slice(0, 2)}`.toUpperCase();
}

/**
 * Generates an ASS subtitle file with one-word-at-a-time Hormozi-style captions.
 * Each word is shown individually, centered, in the highlight color.
 * RTL text is handled automatically by libass + fribidi.
 */
export function generateASS(words: TimestampWord[], config: Partial<ASSConfig> = {}): string {
  const cfg: ASSConfig = { ...DEFAULT_ASS_CONFIG, ...config };
  const { fontName, fontSize, primaryColor, highlightColor, isRTL, wordsPerCue, playResX, playResY } = cfg;

  const primaryASS = toASSColor(primaryColor);
  const highlightASS = toASSColor(highlightColor);
  const marginV = Math.round(playResY * 0.10); // 10% from bottom edge

  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${playResX}`,
    `PlayResY: ${playResY}`,
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    // Alignment 2 = center-bottom; SecondaryColour = grey (for karaoke inactive state)
    `Style: Default,${fontName},${fontSize},${highlightASS},${primaryASS},&H00000000,&HAA000000,1,0,0,0,100,100,0,0,1,4,2,2,20,20,${marginV},0`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ].join('\n');

  const dialogues: string[] = [];

  // Strategy: show N-word cues; within each cue, one dialogue line per word
  // that covers the word's exact timing. This gives the single-word-at-a-time Hormozi look.
  for (let i = 0; i < words.length; i += wordsPerCue) {
    const group = words.slice(i, i + wordsPerCue);

    for (let j = 0; j < group.length; j++) {
      const w = group[j];
      // Each line shows the active word in highlight color (default style color)
      // plus greyed-out context words
      const parts = group.map((gw, k) => {
        if (k === j) {
          // active word — use default style color (highlightColor / orange)
          return gw.word;
        }
        // inactive word — override to primary (white) via inline tag
        return `{\\c${primaryASS}&}${gw.word}{\\c${highlightASS}&}`;
      });

      // For RTL, libass + fribidi handles visual reordering automatically
      // We must NOT reverse the logical order; BiDi does it for us.
      const text = isRTL
        ? `{\\an2}${parts.join(' ')}`  // an2 = center-bottom alignment
        : `{\\an2}${parts.join(' ')}`;

      dialogues.push(
        `Dialogue: 0,${toASSTime(w.start)},${toASSTime(w.end)},Default,,0,0,0,,${text}`
      );
    }
  }

  return `${header}\n${dialogues.join('\n')}\n`;
}
