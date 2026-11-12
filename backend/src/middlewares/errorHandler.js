import { ZodError } from 'zod';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const notFound = (req, res, next) => {
  next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Error interno del servidor';
  let errors = null;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Datos inválidos';
    errors = err.issues.map((issue) => ({ campo: issue.path.join('.'), mensaje: issue.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Identificador inválido: ${err.value}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Datos inválidos';
    errors = Object.values(err.errors).map((e) => ({ campo: e.path, mensaje: e.message }));
  } else if (err.code === 11000) {
    status = 409;
    const campo = Object.keys(err.keyValue || {})[0];
    message = campo ? `Ya existe un registro con ese ${campo}` : 'Registro duplicado';
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo es demasiado grande' : 'Error al subir el archivo';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la solicitud no es un JSON válido';
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    ok: false,
    message,
    errors,
    ...(env.isDev && status >= 500 ? { stack: err.stack } : {}),
  });
};
