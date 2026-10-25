import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Lấy danh sách toàn bộ các Gemini API keys từ biến môi trường
 */
export function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  
  // 1. Kiểm tra danh sách phân tách bằng dấu phẩy
  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    keys.push(...list);
  }

  // 2. Kiểm tra các biến đánh số riêng lẻ: GEMINI_API_KEY_1..4 hoặc GEMINI_API_KEY
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
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
].filter((v, i, a) => a.indexOf(v) === i);

// Quản lý Cooldown cho các API Key gặp lỗi 503 (high demand) hoặc 429 (quota exceeded)
const keyCooldowns = new Map<string, number>();

function isKeyCoolingDown(key: string): boolean {
  const expiresAt = keyCooldowns.get(key);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    keyCooldowns.delete(key);
    return false;
  }
  return true;
}

function markKeyCooldown(key: string, cooldownMs: number = 60000) {
  keyCooldowns.set(key, Date.now() + cooldownMs);
}

// Con trỏ Round-Robin để luân chuyển key đều giữa các request, tránh nghẽn/rate limit 1 key cố định
let currentKeyCursor = 0;

/**
 * Gọi Gemini với cơ chế tự động xoay vòng key & model (Failover / Fallback / Round-Robin)
 * Chiến lược:
 * 1. Bỏ qua tạm thời các Key đang cooldown (bị 503 / 429 trong 60s qua) để không mất thời gian retry vô ích.
 * 2. Thử model nhanh nhất lần lượt trên các Key khả dụng.
 * 3. Tích hợp timeout (12s) để phản hồi siêu tốc.
 */
export async function executeWithGeminiFailover<T>(
  operation: (ai: GoogleGenAI, keyIndex: number, model: string) => Promise<T>,
  timeoutMs: number = 12000
): Promise<T> {
  const allKeys = getGeminiApiKeys();

  if (allKeys.length === 0) {
    throw new Error('Chưa cấu hình GEMINI_API_KEYS hoặc GEMINI_API_KEY trong file .env');
  }

  let lastError: any = null;
  const numKeys = allKeys.length;

  for (const model of FALLBACK_MODELS) {
    const startIdx = currentKeyCursor;

    // Lập danh sách offset: ưu tiên các key không bị cooldown trước
    const availableOffsets: number[] = [];
    const coolingOffsets: number[] = [];

    for (let offset = 0; offset < numKeys; offset++) {
      const idx = (startIdx + offset) % numKeys;
      if (isKeyCoolingDown(allKeys[idx])) {
        coolingOffsets.push(offset);
      } else {
        availableOffsets.push(offset);
      }
    }

    // Nếu tất cả key đều cooldown, thử lại tất cả; ngược lại ưu tiên key khả dụng
    const orderedOffsets = availableOffsets.length > 0 ? availableOffsets : coolingOffsets;

    for (const offset of orderedOffsets) {
      const keyIndex = (startIdx + offset) % numKeys;
      const key = allKeys[keyIndex];
      const ai = new GoogleGenAI({ apiKey: key });

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout sau ${timeoutMs / 1000}s khi gọi Gemini model ${model}`)), timeoutMs)
        );

        const result = await Promise.race([
          operation(ai, keyIndex, model),
          timeoutPromise,
        ]);

        // Xóa cooldown nếu key này đã hoạt động lại thành công
        keyCooldowns.delete(key);
        // Cập nhật cursor sang key tiếp theo để cân bằng tải (round-robin)
        currentKeyCursor = (keyIndex + 1) % numKeys;
        return result;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        
        // Nếu lỗi 503 (high demand) hoặc 429 (quota), đưa vào cooldown 60s để các request sau không bị chậm
        if (errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('high demand') || errMsg.includes('Quota')) {
          markKeyCooldown(key, 60000);
        }

        console.warn(`[Gemini Failover] Key #${keyIndex + 1} (${key.slice(0, 10)}...) với model ${model} gặp lỗi: ${errMsg.slice(0, 150)}. Thử key tiếp theo...`);
      }
    }
  }

  throw new Error(`Tất cả ${allKeys.length} API key Gemini đều gặp lỗi: ${lastError?.message || lastError}`);
}


