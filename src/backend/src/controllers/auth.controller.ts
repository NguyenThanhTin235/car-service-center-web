import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { authService, LoginLockedError } from '../services/auth.service';
import prisma from '../utils/prisma';
import {
  loginSchema,
  sendOtpRegisterSchema,
  verifyOtpRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpResetSchema,
  updateMeSchema,
  changePasswordSchema,
  FULL_NAME_REGEX,
  FULL_NAME_INVALID_MSG,
} from '../dtos/auth.dto';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

const ACCESS_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const REFRESH_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function resolvePortal(req: Request): 'internal' | 'customer' {
  const headerPortal = req.headers['x-portal'];
  if (headerPortal === 'internal' || headerPortal === 'customer') {
    return headerPortal;
  }
  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';
  if (referer.includes(':3001') || referer.includes('/staff') || origin.includes(':3001')) {
    return 'internal';
  }
  return 'customer';
}

function setPortalAuthCookies(
  res: Response,
  portal: 'internal' | 'customer',
  accessToken: string,
  refreshToken: string
): void {
  if (portal === 'internal') {
    res.cookie('staff_jwt', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('staff_refresh_jwt', refreshToken, REFRESH_COOKIE_OPTIONS);
  } else {
    res.cookie('customer_jwt', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('customer_refresh_jwt', refreshToken, REFRESH_COOKIE_OPTIONS);
  }
}

export class AuthController {
  // ========================
  // UC-03: Login
  // ========================
  async login(req: Request, res: Response): Promise<void> {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    try {
      const { email, password } = value;
      const portal = resolvePortal(req);
      const { token, refreshToken, user } = await authService.login(email, password, portal);

      setPortalAuthCookies(res, portal, token, refreshToken);

      res.status(200).json({ status: 'success', data: { token, refreshToken, user } });
    } catch (err: any) {
      if (err instanceof LoginLockedError) {
        res.setHeader('Retry-After', String(err.retryAfterSeconds));
        res.status(429).json({
          status: 'error',
          code: 'LOGIN_LOCKED',
          message: err.message,
          retryAfter: err.retryAfterSeconds,
        });
        return;
      }
      res.status(401).json({ status: 'error', message: err.message || 'Xác thực thất bại' });
    }
  }

  // ========================
  // Refresh Access Token
  // ========================
  async refresh(req: Request, res: Response): Promise<void> {
    const portal = resolvePortal(req);
    const cookieRefresh =
      portal === 'internal'
        ? req.cookies?.staff_refresh_jwt
        : req.cookies?.customer_refresh_jwt;
    const refreshToken =
      cookieRefresh ||
      (typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null);

    if (!refreshToken) {
      res.status(401).json({
        status: 'error',
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      });
      return;
    }

    try {
      const { token, refreshToken: nextRefreshToken, user } =
        await authService.refreshSession(refreshToken, portal);

      setPortalAuthCookies(res, portal, token, nextRefreshToken);

      res.status(200).json({
        status: 'success',
        data: { token, refreshToken: nextRefreshToken, user },
      });
    } catch (err: any) {
      if (portal === 'internal') {
        res.clearCookie('staff_jwt', BASE_COOKIE_OPTIONS);
        res.clearCookie('staff_refresh_jwt', BASE_COOKIE_OPTIONS);
      } else {
        res.clearCookie('customer_jwt', BASE_COOKIE_OPTIONS);
        res.clearCookie('customer_refresh_jwt', BASE_COOKIE_OPTIONS);
      }
      res.clearCookie('jwt', BASE_COOKIE_OPTIONS);

      res.status(401).json({
        status: 'error',
        message: err.message || 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
      });
    }
  }

  // ========================
  // UC-04: Logout
  // ========================
  async logout(req: Request, res: Response): Promise<void> {
    const hasPortalHeader = req.headers['x-portal'] === 'internal' || req.headers['x-portal'] === 'customer';
    const portal = hasPortalHeader
      ? (req.headers['x-portal'] as 'internal' | 'customer')
      : req.headers.referer?.includes(':3001') || req.headers.referer?.includes('/staff') || req.headers.origin?.includes(':3001')
      ? 'internal'
      : req.headers.referer?.includes(':3000') || req.headers.origin?.includes(':3000')
      ? 'customer'
      : undefined;

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const accessToken =
      bearerToken ||
      (portal === 'internal'
        ? req.cookies?.staff_jwt
        : portal === 'customer'
        ? req.cookies?.customer_jwt
        : req.cookies?.staff_jwt || req.cookies?.customer_jwt || req.cookies?.jwt);

    const refreshToken =
      (typeof req.body?.refreshToken === 'string' && req.body.refreshToken) ||
      (portal === 'internal'
        ? req.cookies?.staff_refresh_jwt
        : portal === 'customer'
        ? req.cookies?.customer_refresh_jwt
        : req.cookies?.staff_refresh_jwt || req.cookies?.customer_refresh_jwt);

    await authService.logout({ accessToken, refreshToken });

    if (portal === 'internal') {
      res.clearCookie('staff_jwt', BASE_COOKIE_OPTIONS);
      res.clearCookie('staff_refresh_jwt', BASE_COOKIE_OPTIONS);
    } else if (portal === 'customer') {
      res.clearCookie('customer_jwt', BASE_COOKIE_OPTIONS);
      res.clearCookie('customer_refresh_jwt', BASE_COOKIE_OPTIONS);
    } else {
      res.clearCookie('staff_jwt', BASE_COOKIE_OPTIONS);
      res.clearCookie('staff_refresh_jwt', BASE_COOKIE_OPTIONS);
      res.clearCookie('customer_jwt', BASE_COOKIE_OPTIONS);
      res.clearCookie('customer_refresh_jwt', BASE_COOKIE_OPTIONS);
    }
    // Always clear legacy shared jwt cookie so no stale session survives across tabs
    res.clearCookie('jwt', BASE_COOKIE_OPTIONS);

    res.status(200).json({ status: 'success', message: 'Đã đăng xuất thành công.' });
  }

  // ========================
  // UC-02: Send OTP for Registration
  // ========================
  async sendOtpRegister(req: Request, res: Response): Promise<void> {
    const { error, value } = sendOtpRegisterSchema.validate(req.body);
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    try {
      const { fullName, phone, email, password } = value;
      await authService.sendOtpForRegister(fullName, phone, email, password);
      res.status(200).json({
        status: 'success',
        message: `Mã OTP đã được gửi về email ${email}. Vui lòng kiểm tra hộp thư.`,
      });
    } catch (err: any) {
      const isConflict =
        err.message?.includes('không thể sử dụng') ||
        err.message?.includes('đã được đăng ký');
      res.status(isConflict ? 409 : 500).json({ status: 'error', message: err.message });
    }
  }

  // ========================
  // UC-02: Verify OTP & Create User
  // ========================
  async verifyOtpRegister(req: Request, res: Response): Promise<void> {
    const { error, value } = verifyOtpRegisterSchema.validate(req.body);
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    try {
      const { email, otp } = value;
      const { token, refreshToken, user } = await authService.verifyOtpAndCreateUser(email, otp);

      const portal = resolvePortal(req);
      setPortalAuthCookies(res, portal, token, refreshToken);

      res.status(201).json({
        status: 'success',
        message: 'Đăng ký tài khoản thành công!',
        data: { token, refreshToken, user },
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  // ========================
  // UC-02: Resend OTP (Register)
  // ========================
  async resendOtpRegister(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp email.' });
      return;
    }
    try {
      await authService.resendOtpRegister(email);
      res.status(200).json({ status: 'success', message: 'Mã OTP mới đã được gửi.' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  // ========================
  // UC-05: Forgot Password (Send OTP)
  // ========================
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    try {
      await authService.sendOtpForReset(value.email);
      // Always return 200 to not leak which emails exist
      res.status(200).json({
        status: 'success',
        message:
          'Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi trong vài giây.',
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: 'Đã xảy ra lỗi. Vui lòng thử lại.' });
    }
  }

  // ========================
  // UC-05: Verify Reset OTP (kiểm tra trước khi sang trang đặt mật khẩu)
  // ========================
  async verifyOtpReset(req: Request, res: Response): Promise<void> {
    const { error, value } = verifyOtpResetSchema.validate(req.body);
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    try {
      await authService.verifyResetOtp(value.email, value.otp);
      res.status(200).json({ status: 'success', message: 'Mã OTP hợp lệ.' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  // ========================
  // UC-05: Reset Password
  // ========================
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    try {
      const { email, otp, newPassword } = value;
      await authService.resetPassword(email, otp, newPassword);
      res.status(200).json({
        status: 'success',
        message: 'Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập lại.',
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  // ========================
  // UC-05: Resend OTP (Reset)
  // ========================
  async resendOtpReset(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp email.' });
      return;
    }
    try {
      await authService.resendOtpReset(email);
      res.status(200).json({ status: 'success', message: 'Mã OTP mới đã được gửi.' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  }

  // ========================
  // UC-06: Get own profile
  // ========================
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
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
        res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng.' });
        return;
      }
      res.json({
        status: 'success',
        data: {
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
        },
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message || 'Lỗi server.' });
    }
  }

  // ========================
  // UC-06: Update own profile
  // ========================
  async updateMe(req: Request, res: Response): Promise<void> {
    const { error, value } = updateMeSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    try {
      const userId = req.user!.id;
      const { fullName, phone, email, address } = value;

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
        res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng.' });
        return;
      }

      const userRoles = user.roles.map((r) => r.role.name.toUpperCase());
      const isInternalAccount = userRoles.some((r) => r !== 'CUSTOMER');

      if (isInternalAccount && email !== undefined && email !== user.email) {
        res.status(403).json({
          status: 'error',
          message: 'Tài khoản nội bộ không thể tự thay đổi email đăng nhập. Vui lòng liên hệ Quản trị viên.',
        });
        return;
      }

      const normalizedPhone = phone === '' ? null : phone;
      const normalizedAddress = address === '' ? null : address;

      // Chỉ kiểm tra ký tự hợp lệ khi họ tên thực sự thay đổi (tránh khóa tài khoản có tên cũ)
      if (fullName !== undefined && fullName !== user.full_name && !FULL_NAME_REGEX.test(fullName)) {
        res.status(400).json({ status: 'error', message: FULL_NAME_INVALID_MSG });
        return;
      }

      // Validate unique phone if changed and non-null
      if (normalizedPhone !== undefined && normalizedPhone !== null && normalizedPhone !== user.phone) {
        const existPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
        if (existPhone && existPhone.id !== userId) {
          res.status(400).json({
            status: 'error',
            message: 'Không thể cập nhật thông tin liên hệ này. Vui lòng kiểm tra lại và thử với thông tin khác.',
          });
          return;
        }
      }

      // Validate unique email if changed (customer self-service)
      if (!isInternalAccount && email && email !== user.email) {
        const existEmail = await prisma.user.findUnique({ where: { email } });
        if (existEmail && existEmail.id !== userId) {
          res.status(400).json({
            status: 'error',
            message: 'Không thể cập nhật thông tin liên hệ này. Vui lòng kiểm tra lại và thử với thông tin khác.',
          });
          return;
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

      res.json({
        status: 'success',
        message: 'Cập nhật hồ sơ thành công.',
        data: {
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
        },
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message || 'Lỗi server.' });
    }
  }

  // ========================
  // Change own password (authenticated)
  // ========================
  async changePassword(req: Request, res: Response): Promise<void> {
    const { error, value } = changePasswordSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      res.status(400).json({ status: 'error', message: error.details[0].message });
      return;
    }

    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = value;

      if (currentPassword === newPassword) {
        res.status(400).json({
          status: 'error',
          message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password_hash: true },
      });
      if (!user) {
        res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        res.status(400).json({ status: 'error', message: 'Mật khẩu hiện tại không chính xác.' });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password_hash: newHash },
      });

      await authService.revokeAllUserTokens(userId);

      res.json({
        status: 'success',
        message: 'Đổi mật khẩu thành công.',
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message || 'Lỗi server.' });
    }
  }
}

export const authController = new AuthController();
