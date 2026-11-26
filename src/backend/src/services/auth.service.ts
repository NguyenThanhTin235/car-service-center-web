import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  REFRESH_TOKEN_TTL_SECONDS,
  JwtPayload,
} from '../utils/jwt.util';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.util';
import { sendOtpEmail } from '../utils/email.util';
import { setCache, getCache, deleteCache } from '../utils/redis.util';
import {
  BLACKLIST_JTI_KEY,
  TOKEN_INVALID_BEFORE_KEY,
  REFRESH_FAMILY_KEY,
} from '../constants/auth-cache.constant';
import { FULL_NAME_REGEX, FULL_NAME_INVALID_MSG } from '../dtos/auth.dto';

export {
  BLACKLIST_JTI_KEY,
  TOKEN_INVALID_BEFORE_KEY,
  REFRESH_FAMILY_KEY,
} from '../constants/auth-cache.constant';

// Redis key prefix for pending registrations
const REGISTER_KEY = (email: string) => `register:${email}`;
// Redis key prefix for password reset
const RESET_KEY = (email: string) => `reset:${email}`;
// OTP TTL in seconds (5 minutes)
const OTP_TTL = 300;

// Brute-force protection for login
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_SECONDS = 15 * 60; // 15 phút
const LOGIN_FAIL_KEY = (email: string) => `login_fail:${email.toLowerCase()}`;
const LOGIN_LOCK_KEY = (email: string) => `login_lock:${email.toLowerCase()}`;
export const LOGIN_LOCKED_MESSAGE =
  'Bạn đã nhập sai mật khẩu quá số lần cho phép. Vui lòng thử lại sau ít phút hoặc sử dụng tính năng Quên mật khẩu.';

const STAFF_PORTAL_ROLES = new Set([
  'ADMIN',
  'ADMINISTRATOR',
  'MANAGER',
  'DESK STAFF',
  'DESK_STAFF',
  'SA',
  'ADVISOR',
  'STAFF',
  'SERVICE_ADVISOR',
  'TECHNICIAN',
  'QC_STAFF',
  'CASHIER',
]);

export class LoginLockedError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(LOGIN_LOCKED_MESSAGE);
    this.name = 'LoginLockedError';
  }
}

export class AuthHttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AuthHttpError';
  }
}

interface PendingRegistration {
  fullName: string;
  phone: string;
  email: string;
  passwordHash: string;
  otpHash: string;
}

interface PendingReset {
  email: string;
  otpHash: string;
}

export class AuthService {
  // ========================
  // UC-03 Login
  // ========================
  async login(
    email: string,
    passwordPlain: string,
    portal?: 'internal' | 'customer'
  ) {
    // 1. Chặn ngay nếu tài khoản (email) đang bị khóa tạm thời
    const lockedUntilRaw = await getCache(LOGIN_LOCK_KEY(email));
    if (lockedUntilRaw) {
      const remaining = Math.ceil((Number(lockedUntilRaw) - Date.now()) / 1000);
      throw new LoginLockedError(remaining > 0 ? remaining : LOGIN_LOCK_SECONDS);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    // Email không tồn tại cũng tính là một lần sai (chống dò tìm tài khoản)
    if (!user) {
      await this.registerFailedLogin(email);
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    if (!user.is_active) throw new Error('Tài khoản đã bị vô hiệu hóa');

    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      await this.registerFailedLogin(email);
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Đăng nhập thành công → reset bộ đếm
    await deleteCache(LOGIN_FAIL_KEY(email));

    const roles = user.roles.map((r: any) => r.role.name);
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      roles,
    };

    return this.issueSessionTokens(payload, portal);
  }

  private async issueSessionTokens(
    payload: JwtPayload,
    portal?: 'internal' | 'customer'
  ) {
    const familyId = crypto.randomUUID();
    const token = generateAccessToken(payload);
    const { token: refreshToken, jti } = generateRefreshToken({
      id: payload.id,
      familyId,
      portal,
    });

    await setCache(
      REFRESH_FAMILY_KEY(payload.id, familyId),
      jti,
      REFRESH_TOKEN_TTL_SECONDS
    );

    return { token, refreshToken, user: payload };
  }

  /**
   * Tăng bộ đếm đăng nhập sai. Đạt ngưỡng → khóa tạm thời và ném LoginLockedError.
   */
  private async registerFailedLogin(email: string): Promise<void> {
    const raw = await getCache(LOGIN_FAIL_KEY(email));
    const attempts = (raw ? Number(raw) : 0) + 1;

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = Date.now() + LOGIN_LOCK_SECONDS * 1000;
      await setCache(LOGIN_LOCK_KEY(email), String(lockedUntil), LOGIN_LOCK_SECONDS);
      await deleteCache(LOGIN_FAIL_KEY(email));
      throw new LoginLockedError(LOGIN_LOCK_SECONDS);
    }

    await setCache(LOGIN_FAIL_KEY(email), String(attempts), LOGIN_LOCK_SECONDS);
  }

  // ========================
  // Refresh Access Token (with Rotation & Reuse Detection)
  // ========================
  async refreshSession(
    refreshToken: string,
    expectedPortal?: 'internal' | 'customer'
  ) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new Error('Refresh token không hợp lệ hoặc đã hết hạn.');
    }

    if (expectedPortal && decoded.portal && decoded.portal !== expectedPortal) {
      throw new Error('Refresh token không thuộc cổng truy cập này.');
    }

    const isRevoked = await getCache(`revoked_user:${decoded.id}`);
    if (isRevoked) {
      throw new Error('Tài khoản đã bị tạm khóa và phiên đăng nhập bị thu hồi.');
    }

    const invalidBeforeRaw = await getCache(TOKEN_INVALID_BEFORE_KEY(decoded.id));
    if (invalidBeforeRaw && decoded.iat && decoded.iat < Number(invalidBeforeRaw)) {
      throw new Error('Phiên đăng nhập đã hết hiệu lực do thay đổi bảo mật.');
    }

    const familyKey = REFRESH_FAMILY_KEY(decoded.id, decoded.familyId);
    const storedJti = await getCache(familyKey);

    // Reuse detection: token hợp lệ về chữ ký nhưng đã dùng hoặc đã bị xóa
    if (!storedJti || storedJti !== decoded.jti) {
      await deleteCache(familyKey);
      throw new Error('Phiên làm việc đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        is_active: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    });

    if (!user || !user.is_active) {
      await deleteCache(familyKey);
      throw new Error('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    const liveRoles = user.roles.map((r) => r.role.name);
    if (expectedPortal === 'internal') {
      const hasStaffRole = liveRoles.some((r) =>
        STAFF_PORTAL_ROLES.has(r.toUpperCase().trim())
      );
      if (!hasStaffRole) {
        await deleteCache(familyKey);
        throw new Error('Tài khoản khách hàng không có quyền truy cập trang quản trị nội bộ.');
      }
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      roles: liveRoles,
    };

    const nextAccessToken = generateAccessToken(payload);
    const { token: nextRefreshToken, jti: nextJti } = generateRefreshToken({
      id: user.id,
      familyId: decoded.familyId,
      portal: decoded.portal || expectedPortal,
    });

    await setCache(familyKey, nextJti, REFRESH_TOKEN_TTL_SECONDS);

    return { token: nextAccessToken, refreshToken: nextRefreshToken, user: payload };
  }

  // ========================
  // UC-04 Logout (Blacklist Access Token jti + Revoke Refresh Family)
  // ========================
  async logout(params?: {
    accessToken?: string | null;
    refreshToken?: string | null;
  }): Promise<void> {
    if (params?.accessToken) {
      try {
        const decoded = verifyAccessToken(params.accessToken);
        if (decoded.jti) {
          const nowSec = Math.floor(Date.now() / 1000);
          const ttl = decoded.exp ? Math.max(1, decoded.exp - nowSec) : 15 * 60;
          await setCache(BLACKLIST_JTI_KEY(decoded.jti), '1', ttl);
        }
      } catch {
        // Token already expired or invalid — ignore
      }
    }

    if (params?.refreshToken) {
      try {
        const decoded = verifyRefreshToken(params.refreshToken);
        await deleteCache(REFRESH_FAMILY_KEY(decoded.id, decoded.familyId));
      } catch {
        // Refresh token already expired or invalid — ignore
      }
    }
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    const nowSec = Math.floor(Date.now() / 1000);
    await Promise.all([
      setCache(TOKEN_INVALID_BEFORE_KEY(userId), String(nowSec), REFRESH_TOKEN_TTL_SECONDS),
      deleteCache(`user_auth:${userId}`),
    ]);
  }

  // ========================
  // UC-02 Register — Bước 1: Gửi OTP
  // ========================
  async sendOtpForRegister(
    fullName: string,
    phone: string,
    email: string,
    password: string
  ): Promise<void> {
    // Kiểm tra email hoặc số điện thoại trùng (thông báo chung chống dò tìm tài khoản - OWASP)
    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      prisma.user.findUnique({ where: { phone }, select: { id: true } }),
    ]);
    if (existingEmail || existingPhone) {
      throw new Error(
        'Thông tin đăng ký không hợp lệ hoặc không thể sử dụng. Vui lòng kiểm tra lại hoặc thử đăng nhập.'
      );
    }

    // Tạo OTP và hash
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const passwordHash = await bcrypt.hash(password, 12);

    // Lưu pending data vào Redis với TTL 5 phút
    const pendingData: PendingRegistration = { fullName, phone, email, passwordHash, otpHash };
    await setCache(REGISTER_KEY(email), JSON.stringify(pendingData), OTP_TTL);

    // Gửi OTP qua email
    await sendOtpEmail(email, otp, 'register');
  }

  // ========================
  // UC-02 Register — Bước 2: Xác thực OTP & Tạo tài khoản
  // ========================
  async verifyOtpAndCreateUser(email: string, otp: string) {
    const cached = await getCache(REGISTER_KEY(email));
    if (!cached) {
      throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại mã.');
    }

    const pending: PendingRegistration = JSON.parse(cached);
    const isValid = await verifyOtp(otp, pending.otpHash);
    if (!isValid) {
      throw new Error('Mã OTP không đúng. Vui lòng kiểm tra lại.');
    }

    // Tạo user và gán role CUSTOMER trong một transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Tạo user
      const user = await tx.user.create({
        data: {
          email: pending.email,
          phone: pending.phone,
          password_hash: pending.passwordHash,
          full_name: pending.fullName,
          is_active: true,
        },
      });

      // Tìm role CUSTOMER
      const customerRole = await tx.role.findUnique({ where: { name: 'CUSTOMER' } });
      if (!customerRole) throw new Error('Role CUSTOMER không tồn tại trong hệ thống.');

      // Gán role
      await tx.userRole.create({
        data: { user_id: user.id, role_id: customerRole.id },
      });

      return user;
    });

    // Xóa pending data khỏi Redis
    await deleteCache(REGISTER_KEY(email));

    // Tạo JWT và trả về
    const payload: JwtPayload = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      roles: ['CUSTOMER'],
    };
    return this.issueSessionTokens(payload, 'customer');
  }

  // ========================
  // UC-05 Reset Password — Bước 1: Gửi OTP
  // ========================
  async sendOtpForReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Trả về thành công để không lộ email nào tồn tại (security best practice)
      // Nhưng không gửi email
      return;
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    // Lưu pending reset vào Redis
    const pendingReset: PendingReset = { email, otpHash };
    await setCache(RESET_KEY(email), JSON.stringify(pendingReset), OTP_TTL);

    // Gửi OTP
    await sendOtpEmail(email, otp, 'reset');
  }

  // ========================
  // UC-05 Reset Password — Bước 1.5: Kiểm tra OTP (không tiêu hủy mã)
  // ========================
  async verifyResetOtp(email: string, otp: string): Promise<void> {
    const cached = await getCache(RESET_KEY(email));
    if (!cached) {
      throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại mã.');
    }

    const pending: PendingReset = JSON.parse(cached);
    const isValid = await verifyOtp(otp, pending.otpHash);
    if (!isValid) {
      throw new Error('Mã OTP không đúng. Vui lòng kiểm tra lại.');
    }
  }

  // ========================
  // UC-05 Reset Password — Bước 2: Xác thực OTP & Đổi mật khẩu
  // ========================
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const cached = await getCache(RESET_KEY(email));
    if (!cached) {
      throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại mã.');
    }

    const pending: PendingReset = JSON.parse(cached);
    const isValid = await verifyOtp(otp, pending.otpHash);
    if (!isValid) {
      throw new Error('Mã OTP không đúng. Vui lòng kiểm tra lại.');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password_hash: newHash },
      select: { id: true },
    });

    // Xóa pending data
    await deleteCache(RESET_KEY(email));
    // Đặt lại mật khẩu thành công → gỡ khóa đăng nhập tạm thời & thu hồi toàn bộ token cũ
    await deleteCache(LOGIN_LOCK_KEY(email));
    await deleteCache(LOGIN_FAIL_KEY(email));
    await this.revokeAllUserTokens(updatedUser.id);
  }

  // ========================
  // Resend OTP (dùng chung cho register và reset)
  // ========================
  async resendOtpRegister(email: string): Promise<void> {
    const cached = await getCache(REGISTER_KEY(email));
    if (!cached) {
      throw new Error('Không tìm thấy phiên đăng ký. Vui lòng bắt đầu lại.');
    }
    const pending: PendingRegistration = JSON.parse(cached);

    // Tạo OTP mới
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const updated: PendingRegistration = { ...pending, otpHash };
    await setCache(REGISTER_KEY(email), JSON.stringify(updated), OTP_TTL);
    await sendOtpEmail(email, otp, 'register');
  }

  async resendOtpReset(email: string): Promise<void> {
    const cached = await getCache(RESET_KEY(email));
    if (!cached) {
      throw new Error('Không tìm thấy phiên đặt lại mật khẩu. Vui lòng bắt đầu lại.');
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const updated: PendingReset = { email, otpHash };
    await setCache(RESET_KEY(email), JSON.stringify(updated), OTP_TTL);
    await sendOtpEmail(email, otp, 'reset');
  }

  // ========================
  // UC-06: Get own profile
  // ========================
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        phone: true,
        email: true,
        address: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        roles: { select: { role: { select: { name: true } } } },
        employee: {
          select: {
            id: true,
            position: true,
            is_active: true,
            created_at: true,
            skills: {
              select: {
                skill: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new AuthHttpError(404, 'Không tìm thấy người dùng.');
    }

    return {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      email: user.email,
      address: user.address,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      roles: user.roles.map((r) => r.role.name),
      employee: user.employee
        ? {
            id: user.employee.id,
            position: user.employee.position,
            isActive: user.employee.is_active,
            createdAt: user.employee.created_at,
            skills: user.employee.skills.map((s) => s.skill.name),
          }
        : null,
    };
  }

  // ========================
  // UC-06: Update own profile
  // ========================
  async updateProfile(
    userId: number,
    input: { fullName?: string; phone?: string | null; email?: string; address?: string | null }
  ) {
    const { fullName, phone, email, address } = input;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        employee: {
          select: {
            id: true,
            position: true,
            is_active: true,
            created_at: true,
            skills: { select: { skill: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    if (!user) {
      throw new AuthHttpError(404, 'Không tìm thấy người dùng.');
    }

    const userRoles = user.roles.map((r) => r.role.name.toUpperCase());
    const isInternalAccount = userRoles.some((r) => r !== 'CUSTOMER');

    if (isInternalAccount && email !== undefined && email !== user.email) {
      throw new AuthHttpError(
        403,
        'Tài khoản nội bộ không thể tự thay đổi email đăng nhập. Vui lòng liên hệ Quản trị viên.'
      );
    }

    const normalizedPhone = phone === '' ? null : phone;
    const normalizedAddress = address === '' ? null : address;

    // Chỉ kiểm tra ký tự hợp lệ khi họ tên thực sự thay đổi (tránh khóa tài khoản có tên cũ)
    if (fullName !== undefined && fullName !== user.full_name && !FULL_NAME_REGEX.test(fullName)) {
      throw new AuthHttpError(400, FULL_NAME_INVALID_MSG);
    }

    // Validate unique phone if changed and non-null
    if (normalizedPhone !== undefined && normalizedPhone !== null && normalizedPhone !== user.phone) {
      const existPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
      if (existPhone && existPhone.id !== userId) {
        throw new AuthHttpError(
          400,
          'Không thể cập nhật thông tin liên hệ này. Vui lòng kiểm tra lại và thử với thông tin khác.'
        );
      }
    }

    // Validate unique email if changed (customer self-service)
    if (!isInternalAccount && email && email !== user.email) {
      const existEmail = await prisma.user.findUnique({ where: { email } });
      if (existEmail && existEmail.id !== userId) {
        throw new AuthHttpError(
          400,
          'Không thể cập nhật thông tin liên hệ này. Vui lòng kiểm tra lại và thử với thông tin khác.'
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          full_name: fullName !== undefined ? fullName : undefined,
          phone: normalizedPhone !== undefined ? normalizedPhone : undefined,
          email: !isInternalAccount && email !== undefined ? email : undefined,
          address: normalizedAddress !== undefined ? normalizedAddress : undefined,
        },
      });

      if (fullName !== undefined && user.employee) {
        await tx.employee.update({
          where: { id: user.employee.id },
          data: { full_name: fullName },
        });
      }

      return updatedUser;
    });

    return {
      id: updated.id,
      fullName: updated.full_name,
      phone: updated.phone,
      email: updated.email,
      address: updated.address,
      isActive: updated.is_active,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      roles: user.roles.map((r) => r.role.name),
      employee: user.employee
        ? {
            id: user.employee.id,
            position: user.employee.position,
            isActive: user.employee.is_active,
            createdAt: user.employee.created_at,
            skills: user.employee.skills.map((s) => s.skill.name),
          }
        : null,
    };
  }

  // ========================
  // Change own password (authenticated)
  // ========================
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    if (currentPassword === newPassword) {
      throw new AuthHttpError(400, 'Mật khẩu mới không được trùng với mật khẩu hiện tại.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password_hash: true },
    });
    if (!user) {
      throw new AuthHttpError(404, 'Không tìm thấy người dùng.');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new AuthHttpError(400, 'Mật khẩu hiện tại không chính xác.');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash },
    });

    await this.revokeAllUserTokens(userId);
  }
}

export const authService = new AuthService();
