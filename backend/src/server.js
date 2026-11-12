import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

const start = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error(`No se pudo conectar a MongoDB Atlas: ${error.message}`);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.info(`API de OmniaHub escuchando en http://localhost:${env.port}/api`);
  });
};

start();
