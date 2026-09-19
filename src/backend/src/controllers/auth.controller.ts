import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import {
  loginSchema,
  sendOtpRegisterSchema,
  verifyOtpRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../dtos/auth.dto';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

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
      const { token, user } = await authService.login(email, password);
      res.cookie('jwt', token, COOKIE_OPTIONS);
      res.status(200).json({ status: 'success', data: { token, user } });
    } catch (err: any) {
      res.status(401).json({ status: 'error', message: err.message || 'Xác thực thất bại' });
    }
  }

  // ========================
  // UC-04: Logout
  // ========================
  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
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
      const isConflict = err.message?.includes('đã được đăng ký');
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
      const { token, user } = await authService.verifyOtpAndCreateUser(email, otp);
      res.cookie('jwt', token, COOKIE_OPTIONS);
      res.status(201).json({
        status: 'success',
        message: 'Đăng ký tài khoản thành công!',
        data: { token, user },
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
}

export const authController = new AuthController();
