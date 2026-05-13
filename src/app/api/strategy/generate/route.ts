import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '../../../../../lib/strategy/plan-generator';
import type { BusinessProfile } from '@/types/profile';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { profile: BusinessProfile };
    const { profile } = body;

    if (!profile?.businessName || !profile?.industry) {
      return NextResponse.json({ error: 'Invalid profile' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY ?? '';
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
    }

    const missions = await generateRoadmap(profile, apiKey);
    return NextResponse.json({ missions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const maxDuration = 120;
