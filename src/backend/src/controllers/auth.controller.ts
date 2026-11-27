import { Request, Response } from 'express';
import { authService, AuthHttpError, LoginLockedError } from '../services/auth.service';
import { resolvePortalFromHeaders } from '../utils/cors.util';
import {
  loginSchema,
  sendOtpRegisterSchema,
  verifyOtpRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpResetSchema,
  updateMeSchema,
  changePasswordSchema,
} from '../dtos/auth.dto';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
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
  return (
    resolvePortalFromHeaders({
      headerPortal: req.headers['x-portal'],
      origin: req.headers.origin,
      referer: req.headers.referer,
    }) || 'customer'
  );
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
    const portal = resolvePortalFromHeaders({
      headerPortal: req.headers['x-portal'],
      origin: req.headers.origin,
      referer: req.headers.referer,
    });

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
    } catch {
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
      const data = await authService.getProfile(req.user!.id);
      res.json({ status: 'success', data });
    } catch (err: any) {
      if (err instanceof AuthHttpError) {
        res.status(err.statusCode).json({ status: 'error', message: err.message });
        return;
      }
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
      const data = await authService.updateProfile(req.user!.id, value);
      res.json({
        status: 'success',
        message: 'Cập nhật hồ sơ thành công.',
        data,
      });
    } catch (err: any) {
      if (err instanceof AuthHttpError) {
        res.status(err.statusCode).json({ status: 'error', message: err.message });
        return;
      }
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
      const { currentPassword, newPassword } = value;
      await authService.changePassword(req.user!.id, currentPassword, newPassword);
      res.json({
        status: 'success',
        message: 'Đổi mật khẩu thành công.',
      });
    } catch (err: any) {
      if (err instanceof AuthHttpError) {
        res.status(err.statusCode).json({ status: 'error', message: err.message });
        return;
      }
      res.status(500).json({ status: 'error', message: err.message || 'Lỗi server.' });
    }
  }
}

export const authController = new AuthController();
