/**
 * Shared Vietnamese NLP, automotive synonym matching, prompt-injection sanitization,
 * and JSON extraction helpers (Ponytail zero-dependency utilities).
 */

export function stripViAccents(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export const VI_STOPWORDS = new Set<string>([
  'kiem', 'tra', 'thay', 'the', 'sua', 'chua', 'bao', 'duong', 'dinh', 'ky',
  'cho', 'cua', 'voi', 'cac', 'nhung', 'trong', 'ngoai', 'tren', 'duoi',
  'truoc', 'sau', 'trai', 'phai', 'ben', 'khi', 'neu', 'can', 'lam', 'giup',
  'anh', 'chi', 'toi', 'em', 'xe', 'oto', 'hoi', 'gia', 'nhieu', 'tien',
  'phi', 'dich', 'vu', 'hang', 'muc', 'cong', 'viec', 'quy', 'trinh',
  'va', 'hoac', 'la', 'bi', 'co', 'khong', 'duoc', 'roi', 'nay', 'kia',
  'canh', 'tinh', 'trang', 'muc', 'do', 've', 'sinh', 'xu', 'ly', 'khac', 'phuc',
]);

export const VI_AUTOMOTIVE_SYNONYMS: ReadonlyArray<readonly string[]> = [
  ['dau may', 'dau nhot', 'nhot dong co', 'nhot may', 'nhot'],
  ['loc dau', 'loc nhot'],
  ['loc gio dong co', 'loc gio may', 'loc gio'],
  ['loc gio dieu hoa', 'loc lanh', 'loc cabin', 'dieu hoa', 'may lanh', 'dan lanh'],
  ['ma phanh', 'bo thang', 'phanh', 'thang'],
  ['dia phanh', 'dia thang', 'tam phanh'],
  ['dau phanh', 'dau thang'],
  ['ro tuyn', 'rotuyn', 'thanh can bang', 'he thong treo', 'gam'],
  ['phuoc', 'giam xoc', 'thut'],
  ['ac quy', 'binh dien', 'binh ac quy', 'kich binh'],
  ['bugi', 'danh lua', 'bo may'],
  ['bo bin', 'mobin'],
  ['nuoc lam mat', 'nuoc mat', 'dung dich lam mat', 'ket nuoc', 'qua nhiet', 'soi ket nuoc'],
  ['day curoa', 'curoa', 'tang do', 'puly'],
  ['gat mua', 'choi gat', 'nuoc rua kinh'],
  ['lop', 'vo xe', 'can mam', 'can bang dong', 'goc dat banh xe', 'thuoc lai'],
  ['hop so', 'dau hop so', 'nhot hop so', 'ly hop', 'con'],
  ['go han', 'dong son', 'son', 'matit', 'mop', 'tray', 'xuoc', 'can truoc', 'can sau'],
];

function cleanAlphaNum(text: string): string {
  return stripViAccents(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract normalized technical keywords, synonym expansions, and informative tokens
 * from Vietnamese accented or unaccented text.
 */
export function tokenizeViKeywords(texts: string[], maxTokens = 20): string[] {
  const joined = cleanAlphaNum(texts.filter(Boolean).join(' '));
  if (!joined) return [];

  const result: string[] = [];
  const seen = new Set<string>();
  const addToken = (tok: string) => {
    const clean = tok.trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    result.push(clean);
  };

  for (const group of VI_AUTOMOTIVE_SYNONYMS) {
    const matched = group.some((phrase) => joined.includes(phrase));
    if (matched) {
      for (const phrase of group) {
        addToken(phrase);
        if (result.length >= maxTokens) return result;
      }
    }
  }

  const rawWords = joined.split(' ');
  for (const w of rawWords) {
    if (w.length >= 3 && !VI_STOPWORDS.has(w)) {
      addToken(w);
      if (result.length >= maxTokens) return result;
    }
  }

  return result;
}

/**
 * Deterministic accent-insensitive & hyphen-insensitive relevance scorer for Vietnamese automotive catalogs.
 */
export function scoreViTextMatch(queryTexts: string[], candidateText: string): number {
  const queryNorm = cleanAlphaNum(queryTexts.filter(Boolean).join(' '));
  const candNorm = cleanAlphaNum(candidateText);
  if (!queryNorm || !candNorm) return 0;

  let score = 0;

  // 1. Synonym-group concept matches
  for (const group of VI_AUTOMOTIVE_SYNONYMS) {
    const queryHits = group.filter((phrase) => queryNorm.includes(phrase));
    if (queryHits.length === 0) continue;
    const candHits = group.filter((phrase) => candNorm.includes(phrase));
    if (candHits.length === 0) continue;

    const exactMultiWord = queryHits.some((p) => p.includes(' ') && candHits.includes(p));
    score += exactMultiWord ? 10 : 6;
  }

  // 2. Informative non-stopword token overlap
  const candWords = new Set(candNorm.split(' ').filter((w) => w.length >= 3 && !VI_STOPWORDS.has(w)));
  const seenQueryWords = new Set<string>();
  for (const qw of queryNorm.split(' ')) {
    if (qw.length < 3 || VI_STOPWORDS.has(qw) || seenQueryWords.has(qw)) continue;
    seenQueryWords.add(qw);
    if (candWords.has(qw)) {
      score += 3;
    }
  }

  return score;
}

/**
 * Sanitize untrusted user/DB free-text before embedding inside LLM prompts to block Prompt Injection.
 */
export function sanitizeUntrustedPromptText(input: unknown, maxLength = 500): string {
  const raw = String(input ?? '');
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f)) {
      continue;
    }
    out += raw[i];
  }

  return out
    .replace(/```/g, "'''")
    .replace(/={3,}/g, '==')
    .replace(/#{3,}/g, '##')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Strip markdown code fences and recover the outermost JSON object from LLM text.
 */
export function stripJsonCodeFence(rawText: string): string {
  let text = String(rawText || '').trim();
  if (text.startsWith('```')) {
    text = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace && (firstBrace > 0 || lastBrace < text.length - 1)) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }
  return text;
}
