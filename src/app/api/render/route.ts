import { NextRequest, NextResponse } from 'next/server';
import { renderVideo } from '../../../../lib/ffmpeg-renderer';
import type { TimestampWord } from '../../../../lib/silence-cutter';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;
    const wordsJson = formData.get('words') as string | null;
    const styleKey = (formData.get('styleKey') as string | null) ?? 'barber';
    const isRTL = (formData.get('isRTL') as string | null) === 'true';
    const durationStr = formData.get('duration') as string | null;

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    if (!wordsJson) return NextResponse.json({ error: 'No words' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 400 });

    let words: TimestampWord[];
    try {
      words = JSON.parse(wordsJson) as TimestampWord[];
    } catch {
      return NextResponse.json({ error: 'Invalid words JSON' }, { status: 400 });
    }

    const duration = durationStr ? parseFloat(durationStr) : words[words.length - 1]?.end ?? 0;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const result = await renderVideo({
      fileBuffer,
      mimeType: file.type,
      filename: file.name,
      words,
      duration,
      styleKey,
      isRTL,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const slug = file.name.replace(/\.[^.]+$/, '');
    return new NextResponse(new Uint8Array(result.mp4Buffer), {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${slug}-ghost.mp4"`,
        'Content-Length': result.mp4Buffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Allow up to 10 minutes for long renders
export const maxDuration = 600;
