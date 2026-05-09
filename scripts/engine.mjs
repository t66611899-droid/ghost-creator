import { execFileSync } from 'child_process';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, extname, join, resolve } from 'path';
import OpenAI from 'openai';

const INPUT_VIDEO = process.argv[2] ?? 'uploads/input.mp4';
const OUTPUT_DIR = process.argv[3] ?? 'output';
const AUDIO_FILE = join(OUTPUT_DIR, 'audio.wav');
const SRT_FILE = join(OUTPUT_DIR, 'captions.srt');
const SEGMENT_LIST_FILE = join(OUTPUT_DIR, 'trim-list.txt');
const FINAL_VIDEO_FILE = join(OUTPUT_DIR, 'final-video.mp4');
const SILENCE_THRESHOLD_SECONDS = 0.8;

if (!existsSync(INPUT_VIDEO)) {
  console.error(`Error: input video not found at ${INPUT_VIDEO}`);
  process.exit(1);
}

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

function safeExecuteFfmpeg(args) {
  try {
    execFileSync('ffmpeg', args, { stdio: 'inherit' });
  } catch (error) {
    throw new Error(`FFmpeg command failed: ffmpeg ${args.join(' ')}`);
  }
}

function formatTimestamp(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

function buildCues(words) {
  const cues = [];
  let currentWords = [];
  let currentStart = 0;
  let currentEnd = 0;

  for (const word of words) {
    if (!currentWords.length) {
      currentStart = word.start;
      currentEnd = word.end;
      currentWords.push(word);
      continue;
    }

    const duration = word.end - currentStart;
    const gap = word.start - currentEnd;
    const shouldSplit =
      currentWords.length >= 6 ||
      duration >= 4.0 ||
      gap >= 1.0;

    if (shouldSplit) {
      cues.push({ start: currentStart, end: currentEnd, text: currentWords.map((item) => item.word).join(' ') });
      currentWords = [word];
      currentStart = word.start;
      currentEnd = word.end;
      continue;
    }

    currentWords.push(word);
    currentEnd = word.end;
  }

  if (currentWords.length) {
    cues.push({ start: currentStart, end: currentEnd, text: currentWords.map((item) => item.word).join(' ') });
  }

  return cues;
}

function parseSegmentWords(transcript) {
  const segments = transcript.segments ?? [];
  const words = [];

  for (const segment of segments) {
    if (Array.isArray(segment.words) && segment.words.length) {
      for (const wordData of segment.words) {
        if (typeof wordData.start !== 'number' || typeof wordData.end !== 'number' || !wordData.word) {
          continue;
        }

        words.push({ word: wordData.word.trim(), start: wordData.start, end: wordData.end });
      }
      continue;
    }

    const text = (segment.text ?? '').trim();
    if (text) {
      words.push({ word: text, start: segment.start ?? 0, end: segment.end ?? segment.start ?? 0 });
    }
  }

  return words;
}

function buildSpeechSegments(words) {
  if (!words.length) {
    return [];
  }

  const segments = [];
  let current = { start: words[0].start, end: words[0].end };

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index];
    const gap = word.start - current.end;

    if (gap >= SILENCE_THRESHOLD_SECONDS) {
      segments.push({ ...current });
      current = { start: word.start, end: word.end };
      continue;
    }

    current.end = word.end;
  }

  segments.push(current);
  return segments;
}

function buildSrtContent(cues) {
  return cues
    .map((cue, index) => `${index + 1}
${formatTimestamp(cue.start)} --> ${formatTimestamp(cue.end)}
${cue.text}
`)
    .join('\n');
}

function buildSubtitlesFilter(srtPath) {
  const escaped = srtPath.replace(/'/g, "'\\''");
  return `subtitles='${escaped}':force_style='FontName=Inter,FontSize=44,PrimaryColour=&H00FFFFFF&,BackColour=&H80000000&,BorderStyle=3,Outline=1,Shadow=2,Alignment=2'`;
}

function buildFinalCommand(videoPath, srtPath, segmentListPath, outputFile, segments) {
  if (segments.length <= 1) {
    return `ffmpeg -y -i "${videoPath}" -vf "${buildSubtitlesFilter(srtPath)}" -af "silenceremove=start_periods=1:start_silence=0.6:start_threshold=-50dB:stop_periods=1:stop_silence=0.6:stop_threshold=-50dB" -c:v libx264 -crf 22 -preset medium -c:a aac "${outputFile}"`;
  }

  return [
    '# Trim speech segments and save them as individual video pieces',
    ...segments.map((segment, index) => `ffmpeg -y -i "${videoPath}" -ss ${segment.start.toFixed(3)} -to ${segment.end.toFixed(3)} -c copy "${join(OUTPUT_DIR, `segment-${index}.mp4`)}"`),
    `\n# Create a concat list file: ${segmentListPath}`,
    `# file '${join(OUTPUT_DIR, 'segment-0.mp4')}'`,
    `# file '${join(OUTPUT_DIR, 'segment-1.mp4')}'`,
    '# ...',
    `ffmpeg -f concat -safe 0 -i "${segmentListPath}" -vf "${buildSubtitlesFilter(srtPath)}" -c:v libx264 -crf 22 -preset medium -c:a aac "${outputFile}"`
  ].join('\n');
}

async function transcribeAudio(audioPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY in environment variables.');
  }

  const openai = new OpenAI({ apiKey });
  const fileStream = createReadStream(audioPath);

  const transcription = await openai.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-1',
    response_format: 'verbose_json',
    temperature: 0.2,
    // Some Whisper variants accept word_timestamps; if supported, use it.
    word_timestamps: true,
  });

  return transcription;
}

(async () => {
  try {
    console.log('Extracting audio from video...');
    safeExecuteFfmpeg([
      '-y',
      '-i', INPUT_VIDEO,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      AUDIO_FILE,
    ]);

    console.log('Transcribing audio with OpenAI Whisper...');
    const transcription = await transcribeAudio(AUDIO_FILE);

    const words = parseSegmentWords(transcription);
    if (!words.length) {
      throw new Error('No transcript words could be extracted from Whisper output.');
    }

    const speechSegments = buildSpeechSegments(words);
    const cues = buildCues(words);
    const srtContent = buildSrtContent(cues);

    writeFileSync(SRT_FILE, srtContent, 'utf8');
    writeFileSync(SEGMENT_LIST_FILE, speechSegments.map((segment, index) => `file '${join(OUTPUT_DIR, `segment-${index}.mp4`)}'`).join('\n'), 'utf8');

    console.log(`Saved subtitles to ${SRT_FILE}`);
    console.log(`Detected ${speechSegments.length} speech segments.`);
    console.log(`Saved segment list to ${SEGMENT_LIST_FILE}`);

    const finalCommand = buildFinalCommand(INPUT_VIDEO, SRT_FILE, SEGMENT_LIST_FILE, FINAL_VIDEO_FILE, speechSegments);
    console.log('\n=== Final FFmpeg Command ===\n');
    console.log(finalCommand);
    console.log('\nRun the command above to produce your final trimmed video with animated captions.');
  } catch (error) {
    console.error('Engine failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
})();