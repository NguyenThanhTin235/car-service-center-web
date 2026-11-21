import { afterEach, describe, expect, it } from 'vitest';
import {
  buildAllowedOrigins,
  getFrontendBaseUrl,
  getInternalFrontendBaseUrl,
  isOriginAllowed,
  resolvePortalFromHeaders,
} from '../../src/utils/cors.util';

describe('cors.util (Multi-Origin CORS & Portal Resolution)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('includes CORS_ORIGINS, FRONTEND_URL, and INTERNAL_FRONTEND_URL in allowed origins', () => {
    process.env.CORS_ORIGINS = 'https://staging.carservice.id.vn/, https://staging-ops.carservice.id.vn';
    process.env.FRONTEND_URL = 'https://staging.carservice.id.vn/';
    process.env.INTERNAL_FRONTEND_URL = 'https://staging-ops.carservice.id.vn/';

    const origins = buildAllowedOrigins();
    expect(origins).toContain('https://staging.carservice.id.vn');
    expect(origins).toContain('https://staging-ops.carservice.id.vn');
    expect(getFrontendBaseUrl()).toBe('https://staging.carservice.id.vn');
    expect(getInternalFrontendBaseUrl()).toBe('https://staging-ops.carservice.id.vn');

    expect(isOriginAllowed('https://staging.carservice.id.vn')).toBe(true);
    expect(isOriginAllowed('https://staging-ops.carservice.id.vn')).toBe(true);
    expect(isOriginAllowed('https://evil.example.com')).toBe(false);
    expect(isOriginAllowed(undefined)).toBe(true);
  });

  it('resolves internal vs customer portal from headers, env URLs, ops hostname, and dev ports', () => {
    process.env.FRONTEND_URL = 'https://staging.carservice.id.vn';
    process.env.INTERNAL_FRONTEND_URL = 'https://staging-ops.carservice.id.vn';

    expect(
      resolvePortalFromHeaders({ headerPortal: 'internal', origin: 'https://staging.carservice.id.vn' })
    ).toBe('internal');

    expect(
      resolvePortalFromHeaders({ origin: 'https://staging-ops.carservice.id.vn' })
    ).toBe('internal');

    expect(
      resolvePortalFromHeaders({ origin: 'https://ops.carservice.id.vn' })
    ).toBe('internal');

    expect(
      resolvePortalFromHeaders({ origin: 'https://staging.carservice.id.vn' })
    ).toBe('customer');

    expect(
      resolvePortalFromHeaders({ referer: 'http://localhost:3001/advisor' })
    ).toBe('internal');

    expect(
      resolvePortalFromHeaders({ referer: 'http://localhost:3000/customer' })
    ).toBe('customer');
  });
});
