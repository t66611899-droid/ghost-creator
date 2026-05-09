import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TranscriptionResponse, ErrorResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json<ErrorResponse>(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('video/')) {
      return NextResponse.json<ErrorResponse>(
        { error: 'File must be a video' },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ErrorResponse>(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for OpenAI
    const buffer = Buffer.from(await file.arrayBuffer());

    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], file.name, { type: file.type }),
      model: 'whisper-1',
      language: 'en', // Assuming English, can make configurable
    });

    return NextResponse.json<TranscriptionResponse>({
      transcription: transcription.text,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to transcribe video' },
      { status: 500 }
    );
  }
}