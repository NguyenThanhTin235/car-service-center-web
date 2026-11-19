import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production.');
    }
    return 'fallback_secret_key_for_development';
  }
  return secret;
};

const getRefreshSecret = (): string => {
  return process.env.JWT_REFRESH_SECRET || getJwtSecret();
};

export const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
export const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface JwtPayload {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  jti?: string;
  type?: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: number;
  familyId: string;
  portal?: 'internal' | 'customer';
  jti: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  const tokenPayload: JwtPayload = {
    id: payload.id,
    email: payload.email,
    fullName: payload.fullName,
    roles: payload.roles,
    jti: crypto.randomUUID(),
    type: 'access',
  };
  return jwt.sign(tokenPayload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (params: {
  id: number;
  familyId: string;
  portal?: 'internal' | 'customer';
}): { token: string; jti: string } => {
  const jti = crypto.randomUUID();
  const payload: RefreshTokenPayload = {
    id: params.id,
    familyId: params.familyId,
    portal: params.portal,
    jti,
    type: 'refresh',
  };
  const token = jwt.sign(payload, getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as any,
  });
  return { token, jti };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload & { type?: string };
  if (decoded.type && decoded.type !== 'access') {
    throw new Error('Invalid token type: expected access token');
  }
  return decoded;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, getRefreshSecret()) as RefreshTokenPayload;
  if (decoded.type !== 'refresh' || !decoded.familyId || !decoded.jti) {
    throw new Error('Invalid token type: expected refresh token');
  }
  return decoded;
};

// Backward-compatible aliases
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;
