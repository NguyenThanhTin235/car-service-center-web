import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { loginSchema } from '../dtos/auth.dto';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({ status: 'error', message: error.details[0].message });
        return;
      }

      const { email, password } = value;
      const { token, user } = await authService.login(email, password);

      // Set JWT into HttpOnly cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: 'success',
        data: { token, user },
      });
    } catch (err: any) {
      res.status(401).json({ status: 'error', message: err.message || 'Xác thực thất bại' });
    }
  }
}

export const authController = new AuthController();
