import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createBus } from '@/lib/engine/events';
import { runPipeline } from '@/lib/engine/pipeline-orchestrator';
import type { EngineConfig } from '@/lib/engine/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('video');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'missing video file in form field "video"' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'video file is empty' }, { status: 400 });
    }

    const presetKey = (form.get('preset') as string) || 'barber';
    const silenceThresholdDb = parseFloat((form.get('silenceThresholdDb') as string) || '-30');
    const silenceMinDurSec = parseFloat((form.get('silenceMinDurSec') as string) || '0.5');
    const fps = parseInt((form.get('fps') as string) || '30', 10);
    const produceRoughCut = (form.get('roughCut') as string) !== 'false';

    const jobId = `job_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    const workRoot = path.resolve(process.cwd(), process.env.ENGINE_WORK_DIR || '.engine-jobs');
    const jobDir = path.join(workRoot, jobId);
    fs.mkdirSync(jobDir, { recursive: true });

    const ext = sanitizeExt(file.name) || '.mp4';
    const videoPath = path.join(jobDir, `source${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(videoPath, buffer);

    const cfg: EngineConfig = {
      jobId,
      jobDir,
      videoPath,
      silenceThresholdDb,
      silenceMinDurSec,
      presetKey: presetKey as EngineConfig['presetKey'],
      fps,
    };

    const bus = createBus(jobId);
    bus.log('init', 'info', `received upload: ${file.name} (${formatBytes(file.size)})`);

    runPipeline(cfg, bus, { produceRoughCut }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      bus.fatal('error', message);
    });

    return NextResponse.json({
      jobId,
      jobDir,
      streamUrl: `/api/engine/stream/${jobId}`,
      cfg: { presetKey: cfg.presetKey, silenceThresholdDb, silenceMinDurSec, fps, produceRoughCut },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sanitizeExt(filename: string): string {
  const m = filename.match(/\.[a-z0-9]{2,5}$/i);
  return m ? m[0].toLowerCase() : '';
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
