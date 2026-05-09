# Ghost Creator - Brain Architecture (v2.0)

## Overview

The **Brain** is a modular FFmpeg pipeline that transforms raw video into viral-ready content. It consists of four interconnected systems:

1. **Silence-Cutter** - Identifies and removes silence gaps
2. **Karaoke Generator** - Creates word-by-word animated captions
3. **Style Config** - Applies niche-specific branding and effects
4. **Audio Ducking** - Intelligently adjusts background music volume

---

## Core System 1: Silence-Cutter

### How It Works

The silence-cutter analyzes word-level timestamps from OpenAI Whisper to identify and remove silence gaps, creating fast-paced "viral" rhythm.

### Timestamp Array Processing

```typescript
interface TimestampWord {
  word: string;      // The word text
  start: number;     // Start time in seconds (e.g., 0.5)
  end: number;       // End time in seconds (e.g., 0.75)
}
```

### Algorithm: Gap Detection

```
For each word pair:
  1. Get gap duration = nextWord.start - currentWord.end
  2. If gap >= silenceThreshold (default 0.5s):
     → Record as silence gap
     → Mark segment boundary
  3. Otherwise:
     → Continue current speech segment
```

**Example:**
```
Word: "Hello"   [0.1 - 0.5]
       GAP:     [0.5 - 1.2]  ← 0.7s gap (REMOVE)
Word: "world"   [1.2 - 1.6]

Result: Segments [0.1-0.5] and [1.2-1.6] are kept, 0.7s of silence removed
```

### Output Metrics

```
Input:  10.5 seconds total video
Output: 8.3 seconds (trimmed)
Saved:  2.2 seconds (21% faster paced)
```

### Usage

```typescript
import {
  detectSilenceGaps,
  extractSpeechSegments,
  calculateTrimMetrics,
  type TimestampWord,
} from '@/lib/silence-cutter';

const words: TimestampWord[] = [
  { word: 'Hey', start: 0.1, end: 0.45 },
  { word: 'everyone', start: 0.5, end: 1.2 },
  // ...
];

// Detect gaps >= 0.5 seconds
const gaps = detectSilenceGaps(words, 0.5);
// → [{ start: 0.5, end: 1.2, duration: 0.7 }, ...]

// Extract continuous speech segments
const segments = extractSpeechSegments(words, 0.5);
// → [{ start: 0.1, end: 0.45, duration: 0.35 }, ...]

// Calculate compression metrics
const metrics = calculateTrimMetrics(segments, 10.5);
// → { timeSaved: 2.2, compressionRatio: 79%, ... }
```

---

## Core System 2: Karaoke Generator

### What It Does

Converts word-level timestamps into subtitle cues with **word-by-word timing** for animated highlighting.

### Cue Structure

```typescript
interface KaraokeCue {
  index: number;           // Cue number (1, 2, 3...)
  start: number;           // Cue start time
  end: number;             // Cue end time
  words: KaraokeWord[];    // Individual word timings
  fullText: string;        // Complete cue text
}
```

### Generated SRT Format

```
1
00:00:00,100 --> 00:00:00,500
Hey everyone, today we're

2
00:00:00,600 --> 00:00:01,200
going to cut hair today

3
00:00:01,300 --> 00:00:02,100
First, prepare your tools
```

### Usage

```typescript
import {
  generateKaraokeCues,
  generateSrtWithKaraoke,
} from '@/lib/karaoke-generator';

const cues = generateKaraokeCues(words, 5); // 5 words per cue
const srtContent = generateSrtWithKaraoke(cues);
```

### For Frontend Animation

Export karaoke data as JSON for web-based word highlighting:

```typescript
import { generateKaraokeJson } from '@/lib/karaoke-generator';

const jsonData = generateKaraokeJson(cues);
// Use in React to highlight words as they're spoken
```

---

## Core System 3: Style Configuration

### Available Presets

| Style | Niche | Font Size | Color | Use Case |
|-------|-------|-----------|-------|----------|
| `barber` | Barbershop | 56px | White/Black | Clean, professional haircuts |
| `gym` | Fitness | 64px | Magenta/Black | High-energy workouts |
| `minimal` | Professional | 48px | White/Black | Tutorials, webinars |
| `vibrant` | Entertainment | 60px | Gold/Purple | Comedy, entertainment |

### Style Structure

```typescript
interface StyleConfig {
  caption: {
    fontFamily: string;
    fontSize: number;
    bold: boolean;
    color: string;
    backgroundColor: string;
    opacity: number;
    borderStyle: number;
    shadowDepth: number;
    alignment: 'left' | 'center' | 'right';
  };
  video: {
    aspectRatio: '9:16' | '16:9' | '1:1';
    maxBrightness: number;
    vibrance: number;
    saturation: number;
  };
  animation: {
    wordHighlightColor: string;
    wordHighlightDuration: number;
    captionFadeInDuration: number;
    captionFadeOutDuration: number;
  };
  audio: {
    duckingAmount: number;
    duckingThreshold: number;
  };
}
```

### Usage

```typescript
import { getStyleConfig } from '@/lib/style-config';

const barbershopStyle = getStyleConfig('barber');
const gymStyle = getStyleConfig('gym');
```

---

## Core System 4: Audio Ducking

### Purpose

Reduces background music volume when speech is detected, creating clarity and focus.

### How It Works

```
Speech Segment 1: [0.5 - 3.2]  → Music volume: 100% → 30% → 100%
Silence Gap:      [3.2 - 4.0]  → Music volume: 100%
Speech Segment 2: [4.0 - 7.1]  → Music volume: 100% → 30% → 100%
```

### Filter Types

1. **Volume Envelope**: Smooth volume changes during speech
2. **Gate Filter**: Cuts volume below speech threshold
3. **Compressor**: Dynamic range reduction

### Usage

```typescript
import {
  generateVolumeEnvelopeFilter,
  generateCompleteAudioFilterChain,
} from '@/lib/audio-ducking';

// Simple volume envelope (30% reduction during silence)
const filter = generateVolumeEnvelopeFilter(segments, 10.5, 0.3);

// Complete chain with normalization + ducking + compression
const completeFilter = generateCompleteAudioFilterChain(segments, 0.3);
```

---

## Pipeline Orchestrator

The `pipeline-orchestrator.ts` coordinates all four systems:

```typescript
import { orchestratePipeline } from '@/lib/pipeline-orchestrator';

const output = orchestratePipeline(
  words,               // Whisper word array
  totalDuration,       // Total video length
  {
    silenceThreshold: 0.5,
    style: 'barber',
    wordsPerCue: 5,
    audioReduceFactor: 0.3,
    outputDir: 'output',
  }
);

// output contains:
// - speechSegments[]
// - silenceGaps[]
// - metrics
// - srtContent
// - styleConfig
// - ffmpegFilters { video, audio }
```

---

## Running the Engine

### 1. Basic Usage

```bash
npm run engine -- uploads/video.mp4 output barber
```

**Output:**
- `output/audio.wav` - Extracted audio
- `output/captions.srt` - Generated subtitles
- FFmpeg commands for trimming and concatenation

### 2. With Environment Variables

Ensure `.env.local` has:
```
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Complete Workflow

```bash
# Step 1: Run engine to generate segments and captions
npm run engine -- mybarber.mp4 output barber

# Step 2: Trim and concatenate (copy commands from engine output)
ffmpeg -ss 0.100 -to 5.200 -i mybarber.mp4 -c copy segment-0.mp4
ffmpeg -ss 5.800 -to 12.100 -i mybarber.mp4 -c copy segment-1.mp4
# ... (more segments)

# Step 3: Create concat-list.txt
echo "file 'segment-0.mp4'" > concat-list.txt
echo "file 'segment-1.mp4'" >> concat-list.txt

# Step 4: Final render with captions
ffmpeg -f concat -safe 0 -i concat-list.txt \
  -vf "subtitles='output/captions.srt':force_style='FontName=Arial,FontSize=56,...'" \
  -c:v libx264 -crf 22 -preset medium \
  -c:a aac \
  output/final-output.mp4
```

---

## Advanced: Custom Styles

Create a custom style by extending `style-config.ts`:

```typescript
const customStyle: StyleConfig = {
  name: 'MyBrand',
  description: 'Custom branded style',
  niche: 'custom',
  caption: {
    fontFamily: 'Helvetica',
    fontSize: 52,
    bold: true,
    color: '#FF5733',
    backgroundColor: '#1A1A1A',
    opacity: 0.9,
    borderStyle: 3,
    borderWidth: 2,
    shadowDepth: 4,
    alignment: 'center',
  },
  video: {
    aspectRatio: '9:16',
    backgroundColor: '#000000',
    maxBrightness: 1.2,
    vibrance: 1.3,
    saturation: 1.15,
  },
  animation: {
    wordHighlightColor: '#00FF00',
    wordHighlightDuration: 150,
    captionFadeInDuration: 200,
    captionFadeOutDuration: 150,
  },
  audio: {
    duckingAmount: 0.5,
    duckingThreshold: -22,
  },
};
```

---

## Demo: Silence-Cutter Logic

Run the included demo to see how the silence-cutter handles timestamp arrays:

```bash
# Create a demo file to test silence-cutter logic
node -e "
import('./lib/silence-cutter-demo.ts').then(m => m.demonstrateSilenceCutter());
"
```

**Example Output:**
```
STEP 1: Detect Silence Gaps
─────────────────────────────
Found 2 silence gap(s) >= 0.5s:

  Gap 1:
    Start: 3.75s
    End:   4.80s
    Duration: 1.05s

  Gap 2:
    Start: 6.70s
    End:   7.40s
    Duration: 0.70s

STEP 2: Extract Speech Segments
─────────────────────────────────
Extracted 3 continuous speech segment(s):

  Segment 1:
    Time Range: 0.10s - 3.75s
    Duration: 3.65s
    Words: "Hey everyone, today we're going to cut hair."

  Segment 2:
    Time Range: 4.80s - 6.70s
    Duration: 1.90s
    Words: "First, prepare your tools."

  Segment 3:
    Time Range: 7.40s - 9.45s
    Duration: 2.05s
    Words: "Use sharp clippers. Ready?"

STEP 3: Compression Metrics
─────────────────────────────
Total Duration: 9.45s
Speech Duration: 7.60s
Silence Duration: 1.85s
Compression Ratio: 80.4%
Time Saved: 1.85s
```

---

## Architecture Diagram

```
Raw Video Input
      ↓
┌─────────────────────────────────────┐
│ 1. Audio Extraction (FFmpeg)        │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ 2. Whisper Transcription (OpenAI)   │
│    Output: Word-level timestamps    │
└─────────────────────────────────────┘
      ↓ words[] { word, start, end }
┌─────────────────────────────────────┐
│ 3. SILENCE-CUTTER                   │ ← Analyzes gaps in timestamps
│    Output: Speech segments[]         │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ 4. KARAOKE GENERATOR                │ ← Builds SRT cues
│    Output: captions.srt             │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ 5. STYLE CONFIG                     │ ← Applies niche branding
│    Output: FFmpeg filter strings    │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ 6. AUDIO DUCKING                    │ ← Intelligently mixes audio
│    Output: Audio filter chain       │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ 7. FFmpeg Pipeline Execution        │
│    - Trim segments                  │
│    - Concatenate                    │
│    - Overlay captions + effects     │
│    - Mix audio with ducking         │
└─────────────────────────────────────┘
      ↓
   Final Viral-Ready Video
```

---

## Key Features

✅ **Fast-paced editing** - Removes all silence automatically
✅ **Karaoke captions** - Word-by-word animated text
✅ **Niche styling** - Pre-built styles for barbershop, gym, etc.
✅ **Audio ducking** - Intelligent music volume control
✅ **Production-grade** - Typescript, modular, testable
✅ **FFmpeg optimized** - Clean, standard commands

---

## Files Structure

```
lib/
├── silence-cutter.ts              # Gap detection & segment extraction
├── karaoke-generator.ts           # Word-by-word caption generation
├── style-config.ts                # Niche branding presets
├── audio-ducking.ts               # Background music ducking
├── pipeline-orchestrator.ts       # Coordinates all systems
└── silence-cutter-demo.ts         # Demo & test cases

scripts/
└── engine.mjs                      # Main CLI orchestrator
```

---

## Next Steps

1. **Test with real video** → `npm run engine -- test-video.mp4`
2. **Create custom style** → Add to `style-config.ts`
3. **Integrate to API** → Wire engine to `/api/transcribe` route
4. **Build frontend UI** → Show karaoke animations in React

