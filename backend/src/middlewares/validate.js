import { ApiError } from '../utils/ApiError.js';

const formatIssues = (issues) => issues.map((issue) => ({ campo: issue.path.join('.'), mensaje: issue.message }));

// Valida body, query y params con zod. Los datos limpios quedan en req.validated
// (en Express 5 req.query es de solo lectura); el body también se reemplaza.
export const validate = (schemas) => (req, res, next) => {
  req.validated = req.validated || {};
  for (const key of ['params', 'query', 'body']) {
    if (!schemas[key]) continue;
    const result = schemas[key].safeParse(req[key] ?? {});
    if (!result.success) return next(ApiError.badRequest('Datos inválidos', formatIssues(result.error.issues)));
    req.validated[key] = result.data;
  }
  if (req.validated.body) req.body = req.validated.body;
  next();
};
