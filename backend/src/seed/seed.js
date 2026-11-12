import { connectDB, disconnectDB } from '../config/db.js';

const run = async () => {
  try {
    await connectDB();
    console.info('Seed: conexión verificada. Aún no hay modelos para poblar.');
  } catch (error) {
    console.error(`Error en el seed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

run();
