import { getCache } from '../utils/redis.util';
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.util';
import { BLACKLIST_JTI_KEY, TOKEN_INVALID_BEFORE_KEY } from '../services/auth.service';
import prisma from '../utils/prisma';
import { resolvePortalFromHeaders } from '../utils/cors.util';

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

    // Kiểm tra token đã bị thu hồi khi logout (blacklist jti)
    if (payload.jti) {
      const isBlacklisted = await getCache(BLACKLIST_JTI_KEY(payload.jti));
      if (isBlacklisted) {
        res.status(401).json({ status: 'error', message: 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.' });
        return;
      }
    }

    // Kiểm tra token có phát hành trước thời điểm đổi/đặt lại mật khẩu không
    const invalidBeforeRaw = await getCache(TOKEN_INVALID_BEFORE_KEY(payload.id));
    if (invalidBeforeRaw && payload.iat && payload.iat < Number(invalidBeforeRaw)) {
      res.status(401).json({ status: 'error', message: 'Phiên đăng nhập đã hết hiệu lực do thay đổi bảo mật.' });
      return;
    }

    // Kiểm tra nhanh token đã bị thu hồi do khóa tài khoản chưa
    const isRevoked = await getCache(`revoked_user:${payload.id}`);
    if (isRevoked) {
      res.status(401).json({ status: 'error', message: 'Tài khoản đã bị tạm khóa và phiên đăng nhập bị thu hồi.' });
      return;
    }
    
    // Load fresh roles directly from database to ensure role changes take effect immediately
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        is_active: true,
        roles: {
          select: { role: { select: { name: true } } }
        }
      }
    });

    if (!user || !user.is_active) {
      res.status(401).json({ status: 'error', message: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.' });
      return;
    }

    const liveRoles = user.roles.map((r: any) => r.role.name);

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
