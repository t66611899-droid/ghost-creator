/**
 * Silence-Cutter Demo & Core Logic Showcase
 * Shows how the silence-cutter processes Whisper timestamp arrays
 */

import {
  detectSilenceGaps,
  extractSpeechSegments,
  calculateTrimMetrics,
  generateTrimCommands,
  generateConcatList,
  type TimestampWord,
} from './silence-cutter';

/**
 * Example: Real-world demonstration of silence-cutter with detailed logging
 */
export function demonstrateSilenceCutter() {
  const sampleWords: TimestampWord[] = [
    { word: 'Hey', start: 0.1, end: 0.45 },
    { word: 'everyone,', start: 0.5, end: 1.2 },
    { word: 'today', start: 1.25, end: 1.65 },
    { word: "we're", start: 1.7, end: 2.1 },
    { word: 'going', start: 2.15, end: 2.55 },
    { word: 'to', start: 2.6, end: 2.85 },
    { word: 'cut', start: 2.9, end: 3.2 },
    { word: 'hair.', start: 3.25, end: 3.75 },
    // SILENCE: 3.75 to 4.8 (1.05 seconds - REMOVE)
    { word: 'First,', start: 4.8, end: 5.2 },
    { word: 'prepare', start: 5.25, end: 5.8 },
    { word: 'your', start: 5.85, end: 6.15 },
    { word: 'tools.', start: 6.2, end: 6.7 },
    // SILENCE: 6.7 to 7.4 (0.7 seconds - REMOVE)
    { word: 'Use', start: 7.4, end: 7.7 },
    { word: 'sharp', start: 7.75, end: 8.15 },
    { word: 'clippers.', start: 8.2, end: 8.8 },
    // SILENCE: 8.8 to 8.95 (0.15 seconds - KEEP)
    { word: 'Ready?', start: 8.95, end: 9.45 },
  ];

  console.log('=== SILENCE-CUTTER DEMO ===\n');
  console.log('INPUT: Whisper transcript with 17 words and multiple silence gaps\n');

  // Show the input array structure
  console.log('Word Array Structure:');
  console.log(JSON.stringify(sampleWords.slice(0, 3), null, 2));
  console.log(`... (${sampleWords.length} total words)\n`);

  const silenceThreshold = 0.5; // 500ms
  console.log(`Silence Threshold: ${silenceThreshold} seconds\n`);

  // Step 1: Detect silence gaps
  console.log('STEP 1: Detect Silence Gaps');
  console.log('─'.repeat(50));
  const gaps = detectSilenceGaps(sampleWords, silenceThreshold);

  console.log(`Found ${gaps.length} silence gap(s) >= ${silenceThreshold}s:\n`);
  gaps.forEach((gap, index) => {
    console.log(`  Gap ${index + 1}:`);
    console.log(`    Start: ${gap.start.toFixed(2)}s`);
    console.log(`    End:   ${gap.end.toFixed(2)}s`);
    console.log(`    Duration: ${gap.duration.toFixed(2)}s`);
  });

  // Step 2: Extract speech segments
  console.log('\nSTEP 2: Extract Speech Segments');
  console.log('─'.repeat(50));
  const segments = extractSpeechSegments(sampleWords, silenceThreshold);

  console.log(`Extracted ${segments.length} continuous speech segment(s):\n`);
  segments.forEach((segment, index) => {
    const relatedWords = sampleWords.filter(
      (w) => w.start >= segment.start && w.end <= segment.end
    );
    console.log(`  Segment ${index + 1}:`);
    console.log(`    Time Range: ${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s`);
    console.log(`    Duration: ${segment.duration.toFixed(2)}s`);
    console.log(`    Words: "${relatedWords.map((w) => w.word).join(' ')}"`);
  });

  // Step 3: Calculate metrics
  console.log('\nSTEP 3: Compression Metrics');
  console.log('─'.repeat(50));
  const totalDuration = sampleWords[sampleWords.length - 1].end;
  const metrics = calculateTrimMetrics(segments, totalDuration);

  console.log(`Total Duration: ${metrics.totalDuration.toFixed(2)}s`);
  console.log(`Speech Duration: ${metrics.speechDuration.toFixed(2)}s`);
  console.log(`Silence Duration: ${metrics.silenceDuration.toFixed(2)}s`);
  console.log(`Compression Ratio: ${metrics.compressionRatio}%`);
  console.log(`Time Saved: ${metrics.timeSaved.toFixed(2)}s`);

  // Step 4: Generate FFmpeg commands
  console.log('\nSTEP 4: FFmpeg Trim Commands');
  console.log('─'.repeat(50));
  const trimCommands = generateTrimCommands(segments, 'input.mp4');
  trimCommands.forEach((cmd, index) => {
    console.log(`  Command ${index + 1}:`);
    console.log(`    ${cmd}`);
  });

  // Step 5: Generate concat list
  console.log('\nSTEP 5: Concat Demuxer List (save to concat-list.txt)');
  console.log('─'.repeat(50));
  const concatList = generateConcatList('.', segments.length);
  console.log(concatList);

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('SUMMARY: How the Silence-Cutter Handled the Timestamp Array:');
  console.log('═'.repeat(50));
  console.log(`
1. Iterated through ${sampleWords.length} words in sequence
2. Calculated gaps between consecutive word timestamps
3. Filtered gaps >= ${silenceThreshold}s (${gaps.length} found)
4. Grouped words into ${segments.length} continuous segments
5. Generated ${trimCommands.length} FFmpeg trim command(s)
6. Final output will be ${metrics.timeSaved.toFixed(2)}s shorter (${((1 - metrics.compressionRatio / 100) * 100).toFixed(1)}% faster paced)`);
}

/**
 * Advanced: Shows timestamp array handling with edge cases
 */
export function demonstrateEdgeCases() {
  console.log('\n\n=== EDGE CASES DEMO ===\n');

  // Edge case 1: Single word
  console.log('Edge Case 1: Single Word');
  console.log('─'.repeat(50));
  const singleWord: TimestampWord[] = [{ word: 'Hello', start: 0, end: 0.5 }];
  const gaps1 = detectSilenceGaps(singleWord, 0.5);
  console.log(`Input: ${JSON.stringify(singleWord)}`);
  console.log(`Gaps found: ${gaps1.length} (expected: 0)\n`);

  // Edge case 2: Very long silence
  console.log('Edge Case 2: Very Long Silence (3+ seconds)');
  console.log('─'.repeat(50));
  const longSilence: TimestampWord[] = [
    { word: 'Start', start: 0, end: 0.5 },
    { word: 'End', start: 3.8, end: 4.3 },
  ];
  const gaps2 = detectSilenceGaps(longSilence, 0.5);
  console.log(`Silence gap: ${gaps2[0].duration.toFixed(2)}s`);
  console.log(`Speech segments: ${extractSpeechSegments(longSilence, 0.5).length}\n`);

  // Edge case 3: Rapid speech (no silence)
  console.log('Edge Case 3: Rapid Speech (No Silence)');
  console.log('─'.repeat(50));
  const rapidSpeech: TimestampWord[] = [
    { word: 'Hello', start: 0, end: 0.2 },
    { word: 'world', start: 0.25, end: 0.45 },
    { word: 'today', start: 0.5, end: 0.7 },
  ];
  const gaps3 = detectSilenceGaps(rapidSpeech, 0.5);
  console.log(`Gaps >= 0.5s: ${gaps3.length} (expected: 0)`);
  console.log(`Speech segments: ${extractSpeechSegments(rapidSpeech, 0.5).length} (expected: 1)\n`);
}

// Run demonstrations if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateSilenceCutter();
  demonstrateEdgeCases();
}

export default {
  demonstrateSilenceCutter,
  demonstrateEdgeCases,
};
