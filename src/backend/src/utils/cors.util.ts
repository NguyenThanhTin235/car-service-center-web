const normalizeOrigin = (value: string): string => value.trim().replace(/\/+$/, '');

export const getFrontendBaseUrl = (): string => {
  return normalizeOrigin(process.env.FRONTEND_URL || 'http://localhost:3000');
};

export const getInternalFrontendBaseUrl = (): string => {
  return normalizeOrigin(process.env.INTERNAL_FRONTEND_URL || 'http://localhost:3001');
};

export const buildAllowedOrigins = (): string[] => {
  const configured = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return Array.from(
    new Set([
      ...configured,
      getFrontendBaseUrl(),
      ...(process.env.INTERNAL_FRONTEND_URL
        ? [normalizeOrigin(process.env.INTERNAL_FRONTEND_URL)]
        : []),
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ])
  );
};

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (
    normalized.startsWith('http://localhost:') ||
    normalized.startsWith('http://127.0.0.1:')
  ) {
    return true;
  }
  return buildAllowedOrigins().includes(normalized);
};

const extractHostname = (urlValue: string): string => {
  if (!urlValue) return '';
  try {
    return new URL(urlValue).hostname.toLowerCase();
  } catch {
    return '';
  }
};

export const resolvePortalFromHeaders = (params: {
  headerPortal?: unknown;
  origin?: string;
  referer?: string;
}): 'internal' | 'customer' | undefined => {
  if (params.headerPortal === 'internal' || params.headerPortal === 'customer') {
    return params.headerPortal;
  }

  const origin = params.origin || '';
  const referer = params.referer || '';
  const internalUrl = process.env.INTERNAL_FRONTEND_URL
    ? normalizeOrigin(process.env.INTERNAL_FRONTEND_URL)
    : '';
  const frontendUrl = process.env.FRONTEND_URL
    ? normalizeOrigin(process.env.FRONTEND_URL)
    : '';

  const originHost = extractHostname(origin);
  const refererHost = extractHostname(referer);

  if (
    (internalUrl && (origin.startsWith(internalUrl) || referer.startsWith(internalUrl))) ||
    origin.includes(':3001') ||
    referer.includes(':3001') ||
    referer.includes('/staff') ||
    /^(staging-)?ops\./.test(originHost) ||
    /^(staging-)?ops\./.test(refererHost)
  ) {
    return 'internal';
  }

  if (
    (frontendUrl && (origin.startsWith(frontendUrl) || referer.startsWith(frontendUrl))) ||
    origin.includes(':3000') ||
    referer.includes(':3000')
  ) {
    return 'customer';
  }

  return undefined;
};
