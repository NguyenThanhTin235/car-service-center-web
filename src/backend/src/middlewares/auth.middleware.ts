import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.util';

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
 * Sets req.user if valid
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.jwt;

  if (!token) {
    res.status(401).json({ status: 'error', message: 'Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
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
