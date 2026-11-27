import * as redisUtil from '../utils/redis.util';
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.util';
import {
  BLACKLIST_JTI_KEY,
  TOKEN_INVALID_BEFORE_KEY,
  USER_AUTH_CACHE_KEY,
} from '../constants/auth-cache.constant';
import prisma from '../utils/prisma';
import { resolvePortalFromHeaders } from '../utils/cors.util';

export { USER_AUTH_CACHE_KEY } from '../constants/auth-cache.constant';
const USER_AUTH_CACHE_TTL_SECONDS = 60;

const isUserAuthCacheEnabled = (): boolean =>
  process.env.ENABLE_AUTH_USER_CACHE === 'true' ||
  (process.env.NODE_ENV !== 'test' && process.env.ENABLE_AUTH_USER_CACHE !== 'false');

async function readCacheBatch(keys: string[]): Promise<(string | null)[]> {
  try {
    if (
      Object.prototype.hasOwnProperty.call(redisUtil, 'mgetCache') &&
      typeof (redisUtil as { mgetCache?: (k: string[]) => Promise<(string | null)[]> }).mgetCache === 'function'
    ) {
      return await (redisUtil as { mgetCache: (k: string[]) => Promise<(string | null)[]> }).mgetCache(keys);
    }
  } catch {
    // Fall back to parallel getCache when mocked in tests without mgetCache
  }
  return Promise.all(keys.map((k) => (k ? redisUtil.getCache(k) : Promise.resolve(null))));
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authenticate user via HttpOnly cookie JWT
 * Sets req.user if valid and loads fresh roles from database
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // 1. Check Bearer token from Authorization header first (isolated per frontend origin via localStorage)
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // 2. Determine portal context
  const portal = resolvePortalFromHeaders({
    headerPortal: req.headers['x-portal'],
    origin: req.headers.origin,
    referer: req.headers.referer,
  });

  // 3. If no Bearer token, resolve from strictly isolated portal cookies (no cross-portal fallback)
  if (!token) {
    if (portal === 'internal') {
      token = req.cookies?.staff_jwt;
    } else if (portal === 'customer') {
      token = req.cookies?.customer_jwt;
    } else {
      token = req.cookies?.staff_jwt || req.cookies?.customer_jwt || req.cookies?.jwt;
    }
  }

  if (!token) {
    res.status(401).json({ status: 'error', message: 'Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const cacheUserAuth = isUserAuthCacheEnabled();

    const batchKeys = [
      payload.jti ? BLACKLIST_JTI_KEY(payload.jti) : '',
      TOKEN_INVALID_BEFORE_KEY(payload.id),
      `revoked_user:${payload.id}`,
      ...(cacheUserAuth ? [USER_AUTH_CACHE_KEY(payload.id)] : []),
    ];
    const [isBlacklisted, invalidBeforeRaw, isRevoked, cachedUserAuthRaw] =
      await readCacheBatch(batchKeys);

    // Kiểm tra token đã bị thu hồi khi logout (blacklist jti)
    if (payload.jti && isBlacklisted) {
      res.status(401).json({ status: 'error', message: 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.' });
      return;
    }

    // Kiểm tra token có phát hành trước thời điểm đổi/đặt lại mật khẩu không
    if (invalidBeforeRaw && payload.iat && payload.iat < Number(invalidBeforeRaw)) {
      res.status(401).json({ status: 'error', message: 'Phiên đăng nhập đã hết hiệu lực do thay đổi bảo mật.' });
      return;
    }

    // Kiểm tra nhanh token đã bị thu hồi do khóa tài khoản chưa
    if (isRevoked) {
      res.status(401).json({ status: 'error', message: 'Tài khoản đã bị tạm khóa và phiên đăng nhập bị thu hồi.' });
      return;
    }

    let isActive = false;
    let liveRoles: string[] = [];

    if (cacheUserAuth && cachedUserAuthRaw) {
      try {
        const parsed = JSON.parse(cachedUserAuthRaw) as { isActive: boolean; roles: string[] };
        isActive = Boolean(parsed.isActive);
        liveRoles = Array.isArray(parsed.roles) ? parsed.roles : [];
      } catch {
        // Ignore malformed cache entry and fall back to DB
      }
    }

    if (!cacheUserAuth || !cachedUserAuthRaw) {
      // Load fresh roles directly from database to ensure role changes take effect immediately
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          is_active: true,
          roles: {
            select: { role: { select: { name: true } } },
          },
        },
      });

      if (!user || !user.is_active) {
        res.status(401).json({ status: 'error', message: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.' });
        return;
      }

      isActive = user.is_active;
      liveRoles = user.roles.map((r: any) => r.role.name);

      if (cacheUserAuth && typeof redisUtil.setCache === 'function') {
        void redisUtil.setCache(
          USER_AUTH_CACHE_KEY(payload.id),
          JSON.stringify({ isActive, roles: liveRoles }),
          USER_AUTH_CACHE_TTL_SECONDS
        ).catch(() => {});
      }
    }

    if (!isActive) {
      res.status(401).json({ status: 'error', message: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.' });
      return;
    }

    // If request is directed to internal management portal, enforce staff role
    if (portal === 'internal') {
      const hasStaffRole = liveRoles.some((r: string) => 
        ['ADMIN', 'MANAGER', 'DESK STAFF', 'SA', 'STAFF', 'SERVICE_ADVISOR', 'TECHNICIAN'].includes(r.toUpperCase())
      );
      if (!hasStaffRole) {
        res.status(403).json({ status: 'error', message: 'Tài khoản khách hàng không có quyền truy cập trang quản trị nội bộ.' });
        return;
      }
    }

    req.user = {
      ...payload,
      roles: liveRoles.length > 0 ? liveRoles : payload.roles
    };
    next();
  } catch {
    res.status(401).json({ status: 'error', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
};

function sendOptionalAuthError(
  res: Response,
  errorCode: 'TOKEN_EXPIRED' | 'SESSION_REVOKED' | 'UNAUTHORIZED',
  message: string
): void {
  res.status(401).json({
    success: false,
    code: 401,
    message,
    error: { code: errorCode },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Optional authentication for public/customer dual-mode endpoints (e.g. AI chat).
 * - No token -> req.user = undefined, next() (Guest mode)
 * - Explicit Bearer token expired/revoked -> HTTP 401 so frontend interceptor can auto-refresh
 * - Stale/invalid cookie without Bearer header -> degrades cleanly to Guest mode
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const isBearerToken = Boolean(bearerToken);

  const portal = resolvePortalFromHeaders({
    headerPortal: req.headers['x-portal'],
    origin: req.headers.origin,
    referer: req.headers.referer,
  });

  let token: string | null = bearerToken;
  if (!token) {
    if (portal === 'customer') {
      token = req.cookies?.customer_jwt || null;
    } else {
      token = req.cookies?.customer_jwt || req.cookies?.jwt || null;
    }
  }

  if (!token) {
    req.user = undefined;
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const cacheUserAuth = isUserAuthCacheEnabled();
    const [isBlacklisted, invalidBeforeRaw, isRevoked, cachedUserAuthRaw] =
      await readCacheBatch([
        payload.jti ? BLACKLIST_JTI_KEY(payload.jti) : '',
        TOKEN_INVALID_BEFORE_KEY(payload.id),
        `revoked_user:${payload.id}`,
        ...(cacheUserAuth ? [USER_AUTH_CACHE_KEY(payload.id)] : []),
      ]);

    if (payload.jti && isBlacklisted) {
      if (isBearerToken) {
        sendOptionalAuthError(res, 'SESSION_REVOKED', 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');
        return;
      }
      req.user = undefined;
      next();
      return;
    }

    if (invalidBeforeRaw && payload.iat && payload.iat < Number(invalidBeforeRaw)) {
      if (isBearerToken) {
        sendOptionalAuthError(res, 'SESSION_REVOKED', 'Phiên đăng nhập đã hết hiệu lực do thay đổi bảo mật.');
        return;
      }
      req.user = undefined;
      next();
      return;
    }

    if (isRevoked) {
      if (isBearerToken) {
        sendOptionalAuthError(res, 'SESSION_REVOKED', 'Tài khoản đã bị tạm khóa và phiên đăng nhập bị thu hồi.');
        return;
      }
      req.user = undefined;
      next();
      return;
    }

    let isActive = false;
    let liveRoles: string[] = [];

    if (cacheUserAuth && cachedUserAuthRaw) {
      try {
        const parsed = JSON.parse(cachedUserAuthRaw) as { isActive: boolean; roles: string[] };
        isActive = Boolean(parsed.isActive);
        liveRoles = Array.isArray(parsed.roles) ? parsed.roles : [];
      } catch {}
    }

    if (!cacheUserAuth || !cachedUserAuthRaw) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          is_active: true,
          roles: {
            select: { role: { select: { name: true } } },
          },
        },
      });

      if (!user || !user.is_active) {
        if (isBearerToken) {
          sendOptionalAuthError(res, 'UNAUTHORIZED', 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
          return;
        }
        req.user = undefined;
        next();
        return;
      }

      isActive = user.is_active;
      liveRoles = user.roles.map((r: any) => r.role.name);

      if (cacheUserAuth && typeof redisUtil.setCache === 'function') {
        void redisUtil.setCache(
          USER_AUTH_CACHE_KEY(payload.id),
          JSON.stringify({ isActive, roles: liveRoles }),
          USER_AUTH_CACHE_TTL_SECONDS
        ).catch(() => {});
      }
    }

    if (!isActive) {
      if (isBearerToken) {
        sendOptionalAuthError(res, 'UNAUTHORIZED', 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
        return;
      }
      req.user = undefined;
      next();
      return;
    }

    req.user = {
      ...payload,
      roles: liveRoles.length > 0 ? liveRoles : payload.roles,
    };
    next();
  } catch (err: any) {
    if (isBearerToken) {
      const errorCode = err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED';
      sendOptionalAuthError(
        res,
        errorCode,
        errorCode === 'TOKEN_EXPIRED'
          ? 'Phiên đăng nhập đã hết hạn.'
          : 'Phiên đăng nhập không hợp lệ.'
      );
      return;
    }
    req.user = undefined;
    next();
  }
};

/**
 * Authorize by role(s)
 * Usage: authorize('ADMIN') or authorize('ADMIN', 'MANAGER')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Chưa xác thực.' });
      return;
    }

    const normalizedRequired = roles.map((r) => r.toUpperCase().trim());
    const hasRole = req.user.roles.some((r) => normalizedRequired.includes(r.toUpperCase().trim()));
    if (!hasRole) {
      res.status(403).json({ status: 'error', message: 'Bạn không có quyền thực hiện hành động này.' });
      return;
    }

    next();
  };
};
