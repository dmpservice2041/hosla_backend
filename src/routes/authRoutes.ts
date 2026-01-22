import express from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { otpRateLimiter, otpIpRateLimiter } from '../middlewares/rateLimiter';
import { requestOtpSchema, verifyOtpSchema, refreshTokenSchema } from '../validations/authValidation';

const router = express.Router();

router.post('/request-otp', otpIpRateLimiter, otpRateLimiter, validate(requestOtpSchema), AuthController.requestOtp);
router.post('/verify-otp', validate(verifyOtpSchema), AuthController.verifyOtp);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refreshTokens);
router.post('/logout', AuthController.logout);

export default router;
