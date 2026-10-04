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
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) throw new Error('Email hoặc mật khẩu không đúng');
    if (!user.is_active) throw new Error('Tài khoản đã bị vô hiệu hóa');

    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) throw new Error('Email hoặc mật khẩu không đúng');

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
    // Kiểm tra email trùng
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new Error('Email này đã được đăng ký trong hệ thống.');

    // Kiểm tra phone trùng
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) throw new Error('Số điện thoại này đã được đăng ký trong hệ thống.');

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
