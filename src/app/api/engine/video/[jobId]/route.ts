import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JOB_ID_RE = /^job_[a-z0-9_]+$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  if (!JOB_ID_RE.test(jobId)) {
    return json({ error: 'bad jobId' }, 400);
  }

  const workRoot = path.resolve(process.cwd(), process.env.ENGINE_WORK_DIR || '.engine-jobs');
  const filePath = path.resolve(workRoot, jobId, 'rough-cut.mp4');
  if (!filePath.startsWith(workRoot + path.sep)) {
    return json({ error: 'invalid path' }, 400);
  }
  if (!fs.existsSync(filePath)) {
    return json(
      {
        error: 'rough-cut.mp4 not found',
        jobId,
        hint: 'render may still be in progress, or roughCut was disabled at start.',
      },
      404,
    );
  }

  const stat = fs.statSync(filePath);
  const total = stat.size;
  const wantsDownload = new URL(req.url).searchParams.get('download') === '1';

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  };
  if (wantsDownload) {
    baseHeaders['Content-Disposition'] = `attachment; filename="${jobId}-rough-cut.mp4"`;
  }

  const range = req.headers.get('range');
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!m) {
      return new Response('invalid range', {
        status: 416,
        headers: { 'Content-Range': `bytes */${total}` },
      });
    }
    const start = m[1] ? parseInt(m[1], 10) : 0;
    const end = m[2] ? parseInt(m[2], 10) : total - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= total) {
      return new Response('range not satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${total}` },
      });
    }
    const chunkSize = end - start + 1;
    const node = fs.createReadStream(filePath, { start, end });
    return new Response(Readable.toWeb(node) as unknown as ReadableStream<Uint8Array>, {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Content-Length': String(chunkSize),
      },
    });
  }

  const node = fs.createReadStream(filePath);
  return new Response(Readable.toWeb(node) as unknown as ReadableStream<Uint8Array>, {
    status: 200,
    headers: { ...baseHeaders, 'Content-Length': String(total) },
  });
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
