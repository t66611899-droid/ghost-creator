import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { TranscriptionResponse, ErrorResponse } from '@/types/api';
import { processTranscription } from '../../../../lib/transcription-processor';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

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

    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      return NextResponse.json<ErrorResponse>(
        { error: 'File must be a video or audio file' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ErrorResponse>(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const whisperResponse = await openai.audio.transcriptions.create({
      file: new File([buffer], file.name, { type: file.type }),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    const result = processTranscription(whisperResponse as Parameters<typeof processTranscription>[0]);

    if (!result.success) {
      return NextResponse.json<ErrorResponse>(
        {
          error: result.error.message,
          code: result.error.code,
          details: result.error.details,
        },
        { status: 422 }
      );
    }

    return NextResponse.json<TranscriptionResponse>({
      transcription: result.data.text,
      words: result.data.words,
      wordCount: result.data.wordCount,
      duration: result.data.duration,
      language: result.data.language,
      isRTL: result.data.isRTL,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to transcribe video' },
      { status: 500 }
    );
  }
}