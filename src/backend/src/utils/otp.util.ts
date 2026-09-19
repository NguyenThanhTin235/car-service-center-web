import crypto from 'crypto';
import bcrypt from 'bcrypt';

const OTP_EXPIRY_MINUTES = 5;

/**
 * Generate a 6-digit OTP string
 */
export const generateOtp = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash an OTP using bcrypt
 */
export const hashOtp = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10);
};

/**
 * Verify a plain OTP against a bcrypt hash
 */
export const verifyOtp = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};

/**
 * Calculate OTP expiry datetime (now + 5 minutes)
 */
export const getOtpExpiresAt = (): Date => {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + OTP_EXPIRY_MINUTES);
  return expires;
};

/**
 * Check if OTP has expired
 */
export const isOtpExpired = (expiresAt: Date | null): boolean => {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
};
