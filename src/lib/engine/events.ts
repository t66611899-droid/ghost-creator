import { EventEmitter } from 'node:events';
import type { EngineEvent, EngineStep, EngineEventLevel, EngineResult } from './types';

export class EngineBus extends EventEmitter {
  private buffer: EngineEvent[] = [];
  private finished = false;
  private maxBuffer = 4000;

  emitEvent(e: EngineEvent) {
    if (this.buffer.length < this.maxBuffer) this.buffer.push(e);
    super.emit('event', e);
    if (e.kind === 'fatal' || (e.kind === 'step:done' && e.step === 'done')) {
      this.finished = true;
      super.emit('end');
    }
  }

  log(step: EngineStep, level: EngineEventLevel, message: string) {
    this.emitEvent({ kind: 'log', step, level, message, ts: Date.now() });
  }

  progress(step: EngineStep, pct: number, label?: string) {
    this.emitEvent({ kind: 'progress', step, pct, label, ts: Date.now() });
  }

  stepStart(step: EngineStep, label: string) {
    this.emitEvent({ kind: 'step:start', step, label, ts: Date.now() });
  }

  stepDone(step: EngineStep, durationMs: number) {
    this.emitEvent({ kind: 'step:done', step, durationMs, ts: Date.now() });
  }

  result(result: EngineResult) {
    this.emitEvent({ kind: 'result', result, ts: Date.now() });
  }

  fatal(step: EngineStep, message: string) {
    this.emitEvent({ kind: 'fatal', step, message, ts: Date.now() });
  }

  replay(): EngineEvent[] {
    return [...this.buffer];
  }

  isDone(): boolean {
    return this.finished;
  }
}

// Persist registry on globalThis so it survives Next.js dev HMR module reloads
// and is shared across route-handler module instances.
const G = globalThis as unknown as { __engineBusRegistry?: Map<string, EngineBus> };
const REGISTRY: Map<string, EngineBus> = G.__engineBusRegistry ?? new Map<string, EngineBus>();
G.__engineBusRegistry = REGISTRY;

export function createBus(jobId: string): EngineBus {
  const bus = new EngineBus();
  REGISTRY.set(jobId, bus);
  bus.once('end', () => {
    setTimeout(() => REGISTRY.delete(jobId), 5 * 60_000);
  });
  return bus;
}

export function getBus(jobId: string): EngineBus | undefined {
  return REGISTRY.get(jobId);
}

export function listBusIds(): string[] {
  return [...REGISTRY.keys()];
}
