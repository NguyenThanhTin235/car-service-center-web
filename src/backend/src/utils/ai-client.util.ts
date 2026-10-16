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

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
export const FALLBACK_MODELS = [
  GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
].filter((v, i, a) => a.indexOf(v) === i);

/**
 * Gọi Gemini với cơ chế tự động xoay vòng key & model (Failover / Fallback)
 * Nếu Key/Model gặp lỗi quota (429) hoặc 503 high demand, tự động chuyển sang Model/Key tiếp theo
 */
export async function executeWithGeminiFailover<T>(
  operation: (ai: GoogleGenAI, keyIndex: number, model: string) => Promise<T>
): Promise<T> {
  const keys = getGeminiApiKeys();

  if (keys.length === 0) {
    throw new Error('Chưa cấu hình GEMINI_API_KEYS hoặc GEMINI_API_KEY trong file .env');
  }

  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const ai = new GoogleGenAI({ apiKey: key });

    for (const model of FALLBACK_MODELS) {
      try {
        return await operation(ai, i, model);
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Failover] Key #${i + 1} với model ${model} gặp lỗi: ${err?.message || err}. Thử tiếp tục...`);
      }
    }
  }

  throw new Error(`Tất cả ${keys.length} API key Gemini đều gặp lỗi: ${lastError?.message || lastError}`);
}
