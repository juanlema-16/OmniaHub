import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({ user, accion, entidad, entidadId, detalle }, session = null) => {
  const [log] = await AuditLog.create([{ user, accion, entidad, entidadId, detalle }], { session });
  return log;
};
