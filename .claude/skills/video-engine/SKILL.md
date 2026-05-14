# Video Engine — Editing Intelligence Rules

## Mission

Every clip processed by Ghost Creator must feel like it was cut by a professional editor
who studied Mr. Beast, Hormozi, and every viral barber on TikTok.
Zero wasted frames. Every word earns its screen time.

---

## Core Editing Rules

### Dead Air Purge
```
Threshold:  > 0.4 seconds of silence → CUT
Method:     Pipeline silence detector → remove segment
Exception:  Deliberate pauses < 0.4s after a punchline word (keep for comedic timing)
```

### 1.2× Digital Zoom on Keywords
```
Trigger:    Active caption word is a HIGH-IMPACT word
            (detected by: position 1-3 in sentence, ALL-CAPS in director notes, or stress marker)
Scale:      canvas scale from 1.0 → 1.2 over 4 frames
Ease:       spring(stiffness: 500, damping: 40) — SNAP only, never ease-in-out
Duration:   Hold at 1.2× for word duration, snap back on next word
```

### Barber Logic — Reveal Flash + Bass-Drop
```
Trigger:    Word marked as REVEAL (first word after silence gap, or hookScript[0])
Flash:      rgba(234,88,12, 0.35) full-canvas overlay — 2 frame duration
Zoom:       Simultaneous 1.0 → 1.15 scale punch on flash frame
Bass-Drop:  Director note cue: insert "BASS DROP FRAME" marker at flash timestamp
Reset:      Linear fade-out over next 6 frames
```

---

## Hormozi-Style Caption Rules

### Typography
```
Font:       Geist Black (weight 900) — NO exceptions
Size:       7% of canvas width (w * 0.07) — scales with output resolution
Case:       UPPERCASE active word only
Color:      Active word   → #EA580C (Vivid Orange) — LOCKED
            Inactive words → rgba(255,255,255,0.65)
Outline:    text-shadow: 0 0 20px rgba(0,0,0,0.9) — prevents wash-out on bright footage
```

### Caption Window
```
Position:   82% from top (h * 0.82) — bottom-third, above safe zone
Words shown: 5-word sliding window centered on active word
Alignment:  Center-aligned row, proportional spacing
RTL:        dir="rtl", font-family: Rubik Black — same orange rule applies
```

### Active Word Behavior
```
Scale:      1.0 → 1.08 (8% size increase)
Transition: snap spring (stiffness: 500, damping: 40)
Shadow:     shadowBlur 12 → 20 during active state
```

---

## Blubarber Edge — Batch Processing Preset

```
Profile name:    "Blubarber Edge"
Industry adapt:  Reads industry from BusinessProfile.industry
                 Barber   → fast cuts (avg 2.1s/cut), flash reveals
                 Gym      → energy cuts (avg 1.8s/cut), bass-drop on PR moments
                 HVAC     → diagnostic pacing (avg 3.5s/cut), no flash
                 Real Estate → luxury pacing (avg 4s/cut), dolly-style zoom
                 Other    → standard (avg 2.5s/cut)

Transition speed map:
  { Barber: 0.12, Gym: 0.08, HVAC: 0.22, 'Real Estate': 0.28, Other: 0.18 }
  (seconds between cut initiation and completion)

Applied effects in order:
  1. Dead air purge (0.4s threshold)
  2. Keyword zoom (1.2x)
  3. Reveal flash on first word of each sentence
  4. Hormozi captions overlaid at bottom-third
  5. Progress bar at base of frame
  6. Ghost Creator brand badge top-left
```

---

## Output Specs

```
Resolution:  1080 × 1920 (9:16 vertical)
FPS:         30
Codec:       H.264 (libx264), CRF 23
Audio:       AAC 128kbps, normalized to -14 LUFS
Container:   MP4
```

---

## Forbidden Editing Patterns

- Cross-dissolve transitions — HARD CUT only
- Slow-motion without explicit director note
- Zoom speed using CSS `ease` — spring physics ONLY
- Blue or purple caption colors on any frame
- Caption font-weight below 700
- Centered watermark overlaying face
