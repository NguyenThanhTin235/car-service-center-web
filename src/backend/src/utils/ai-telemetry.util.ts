import crypto from 'node:crypto';
import logger from '../loggers/logger';

export type AiWorkflowName = 'customer_chat' | 'customer_welcome' | 'job_planner' | 'part_planner';

export interface AiTelemetryEvent {
  traceId: string;
  workflow: AiWorkflowName;
  promptVersion: string;
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  retrievalMs?: number;
  llmMs?: number;
  validationMs?: number;
  totalMs: number;
  cacheHit?: boolean;
  dedupHit?: boolean;
  retryCount?: number;
  isFallback?: boolean;
  guardrailInterventions?: string[];
  errorCode?: string;
  statusCode?: number;
}

interface WorkflowAccumulator {
  totalRequests: number;
  cacheHits: number;
  dedupHits: number;
  fallbackCount: number;
  errorCount: number;
  retryCount: number;
  guardrailInterventionCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCostUsd: number;
  latenciesMs: number[];
}

const MAX_LATENCY_WINDOW = 200;
const workflowStats = new Map<AiWorkflowName, WorkflowAccumulator>();

function getOrCreateAcc(workflow: AiWorkflowName): WorkflowAccumulator {
  let acc = workflowStats.get(workflow);
  if (!acc) {
    acc = {
      totalRequests: 0,
      cacheHits: 0,
      dedupHits: 0,
      fallbackCount: 0,
      errorCount: 0,
      retryCount: 0,
      guardrailInterventionCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalEstimatedCostUsd: 0,
      latenciesMs: [],
    };
    workflowStats.set(workflow, acc);
  }
  return acc;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Math.round(sorted[idx] * 10) / 10;
}

export function createAiTraceId(existingTraceId?: string): string {
  if (existingTraceId && /^[a-zA-Z0-9\-_]{1,64}$/.test(existingTraceId)) {
    return existingTraceId;
  }
  return crypto.randomUUID();
}

export function estimateGeminiCostUsd(
  model: string | undefined,
  inputTokens = 0,
  outputTokens = 0
): number {
  const m = String(model || '').toLowerCase();
  const isLite = m.includes('lite');
  const inputRatePerM = isLite ? 0.1 : 0.3;
  const outputRatePerM = isLite ? 0.4 : 2.5;
  const cost = (inputTokens / 1_000_000) * inputRatePerM + (outputTokens / 1_000_000) * outputRatePerM;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function recordAiTelemetry(event: AiTelemetryEvent): void {
  const acc = getOrCreateAcc(event.workflow);
  acc.totalRequests += 1;
  if (event.cacheHit) acc.cacheHits += 1;
  if (event.dedupHit) acc.dedupHits += 1;
  if (event.isFallback) acc.fallbackCount += 1;
  if (event.errorCode) acc.errorCount += 1;
  if (event.retryCount && event.retryCount > 0) acc.retryCount += event.retryCount;
  if (event.guardrailInterventions && event.guardrailInterventions.length > 0) {
    acc.guardrailInterventionCount += event.guardrailInterventions.length;
  }

  const inTok = event.inputTokens || 0;
  const outTok = event.outputTokens || 0;
  const cost =
    event.estimatedCostUsd !== undefined
      ? event.estimatedCostUsd
      : estimateGeminiCostUsd(event.model, inTok, outTok);

  acc.totalInputTokens += inTok;
  acc.totalOutputTokens += outTok;
  acc.totalEstimatedCostUsd = Math.round((acc.totalEstimatedCostUsd + cost) * 1_000_000) / 1_000_000;

  if (Number.isFinite(event.totalMs)) {
    acc.latenciesMs.push(Math.round(event.totalMs * 10) / 10);
    if (acc.latenciesMs.length > MAX_LATENCY_WINDOW) {
      acc.latenciesMs.shift();
    }
  }

  logger.info('ai.telemetry', {
    ...event,
    estimatedCostUsd: cost,
  });
}

export function getAiMetricsSnapshot() {
  const workflows: Record<string, unknown> = {};
  for (const [name, acc] of workflowStats.entries()) {
    const sorted = [...acc.latenciesMs].sort((a, b) => a - b);
    const avgMs =
      sorted.length > 0
        ? Math.round((sorted.reduce((s, v) => s + v, 0) / sorted.length) * 10) / 10
        : 0;

    workflows[name] = {
      totalRequests: acc.totalRequests,
      cacheHitRate: acc.totalRequests > 0 ? Math.round((acc.cacheHits / acc.totalRequests) * 1000) / 10 : 0,
      dedupHits: acc.dedupHits,
      fallbackCount: acc.fallbackCount,
      errorCount: acc.errorCount,
      retryCount: acc.retryCount,
      guardrailInterventionCount: acc.guardrailInterventionCount,
      totalInputTokens: acc.totalInputTokens,
      totalOutputTokens: acc.totalOutputTokens,
      totalEstimatedCostUsd: acc.totalEstimatedCostUsd,
      latency: {
        sampleSize: sorted.length,
        avgMs,
        p50Ms: percentile(sorted, 50),
        p95Ms: percentile(sorted, 95),
      },
    };
  }
  return {
    generatedAt: new Date().toISOString(),
    workflows,
  };
}

export function resetAiMetricsForTest(): void {
  workflowStats.clear();
}
