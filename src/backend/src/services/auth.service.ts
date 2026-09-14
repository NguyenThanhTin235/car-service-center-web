import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { generateToken, JwtPayload } from '../utils/jwt.util';

export class AuthService {
  async login(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    if (!user.is_active) {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

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
}

export const authService = new AuthService();
