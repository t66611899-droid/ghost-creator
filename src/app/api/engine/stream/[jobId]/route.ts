import { NextRequest } from 'next/server';
import { getBus, listBusIds } from '@/lib/engine/events';
import type { EngineEvent } from '@/lib/engine/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const bus = getBus(jobId);
  if (!bus) {
    const known = listBusIds();
    console.warn(`[engine/stream] job=${jobId} not found. known=${known.length} → ${known.join(', ') || '(none)'}`);
    return new Response(
      JSON.stringify({
        error: 'job not found or expired',
        jobId,
        knownJobs: known,
        hint: 'If dev server was just restarted the registry was wiped — click Start engine again.',
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (e: EngineEvent) => {
        try {
          controller.enqueue(encoder.encode(`event: ${e.kind}\ndata: ${JSON.stringify(e)}\n\n`));
        } catch {
          // Stream already closed
        }
      };

      controller.enqueue(encoder.encode(`: connected ${jobId}\n\n`));
      for (const e of bus.replay()) send(e);

      const onEvent = (e: EngineEvent) => send(e);
      const onEnd = () => {
        try {
          controller.enqueue(encoder.encode(`event: close\ndata: {}\n\n`));
          controller.close();
        } catch {
          // Stream already closed
        }
      };

      bus.on('event', onEvent);
      bus.once('end', onEnd);
      if (bus.isDone()) onEnd();
    },
    cancel() {
      // client disconnected — listeners self-clean since the bus is short-lived
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
