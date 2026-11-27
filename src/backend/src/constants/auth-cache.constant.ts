export const BLACKLIST_JTI_KEY = (jti: string) => `bl_jti:${jti}`;
export const TOKEN_INVALID_BEFORE_KEY = (userId: number) => `token_invalid_before:${userId}`;
export const REFRESH_FAMILY_KEY = (userId: number, familyId: string) =>
  `rt_family:${userId}:${familyId}`;
export const USER_AUTH_CACHE_KEY = (userId: number) => `user_auth:${userId}`;
