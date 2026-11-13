import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { dbStatus } from './config/db.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { ok: false, message: 'Demasiadas solicitudes, intenta de nuevo en unos minutos' },
  })
);

// Documentos KYC y comprobantes de pago son privados: solo se entregan por la API con autenticación
const privado = (req, res, next) => next(ApiError.notFound('Archivo no encontrado'));
app.use('/uploads/kyc', privado);
app.use('/uploads/comprobantes', privado);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    data: { status: 'ok', db: dbStatus(), uptime: Math.round(process.uptime()) },
    message: 'API de OmniaHub funcionando',
  });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
