import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { generateToken, JwtPayload } from '../utils/jwt.util';
import { generateOtp, hashOtp, verifyOtp, isOtpExpired, getOtpExpiresAt } from '../utils/otp.util';
import { sendOtpEmail } from '../utils/email.util';
import { setCache, getCache, deleteCache } from '../utils/redis.util';

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

export class LoginLockedError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(LOGIN_LOCKED_MESSAGE);
    this.name = 'LoginLockedError';
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
  async login(email: string, passwordPlain: string) {
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

    const token = generateToken(payload);
    return { token, user: payload };
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
  // UC-04 Logout
  // ========================
  async logout(): Promise<void> {
    // Stateless JWT: chỉ cần xóa cookie ở controller.
    // Nếu cần blacklist, lưu token vào Redis tại đây.
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
    const token = generateToken(payload);
    return { token, user: payload };
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
    await prisma.user.update({
      where: { email },
      data: { password_hash: newHash },
    });

    // Xóa pending data
    await deleteCache(RESET_KEY(email));
    // Đặt lại mật khẩu thành công → gỡ khóa đăng nhập tạm thời
    await deleteCache(LOGIN_LOCK_KEY(email));
    await deleteCache(LOGIN_FAIL_KEY(email));
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
}

export const authService = new AuthService();
