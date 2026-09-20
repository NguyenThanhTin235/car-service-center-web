import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// UC-03: Login
router.post('/login', authController.login.bind(authController));

// UC-04: Logout (cần authenticate để biết đang logout ai — optional, nhưng good practice)
router.post('/logout', authenticate, authController.logout.bind(authController));

// UC-02: Register (2-step: gửi OTP → verify OTP → tạo account)
router.post('/send-otp-register', authController.sendOtpRegister.bind(authController));
router.post('/verify-otp-register', authController.verifyOtpRegister.bind(authController));
router.post('/resend-otp-register', authController.resendOtpRegister.bind(authController));

// UC-05: Reset Password (2-step: gửi OTP → đổi mật khẩu)
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/resend-otp-reset', authController.resendOtpReset.bind(authController));

export default router;
