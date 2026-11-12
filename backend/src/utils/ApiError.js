export class ApiError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  static badRequest(message = 'Solicitud inválida', errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'No autenticado') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'No tienes permiso para realizar esta acción') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message);
  }

  static conflict(message = 'El recurso ya existe') {
    return new ApiError(409, message);
  }
}
