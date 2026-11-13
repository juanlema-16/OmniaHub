import { Schema, model } from 'mongoose';
import { METODO_RECARGA, SOLICITUD_ESTADO } from '../utils/constants.js';

const topUpSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    monto: { type: Number, required: true, min: [1, 'El monto debe ser mayor a 0'] },
    metodo: { type: String, enum: METODO_RECARGA, required: true },
    comprobante: String,
    estado: { type: String, enum: SOLICITUD_ESTADO, default: 'PENDIENTE' },
    motivo: { type: String, trim: true },
    revisadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
    revisadoEn: Date,
  },
  { timestamps: true }
);

topUpSchema.index({ estado: 1, createdAt: -1 });
topUpSchema.index({ user: 1, createdAt: -1 });

export default model('TopUp', topUpSchema);
