/**
 * Karaoke-Style Subtitle Generator
 * Creates word-by-word highlighted captions with timing
 */

export interface KaraokeWord {
  word: string;
  start: number;
  end: number;
  position: number; // 0-100, percentage in line
}

export interface KaraokeCue {
  index: number;
  start: number;
  end: number;
  words: KaraokeWord[];
  fullText: string;
}

/**
 * Converts word timestamps to karaoke-style cues
 * Each cue contains individual word timing for highlighting
 * @param words Array of timestamped words
 * @param wordsPerCue Maximum words to group per cue
 * @returns Array of karaoke cues
 */
export function generateKaraokeCues(
  words: Array<{ word: string; start: number; end: number }>,
  wordsPerCue: number = 5
): KaraokeCue[] {
  const cues: KaraokeCue[] = [];
  let cueIndex = 0;

  for (let i = 0; i < words.length; i += wordsPerCue) {
    const cueWords = words.slice(i, i + wordsPerCue);
    const cueStart = cueWords[0].start;
    const cueEnd = cueWords[cueWords.length - 1].end;
    const fullText = cueWords.map((w) => w.word).join(' ');

    const karaokeWords: KaraokeWord[] = cueWords.map((word, idx) => ({
      word: word.word,
      start: word.start,
      end: word.end,
      position: (idx / cueWords.length) * 100,
    }));

    cues.push({
      index: cueIndex++,
      start: cueStart,
      end: cueEnd,
      words: karaokeWords,
      fullText,
    });
  }

  return cues;
}

/**
 * Generates SRT subtitle format with word-level timing
 * @param cues Karaoke cues
 * @returns SRT-formatted string
 */
export function generateSrtWithKaraoke(cues: KaraokeCue[]): string {
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  };

  return cues
    .map(
      (cue) =>
        `${cue.index + 1}
${formatTime(cue.start)} --> ${formatTime(cue.end)}
${cue.fullText}
`
    )
    .join('\n');
}

/**
 * Generates FFmpeg filter_complex for karaoke-style highlighting
 * Creates a subtitle overlay with word-by-word color changes
 * @param subtitleFile Path to SRT file
 * @param style Style preset name
 * @returns FFmpeg filter string
 */
export function generateKaraokeFilterComplex(
  subtitleFile: string,
  style: string = 'barber'
): string {
  const styleConfigs: Record<string, string> = {
    barber:
      'FontName=Arial,FontSize=56,PrimaryColour=&H00FFFFFF&,BackColour=&H80000000&,BorderStyle=3,Outline=2,Shadow=3,Alignment=2,Bold=1',
    gym: 'FontName=Arial,FontSize=64,PrimaryColour=&HFF00FF&,BackColour=&H80000000&,BorderStyle=3,Outline=3,Shadow=4,Alignment=2,Bold=1',
    minimal:
      'FontName=Arial,FontSize=48,PrimaryColour=&H00FFFFFF&,BackColour=&H00000000&,BorderStyle=1,Outline=1,Shadow=1,Alignment=2',
  };

  const config = styleConfigs[style] || styleConfigs.barber;
  const escaped = subtitleFile.replace(/'/g, "'\\''");

  return `subtitles='${escaped}':force_style='${config}'`;
}

/**
 * Generates JSON data for karaoke highlighting (for frontend rendering)
 * @param cues Karaoke cues
 * @returns JSON object with cue and word timing data
 */
export function generateKaraokeJson(
  cues: KaraokeCue[]
): {
  cues: Array<{
    index: number;
    start: number;
    end: number;
    words: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
} {
  return {
    cues: cues.map((cue) => ({
      index: cue.index,
      start: cue.start,
      end: cue.end,
      words: cue.words.map((w) => ({
        word: w.word,
        start: w.start,
        end: w.end,
      })),
    })),
  };
}
