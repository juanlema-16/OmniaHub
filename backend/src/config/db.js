import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000 });
  console.info(`MongoDB conectado: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

export const disconnectDB = () => mongoose.disconnect();

export const dbStatus = () => (mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada');
