import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import logger from '../loggers/logger';

dotenv.config();

/**
 * Lấy danh sách toàn bộ các Gemini API keys từ biến môi trường.
 */
export function getGeminiApiKeys(): string[] {
  const keys: string[] = [];

  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    keys.push(...list);
  }

  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && !keys.includes(key.trim())) {
      keys.push(key.trim());
    }
  }

  if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY.trim())) {
    keys.unshift(process.env.GEMINI_API_KEY.trim());
  }

  return keys;
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
export const FALLBACK_MODELS = [
  GEMINI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

const COOLDOWN_TRANSIENT_MS = 60_000;
const QUARANTINE_AUTH_MS = 600_000;
const CIRCUIT_BREAKER_THRESHOLD = 6;
const CIRCUIT_BREAKER_OPEN_MS = 20_000;

export interface GeminiFailoverAttemptMeta {
  model: string;
  keySlot: number;
  attempts: number;
  llmMs: number;
}

export interface GeminiFailoverOptions {
  maxTotalMs?: number;
  maxAttempts?: number;
  onAttemptMeta?: (meta: GeminiFailoverAttemptMeta) => void;
}

// Reuse GoogleGenAI SDK instances across requests instead of allocating per attempt
const clientPool = new Map<string, GoogleGenAI>();
// Cooldown keyed by `${keyIndex}:${model}` or `auth:${keyIndex}`
const keyCooldowns = new Map<string, number>();

let currentKeyCursor = 0;
let consecutiveFullFailures = 0;
let circuitOpenUntil = 0;

function getClient(apiKey: string): GoogleGenAI {
  let client = clientPool.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clientPool.set(apiKey, client);
  }
  return client;
}

function isCooling(cooldownKey: string): boolean {
  const expiresAt = keyCooldowns.get(cooldownKey);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    keyCooldowns.delete(cooldownKey);
    return false;
  }
  return true;
}

function isKeyOrModelCooling(keyIndex: number, model: string): boolean {
  return isCooling(`auth:${keyIndex}`) || isCooling(`${keyIndex}:${model}`);
}

function markCooldown(cooldownKey: string, durationMs: number): void {
  keyCooldowns.set(cooldownKey, Date.now() + durationMs);
}

function classifyGeminiError(err: unknown): {
  kind: 'NON_RETRYABLE_CLIENT' | 'MODEL_NOT_FOUND' | 'AUTH_ERROR' | 'RATE_OR_OVERLOAD' | 'OTHER';
  status?: number;
  message: string;
} {
  const e = err as { status?: number; code?: number; message?: string };
  const status = typeof e?.status === 'number' ? e.status : typeof e?.code === 'number' ? e.code : undefined;
  const message = e?.message || String(err);
  const lower = message.toLowerCase();

  if (status === 400 || lower.includes('invalid_argument') || lower.includes('400 bad request')) {
    return { kind: 'NON_RETRYABLE_CLIENT', status: status ?? 400, message };
  }
  if (
    status === 404 ||
    lower.includes('not found') ||
    lower.includes('no longer available') ||
    lower.includes('404 ')
  ) {
    return { kind: 'MODEL_NOT_FOUND', status: status ?? 404, message };
  }
  if (
    status === 401 ||
    status === 403 ||
    lower.includes('api_key_invalid') ||
    lower.includes('permission_denied') ||
    lower.includes('api key not valid')
  ) {
    return { kind: 'AUTH_ERROR', status: status ?? 401, message };
  }
  if (
    status === 429 ||
    status === 503 ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('high demand') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('unavailable')
  ) {
    return { kind: 'RATE_OR_OVERLOAD', status, message };
  }
  return { kind: 'OTHER', status, message };
}

export function getGeminiClientHealth(): {
  configuredKeysCount: number;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  activeCooldownCount: number;
} {
  const now = Date.now();
  for (const [k, exp] of keyCooldowns.entries()) {
    if (now > exp) keyCooldowns.delete(k);
  }
  let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  if (circuitOpenUntil > now) {
    circuitState = 'OPEN';
  } else if (consecutiveFullFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitState = 'HALF_OPEN';
  }
  return {
    configuredKeysCount: getGeminiApiKeys().length,
    circuitState,
    activeCooldownCount: keyCooldowns.size,
  };
}

export function resetGeminiClientStateForTest(): void {
  clientPool.clear();
  keyCooldowns.clear();
  currentKeyCursor = 0;
  consecutiveFullFailures = 0;
  circuitOpenUntil = 0;
}

/**
 * Gọi Gemini với cơ chế Failover / Round-Robin / Circuit Breaker / AbortSignal + Budget Deadline.
 * Tuyệt đối không ghi API key prefix ra log.
 */
export async function executeWithGeminiFailover<T>(
  operation: (ai: GoogleGenAI, keyIndex: number, model: string, abortSignal?: AbortSignal) => Promise<T>,
  timeoutMs: number = 12000,
  options?: GeminiFailoverOptions
): Promise<T> {
  const allKeys = getGeminiApiKeys();
  if (allKeys.length === 0) {
    throw new Error('Dịch vụ AI chưa được cấu hình khóa truy cập.');
  }

  const now = Date.now();
  if (circuitOpenUntil > now) {
    throw new Error('AI Gateway circuit breaker OPEN: tạm ngắt để phục hồi.');
  }

  const perAttemptMs = timeoutMs < 8500 ? Math.max(100, timeoutMs) : 8500;
  const maxTotalMs = options?.maxTotalMs ?? Math.min(Math.max(timeoutMs + 2000, 5000), 14000);
  const maxAttempts = options?.maxAttempts ?? 3;
  const requestStart = Date.now();
  const numKeys = allKeys.length;

  let attempts = 0;
  let lastError: unknown = null;

  for (let mIdx = 0; mIdx < FALLBACK_MODELS.length; mIdx++) {
    const model = FALLBACK_MODELS[mIdx];
    const startIdx = currentKeyCursor % numKeys;
    const availableOffsets: number[] = [];
    const coolingOffsets: number[] = [];

    for (let offset = 0; offset < numKeys; offset++) {
      const idx = (startIdx + offset) % numKeys;
      if (isKeyOrModelCooling(idx, model)) {
        coolingOffsets.push(offset);
      } else {
        availableOffsets.push(offset);
      }
    }

    // Never storm cooling keys across fallback models; at most probe 1 key on primary model if all cooled
    const orderedOffsets =
      availableOffsets.length > 0
        ? availableOffsets
        : mIdx === 0 && coolingOffsets.length > 0
          ? [coolingOffsets[0]]
          : [];

    for (const offset of orderedOffsets) {
      if (attempts >= maxAttempts) break;
      const elapsedTotal = Date.now() - requestStart;
      const remainingTotal = maxTotalMs - elapsedTotal;
      if (remainingTotal <= 50) break;

      attempts++;
      const keyIndex = (startIdx + offset) % numKeys;
      const key = allKeys[keyIndex];
      const ai = getClient(key);
      const effectiveTimeoutMs = Math.min(perAttemptMs, remainingTotal);

      const abortController = new AbortController();
      let timer: NodeJS.Timeout | undefined;
      const attemptStart = performance.now();

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            abortController.abort();
            reject(new Error(`Timeout sau ${effectiveTimeoutMs}ms khi gọi model ${model}`));
          }, effectiveTimeoutMs);
        });

        const result = await Promise.race([
          operation(ai, keyIndex, model, abortController.signal),
          timeoutPromise,
        ]);

        const llmMs = Math.round((performance.now() - attemptStart) * 10) / 10;
        keyCooldowns.delete(`${keyIndex}:${model}`);
        keyCooldowns.delete(`auth:${keyIndex}`);
        consecutiveFullFailures = 0;
        circuitOpenUntil = 0;
        currentKeyCursor = (keyIndex + 1) % numKeys;

        options?.onAttemptMeta?.({
          model,
          keySlot: keyIndex + 1,
          attempts,
          llmMs,
        });

        return result;
      } catch (err: unknown) {
        lastError = err;
        const classified = classifyGeminiError(err);

        logger.warn('[Gemini Failover] Attempt failed', {
          keySlot: keyIndex + 1,
          model,
          kind: classified.kind,
          status: classified.status,
          reason: classified.message.slice(0, 140),
        });

        if (classified.kind === 'NON_RETRYABLE_CLIENT') {
          throw err;
        }
        if (classified.kind === 'AUTH_ERROR') {
          markCooldown(`auth:${keyIndex}`, QUARANTINE_AUTH_MS);
          continue;
        }
        if (classified.kind === 'MODEL_NOT_FOUND') {
          // Skip remaining keys for a missing/deprecated model immediately
          break;
        }
        if (classified.kind === 'RATE_OR_OVERLOAD') {
          markCooldown(`${keyIndex}:${model}`, COOLDOWN_TRANSIENT_MS);
        }
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    if (attempts >= maxAttempts || Date.now() - requestStart >= maxTotalMs) {
      break;
    }
  }

  consecutiveFullFailures += 1;
  if (consecutiveFullFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_OPEN_MS;
    logger.error('[Gemini Failover] Circuit breaker OPENED due to consecutive upstream failures', {
      consecutiveFullFailures,
      openSeconds: CIRCUIT_BREAKER_OPEN_MS / 1000,
    });
  }

  const lastMsg = lastError instanceof Error ? lastError.message : String(lastError || 'Unknown error');
  throw new Error(`Dịch vụ AI tạm thời gián đoạn (${lastMsg.slice(0, 100)})`);
}
