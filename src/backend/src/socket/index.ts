import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken, JwtPayload } from '../utils/jwt.util';
import { getCache } from '../utils/redis.util';
import prisma from '../utils/prisma';

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

  const headerPortal = socket.handshake.headers['x-portal'];
  if (headerPortal === 'internal' || headerPortal === 'customer') return headerPortal;

  const origin = socket.handshake.headers.origin || '';
  const referer = socket.handshake.headers.referer || '';
  if (origin.includes(':3001') || referer.includes(':3001') || referer.includes('/staff')) {
    return 'internal';
  }
  if (origin.includes(':3000') || referer.includes(':3000')) {
    return 'customer';
  }
  return undefined;
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
    return cookies.staff_jwt || cookies.jwt || cookies.customer_jwt || null;
  }
  if (portal === 'customer') {
    return cookies.customer_jwt || cookies.jwt || cookies.staff_jwt || null;
  }
  return cookies.staff_jwt || cookies.customer_jwt || cookies.jwt || null;
}

export function initSocketServer(httpServer: HttpServer): Server {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
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
        payload = verifyToken(token);
      } catch {
        return next(new Error('Unauthorized: Invalid or expired token'));
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
    } catch (err) {
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
