import { NextRequest, NextResponse } from 'next/server';
import { analyzeDescription } from '../../../../../lib/strategy/plan-generator';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { description: string };
    const { description } = body;

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description too short' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY ?? '';
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
    }

    const analysis = await analyzeDescription(description.trim(), apiKey);
    return NextResponse.json({ analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const maxDuration = 45;
