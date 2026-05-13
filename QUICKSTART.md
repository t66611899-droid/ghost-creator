# Ghost Creator - Brain Quick Start Guide

## What is the Brain?

The Brain is a modular FFmpeg pipeline that transforms raw video into viral-ready content by:
1. **Removing silence** (Silence-Cutter)
2. **Adding animated captions** (Karaoke Generator)
3. **Applying niche styling** (Style Config)
4. **Balancing audio intelligently** (Audio Ducking)

---

## 5-Minute Setup

### 1. Install FFmpeg & FFprobe

**macOS:**
```bash
brew install ffmpeg ffprobe
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows (with Chocolatey):**
```bash
choco install ffmpeg
```

### 2. Verify Installation

```bash
ffmpeg -version
ffprobe -version
```

### 3. Set Environment Variables in `.env.local`

```
OPENAI_API_KEY=sk-proj-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Prepare Test Video

Create an `uploads/` directory and place a test video:
```bash
mkdir -p uploads
# Copy or download a test video
cp ~/Downloads/sample.mp4 uploads/input.mp4
```

---

## Running the Engine

### Basic Command

```bash
npm run engine -- uploads/input.mp4 output barber
```

**Arguments:**
- `uploads/input.mp4` - Input video file
- `output` - Output directory (created if doesn't exist)
- `barber` - Style preset (barber, gym, minimal, vibrant)

### What Gets Generated

```
output/
├── audio.wav           # Extracted audio
├── captions.srt        # Generated subtitles
└── [FFmpeg commands]   # Copy-paste ready
```

### Example Output

```
╔════════════════════════════════════════════════════════╗
║          Ghost Creator - Modular FFmpeg Pipeline       ║
║                    v2.0 (Brain)                        ║
╚════════════════════════════════════════════════════════╝

📹 STEP 1: Extracting audio from video...
✅ Audio extracted

🎤 STEP 2: Transcribing audio with OpenAI Whisper...
✅ Transcription complete

⏱️  STEP 3: Processing word-level timestamps...
✅ Extracted 127 words with timestamps

🔪 STEP 4: Running Silence-Cutter logic...
   Threshold: 0.5s

   📍 Silence detected: 3.75s → 4.80s (1.05s)
   📍 Silence detected: 6.70s → 7.40s (0.70s)

✅ Found 2 silence gap(s)

📊 STEP 5: Extracting speech segments...
   Total duration: 45.3s
   Speech duration: 42.8s
   Time saved: 2.5s (5.5% faster)
✅ Extracted 3 speech segment(s)

🎵 STEP 6: Generating karaoke-style cues...
✅ Generated 25 subtitle cue(s)

📝 STEP 7: Creating SRT subtitle file...
✅ Saved to output/captions.srt

🎨 STEP 8: Applying style: barber
   Bold, centered captions for barbershop

⚙️  STEP 9: Building FFmpeg pipeline...

═══════════════════════════════════════════════════════════
RECOMMENDED FFmpeg COMMAND FOR TRIMMED + CAPTIONED VIDEO:
═══════════════════════════════════════════════════════════

1️⃣  TRIM EACH SEGMENT:
   ffmpeg -ss 0.100 -to 3.750 -i "uploads/input.mp4" -c copy "segment-0.mp4"
   ffmpeg -ss 4.800 -to 6.700 -i "uploads/input.mp4" -c copy "segment-1.mp4"
   ffmpeg -ss 7.400 -to 45.300 -i "uploads/input.mp4" -c copy "segment-2.mp4"

2️⃣  CREATE CONCAT LIST (save as concat-list.txt):
file 'segment-0.mp4'
file 'segment-1.mp4'
file 'segment-2.mp4'

3️⃣  COMBINE + ADD CAPTIONS:
   ffmpeg -f concat -safe 0 -i concat-list.txt -vf "subtitles='output/captions.srt':force_style='FontName=Arial,FontSize=56,...'" -c:v libx264 -crf 22 -preset medium -c:a aac "output/final-output.mp4"

═══════════════════════════════════════════════════════════
METRICS SUMMARY:
═══════════════════════════════════════════════════════════
  Silence Gaps Removed: 2
  Speech Segments Created: 3
  Compression Ratio: 94.5%
  Time Saved: 2.50s
  Final Duration: 42.80s
  Style Applied: barber (Bold, centered captions for barbershop)

✨ Pipeline complete! Ready for FFmpeg rendering.
```

---

## Understanding the Output

### 1. Silence-Cutter Analysis

The engine identifies gaps in the Whisper transcript:

```
Original timeline:
[Speech] [GAP 1.05s] [Speech] [GAP 0.70s] [Speech]
  3.65s   REMOVED    1.90s    REMOVED   2.05s

Result: Continuous speech = 7.60s (removed 1.75s silence)
```

### 2. Speech Segments

Each segment is a continuous piece of speech:

```
Segment 1: 0.10s - 3.75s  (3.65s) "Hey everyone, today we're going to cut hair"
Segment 2: 4.80s - 6.70s  (1.90s) "First, prepare your tools"
Segment 3: 7.40s - 45.30s (37.90s) "Use sharp clippers and blend carefully..."
```

### 3. Compression Ratio

How much speaking vs silence:
- **94.5%** = 94.5% speech, 5.5% silence (removed)
- Higher % = more talking, less filler (more viral-friendly)

---

## Styling for Different Niches

### Barber Style (Default)

```bash
npm run engine -- video.mp4 output barber
```

**Settings:**
- **Font:** Bold Arial 56px
- **Color:** White text on black background
- **Alignment:** Center
- **Effect:** Bold, professional look
- **Best for:** Haircuts, styling tutorials

### Gym Style

```bash
npm run engine -- video.mp4 output gym
```

**Settings:**
- **Font:** Bold Arial 64px (LARGE)
- **Color:** Magenta on black
- **Alignment:** Center
- **Effect:** High-contrast, energetic
- **Best for:** Fitness tips, workout guides

### Minimal Style

```bash
npm run engine -- video.mp4 output minimal
```

**Settings:**
- **Font:** Regular Arial 48px
- **Color:** White on transparent
- **Alignment:** Center
- **Effect:** Clean, professional
- **Best for:** Tutorials, webinars, business

### Vibrant Style

```bash
npm run engine -- video.mp4 output vibrant
```

**Settings:**
- **Font:** Bold Arial 60px
- **Color:** Gold on purple
- **Alignment:** Center
- **Effect:** Colorful, energetic
- **Best for:** Entertainment, comedy

---

## Advanced: Custom Styles

Edit `lib/style-config.ts` to create your own:

```typescript
// Add to stylePresets object:
myStyle: {
  name: 'My Custom Style',
  description: 'Perfect for my brand',
  niche: 'custom',
  caption: {
    fontFamily: 'Arial',
    fontSize: 52,
    bold: true,
    color: '#FF5733',           // Your color
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
},
```

Then use it:
```bash
npm run engine -- video.mp4 output myStyle
```

---

## Complete Workflow Example

### Step 1: Generate Engine Output

```bash
npm run engine -- uploads/barber-cut.mp4 output barber
```

### Step 2: Execute FFmpeg Commands

Copy the recommended commands from engine output:

```bash
cd output

# Trim segments
ffmpeg -ss 0.100 -to 3.750 -i "../uploads/barber-cut.mp4" -c copy "segment-0.mp4"
ffmpeg -ss 4.800 -to 6.700 -i "../uploads/barber-cut.mp4" -c copy "segment-1.mp4"
ffmpeg -ss 7.400 -to 45.300 -i "../uploads/barber-cut.mp4" -c copy "segment-2.mp4"

# Create concat list
echo "file 'segment-0.mp4'" > concat-list.txt
echo "file 'segment-1.mp4'" >> concat-list.txt
echo "file 'segment-2.mp4'" >> concat-list.txt

# Combine with captions
ffmpeg -f concat -safe 0 -i concat-list.txt \
  -vf "subtitles='captions.srt':force_style='FontName=Arial,FontSize=56,PrimaryColour=&H00FFFFFF&,BackColour=&H80000000&,BorderStyle=3,Outline=2,Shadow=3,Alignment=2,Bold=-1'" \
  -c:v libx264 -crf 22 -preset medium \
  -c:a aac \
  final-output.mp4

cd ..
```

### Step 3: Share Your Viral Video

```bash
# Video is ready at: output/final-output.mp4
ls -lh output/final-output.mp4
```

---

## Troubleshooting

### ❌ "FFmpeg command failed"

**Solution:** Verify FFmpeg is installed
```bash
which ffmpeg
ffmpeg -version
```

### ❌ "Missing OPENAI_API_KEY"

**Solution:** Check `.env.local` file
```bash
cat .env.local
# Should show your keys, not placeholders
```

### ❌ "No words extracted from Whisper"

**Solution:** Ensure audio quality
- Check if input video has clear audio
- Try a different video
- Verify OpenAI API quota

### ❌ "concat-list.txt not found"

**Solution:** Create it manually
```bash
cd output
echo "file 'segment-0.mp4'" > concat-list.txt
echo "file 'segment-1.mp4'" >> concat-list.txt
# ... add all segments
```

---

## Performance Metrics

| Metric | Typical Value |
|--------|---------------|
| Audio extraction | 5-10 seconds |
| Whisper transcription | 10-30 seconds (depends on video length) |
| Silence detection | <1 second |
| SRT generation | <1 second |
| FFmpeg trim operations | Varies (real-time) |
| Final concatenation + captions | Varies (depends on quality settings) |

---

## Next Steps

1. ✅ Run engine with sample video
2. ✅ Customize style for your niche
3. ✅ Execute FFmpeg commands
4. ✅ Test output video
5. ✅ Integrate with API route
6. ✅ Build frontend UI
7. ✅ Deploy to production

---

## Resources

- **Silence-Cutter Deep Dive:** See [BRAIN.md](./BRAIN.md#core-system-1-silence-cutter)
- **All Available Styles:** See `lib/style-config.ts`
- **API Integration:** See `src/app/api/transcribe/route.ts`
- **Demo & Examples:** Run `npm run engine -- --help` (coming soon)

