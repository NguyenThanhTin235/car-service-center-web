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

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
export const FALLBACK_MODELS = [
  GEMINI_MODEL,
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
].filter((v, i, a) => a.indexOf(v) === i);

// Con trỏ Round-Robin để luân chuyển key đều giữa các request, tránh nghẽn/rate limit 1 key cố định
let currentKeyCursor = 0;

/**
 * Gọi Gemini với cơ chế tự động xoay vòng key & model (Failover / Fallback / Round-Robin)
 * Chiến lược: Thử model nhanh nhất (gemini-3.5-flash) lần lượt trên TOÀN BỘ các Key trước.
 * Nếu tất cả các Key đều bị 503/429 thì mới chuyển sang fallback model (gemini-3.5-flash-lite).
 * Tích hợp timeout (15s) để ngăn chặn hoàn toàn tình trạng bị treo 3-5 phút.
 */
export async function executeWithGeminiFailover<T>(
  operation: (ai: GoogleGenAI, keyIndex: number, model: string) => Promise<T>,
  timeoutMs: number = 15000
): Promise<T> {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    throw new Error('Chưa cấu hình GEMINI_API_KEYS hoặc GEMINI_API_KEY trong file .env');
  }

  let lastError: any = null;
  const numKeys = keys.length;

  for (const model of FALLBACK_MODELS) {
    const startIdx = currentKeyCursor;
    for (let offset = 0; offset < numKeys; offset++) {
      const keyIndex = (startIdx + offset) % numKeys;
      const key = keys[keyIndex];
      const ai = new GoogleGenAI({ apiKey: key });

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout sau ${timeoutMs / 1000}s khi gọi Gemini model ${model}`)), timeoutMs)
        );

        const result = await Promise.race([
          operation(ai, keyIndex, model),
          timeoutPromise,
        ]);

        // Cập nhật cursor sang key tiếp theo để cân bằng tải (round-robin)
        currentKeyCursor = (keyIndex + 1) % numKeys;
        return result;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[Gemini Failover] Key #${keyIndex + 1} (${key.slice(0, 10)}...) với model ${model} gặp lỗi: ${errMsg.slice(0, 150)}. Thử key tiếp theo...`);
      }
    }
  }

  throw new Error(`Tất cả ${keys.length} API key Gemini đều gặp lỗi: ${lastError?.message || lastError}`);
}


