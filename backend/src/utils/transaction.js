import mongoose from 'mongoose';

// Ejecuta fn dentro de una transacción de MongoDB (todo o nada) y devuelve su resultado
export const withTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};
