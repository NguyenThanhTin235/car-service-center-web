import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.util';
import { BLACKLIST_JTI_KEY, TOKEN_INVALID_BEFORE_KEY } from '../services/auth.service';
import { getCache } from '../utils/redis.util';
import prisma from '../utils/prisma';
import { isOriginAllowed, resolvePortalFromHeaders } from '../utils/cors.util';

const STAFF_ROLES = new Set([
  'ADMIN',
  'MANAGER',
  'DESK STAFF',
  'SA',
  'STAFF',
  'SERVICE_ADVISOR',
  'TECHNICIAN',
]);

let io: Server | null = null;

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    const key = part.slice(0, eqIndex).trim();
    const val = part.slice(eqIndex + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
}

function resolvePortal(socket: Socket): 'internal' | 'customer' | undefined {
  const authPortal = socket.handshake.auth?.portal;
  if (authPortal === 'internal' || authPortal === 'customer') return authPortal;

  return resolvePortalFromHeaders({
    headerPortal: socket.handshake.headers['x-portal'],
    origin: socket.handshake.headers.origin,
    referer: socket.handshake.headers.referer,
  });
}

function extractToken(socket: Socket, portal?: 'internal' | 'customer'): string | null {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.startsWith('Bearer ') ? authToken.slice(7).trim() : authToken.trim();
  }

  const authHeader = socket.handshake.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookies = parseCookies(socket.handshake.headers.cookie);
  if (portal === 'internal') {
    return cookies.staff_jwt || null;
  }
  if (portal === 'customer') {
    return cookies.customer_jwt || null;
  }
  return cookies.staff_jwt || cookies.customer_jwt || cookies.jwt || null;
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const portal = resolvePortal(socket);
      const token = extractToken(socket, portal);

      if (!token) {
        return next(new Error('Unauthorized: Missing authentication token'));
      }

      let payload: JwtPayload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        return next(new Error('Unauthorized: Invalid or expired token'));
      }

      if (payload.jti) {
        const isBlacklisted = await getCache(BLACKLIST_JTI_KEY(payload.jti));
        if (isBlacklisted) {
          return next(new Error('Unauthorized: Session has been logged out'));
        }
      }

      const invalidBeforeRaw = await getCache(TOKEN_INVALID_BEFORE_KEY(payload.id));
      if (invalidBeforeRaw && payload.iat && payload.iat < Number(invalidBeforeRaw)) {
        return next(new Error('Unauthorized: Session invalidated after password change'));
      }

      const isRevoked = await getCache(`revoked_user:${payload.id}`);
      if (isRevoked) {
        return next(new Error('Unauthorized: Session has been revoked'));
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          full_name: true,
          is_active: true,
          roles: {
            select: { role: { select: { name: true } } },
          },
        },
      });

      if (!user || !user.is_active) {
        return next(new Error('Unauthorized: Account not found or inactive'));
      }

      const liveRoles = user.roles.map((r) => r.role.name);
      const roles = liveRoles.length > 0 ? liveRoles : payload.roles;

      socket.data.user = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        roles,
      };
      socket.data.portal = portal;

      return next();
    } catch {
      return next(new Error('Unauthorized: Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload | undefined;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${user.id}`);

    const roles = Array.isArray(user.roles) ? user.roles : [];
    for (const roleName of roles) {
      socket.join(`role:${roleName.toUpperCase()}`);
    }

    const hasStaffRole = roles.some((r) => STAFF_ROLES.has(r.toUpperCase()));
    const portal = socket.data.portal as 'internal' | 'customer' | undefined;
    if (portal === 'internal' || (portal !== 'customer' && hasStaffRole)) {
      socket.join('portal:internal');
    } else {
      socket.join('portal:customer');
    }
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToUser(userId: number, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitToRole(role: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`role:${role.toUpperCase()}`).emit(event, payload);
}
