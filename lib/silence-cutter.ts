/**
 * Silence-Cutter: Core logic for identifying and extracting speech segments
 * Analyzes word-level timestamps to detect gaps > threshold and creates trim segments
 */

export interface TimestampWord {
  word: string;
  start: number;
  end: number;
}

export interface SpeechSegment {
  start: number;
  end: number;
  duration: number;
}

export interface SilenceGap {
  start: number;
  end: number;
  duration: number;
}

/**
 * Analyzes timestamp array and identifies silence gaps
 * @param words Array of word timestamps from Whisper
 * @param silenceThreshold Gap duration in seconds to consider as silence
 * @returns Array of silence gaps found
 */
export function detectSilenceGaps(
  words: TimestampWord[],
  silenceThreshold: number = 0.5
): SilenceGap[] {
  if (!words || words.length < 2) {
    return [];
  }

  const gaps: SilenceGap[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const currentWord = words[i];
    const nextWord = words[i + 1];
    const gapStart = currentWord.end;
    const gapEnd = nextWord.start;
    const gapDuration = gapEnd - gapStart;

    if (gapDuration >= silenceThreshold) {
      gaps.push({
        start: gapStart,
        end: gapEnd,
        duration: gapDuration,
      });
    }
  }

  return gaps;
}

/**
 * Groups words into continuous speech segments by silence gaps
 * @param words Array of word timestamps
 * @param silenceThreshold Gap duration to consider as silence boundary
 * @returns Array of speech segments separated by silence
 */
export function extractSpeechSegments(
  words: TimestampWord[],
  silenceThreshold: number = 0.5
): SpeechSegment[] {
  if (!words || words.length === 0) {
    return [];
  }

  const segments: SpeechSegment[] = [];
  let currentSegment = {
    start: words[0].start,
    end: words[0].end,
  };

  for (let i = 1; i < words.length; i++) {
    const previousWord = words[i - 1];
    const currentWord = words[i];
    const gap = currentWord.start - previousWord.end;

    if (gap >= silenceThreshold) {
      // End current segment and start a new one
      segments.push({
        ...currentSegment,
        duration: currentSegment.end - currentSegment.start,
      });
      currentSegment = {
        start: currentWord.start,
        end: currentWord.end,
      };
    } else {
      // Extend current segment
      currentSegment.end = currentWord.end;
    }
  }

  // Add final segment
  segments.push({
    ...currentSegment,
    duration: currentSegment.end - currentSegment.start,
  });

  return segments;
}

/**
 * Calculates total time saved by removing silence
 * @param segments Speech segments
 * @param totalDuration Total video duration
 * @returns Object with metrics
 */
export function calculateTrimMetrics(
  segments: SpeechSegment[],
  totalDuration: number
) {
  const speechDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
  const silenceDuration = totalDuration - speechDuration;
  const compressionRatio = speechDuration / totalDuration;

  return {
    totalDuration,
    speechDuration,
    silenceDuration,
    compressionRatio: parseFloat((compressionRatio * 100).toFixed(2)),
    timeSaved: parseFloat(silenceDuration.toFixed(2)),
  };
}

/**
 * Generates FFmpeg concat protocol string for segment list
 * Used for concatenating trimmed speech segments back together
 * @param segments Array of speech segments to trim
 * @param inputFile Path to input video file
 * @returns Array of FFmpeg trim commands
 */
export function generateTrimCommands(
  segments: SpeechSegment[],
  inputFile: string
): string[] {
  return segments.map(
    (segment, index) =>
      `ffmpeg -ss ${segment.start.toFixed(3)} -to ${segment.end.toFixed(3)} -i "${inputFile}" -c copy "segment-${index}.mp4"`
  );
}

/**
 * Generates concat demuxer file content for combining segments
 * @param outputDir Directory where segments are stored
 * @param segmentCount Number of segments
 * @returns Concat protocol string
 */
export function generateConcatList(
  outputDir: string,
  segmentCount: number
): string {
  const lines = [];
  for (let i = 0; i < segmentCount; i++) {
    lines.push(`file '${outputDir}/segment-${i}.mp4'`);
  }
  return lines.join('\n');
}
