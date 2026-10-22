import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.util';
import prisma from '../utils/prisma';

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
  const portal = (req.headers['x-portal'] as string) || 
    (req.headers.referer?.includes(':3001') || req.headers.referer?.includes('/staff') || req.headers.origin?.includes(':3001') ? 'internal' : 
     req.headers.referer?.includes(':3000') || req.headers.origin?.includes(':3000') ? 'customer' : undefined);

  // 3. If no Bearer token, resolve from isolated portal cookies
  if (!token) {
    if (portal === 'internal') {
      token = req.cookies?.staff_jwt;
    } else if (portal === 'customer') {
      token = req.cookies?.customer_jwt;
    }

    // Fallback to legacy jwt cookie if specific portal cookie is not present
    if (!token) {
      token = req.cookies?.jwt || (portal === 'internal' ? req.cookies?.customer_jwt : req.cookies?.staff_jwt);
    }
  }

  if (!token) {
    res.status(401).json({ status: 'error', message: 'Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    
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

    const hasRole = req.user.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      res.status(403).json({ status: 'error', message: 'Bạn không có quyền thực hiện hành động này.' });
      return;
    }

    next();
  };
};
