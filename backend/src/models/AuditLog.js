import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    accion: { type: String, required: true, trim: true },
    entidad: { type: String, required: true, trim: true },
    entidadId: { type: Schema.Types.ObjectId },
    detalle: { type: Schema.Types.Mixed },
    fecha: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

auditLogSchema.index({ fecha: -1 });
auditLogSchema.index({ entidad: 1, entidadId: 1 });

export default model('AuditLog', auditLogSchema);
