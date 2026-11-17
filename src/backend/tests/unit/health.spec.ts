import http from 'node:http';
import { AddressInfo } from 'node:net';
import { describe, it, expect, vi, afterEach } from 'vitest';
import app from '../../src/app';
import * as healthService from '../../src/services/health.service';

describe('Health Check Service & HTTP Endpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.CORS_ORIGINS;
  });

  it('returns 200 ok when both database and Redis respond', async () => {
    const result = await healthService.checkHealth({
      checkDb: async () => [{ 1: 1 }],
      checkRedis: async () => 'PONG',
    });

    expect(result.httpStatus).toBe(200);
    expect(result.report.status).toBe('ok');
    expect(result.report.checks).toEqual({
      database: 'up',
      redis: 'up',
    });
  });

  it('returns 200 degraded when database is up but Redis is unavailable', async () => {
    const result = await healthService.checkHealth({
      checkDb: async () => [{ 1: 1 }],
      checkRedis: async () => {
        throw new Error('ECONNREFUSED');
      },
    });

    expect(result.httpStatus).toBe(200);
    expect(result.report.status).toBe('degraded');
    expect(result.report.checks).toEqual({
      database: 'up',
      redis: 'degraded',
    });
  });

  it('returns 503 unhealthy when database check fails', async () => {
    const result = await healthService.checkHealth({
      checkDb: async () => {
        throw new Error('MySQL connection lost');
      },
      checkRedis: async () => 'PONG',
    });

    expect(result.httpStatus).toBe(503);
    expect(result.report.status).toBe('unhealthy');
    expect(result.report.checks.database).toBe('down');
  });

  it('GET /health responds with standard envelope and supports CORS_ORIGINS', async () => {
    process.env.CORS_ORIGINS = 'https://app.example.com, https://admin.example.com';

    vi.spyOn(healthService, 'checkHealth').mockResolvedValue({
      httpStatus: 200,
      report: {
        status: 'ok',
        version: '1.0.0',
        uptimeSeconds: 12,
        checks: { database: 'up', redis: 'up' },
      },
    });

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

    try {
      const { port } = server.address() as AddressInfo;
      const res = await fetch(`http://127.0.0.1:${port}/health`, {
        headers: { Origin: 'https://admin.example.com' },
      });
      const body = (await res.json()) as {
        success: boolean;
        code: number;
        data: { status: string; version: string };
        timestamp: string;
      };

      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe('https://admin.example.com');
      expect(body.success).toBe(true);
      expect(body.code).toBe(200);
      expect(body.data.status).toBe('ok');
      expect(body.timestamp).toBeTruthy();
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
  });
});
