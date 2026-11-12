import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Faltan variables de entorno: ${missing.join(', ')}. Copia backend/.env.example a backend/.env y complétalas.`
  );
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
