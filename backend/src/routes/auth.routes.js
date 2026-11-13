import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { loginLimiter, verificationLimiter } from '../middlewares/rateLimiters.js';
import { loginSchema, registerSchema, resendCodeSchema, verifyEmailSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/verify-email', verificationLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmail);
router.post('/resend-code', verificationLimiter, validate({ body: resendCodeSchema }), authController.resendCode);
router.post('/login', loginLimiter, validate({ body: loginSchema }), authController.login);
router.get('/me', auth, authController.me);

export default router;
