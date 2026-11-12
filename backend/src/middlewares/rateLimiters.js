import rateLimit from 'express-rate-limit';

const limiter = (limit, message, extra = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { ok: false, message, errors: null },
    ...extra,
  });

// 5 intentos fallidos de login cada 15 minutos por IP
export const loginLimiter = limiter(5, 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos', {
  skipSuccessfulRequests: true,
});

export const verificationLimiter = limiter(10, 'Demasiadas solicitudes de verificación. Intenta de nuevo en 15 minutos');
