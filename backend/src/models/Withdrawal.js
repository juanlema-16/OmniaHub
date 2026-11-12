import { Schema, model } from 'mongoose';
import { SOLICITUD_ESTADO } from '../utils/constants.js';

const withdrawalSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    monto: { type: Number, required: true, min: [1, 'El monto debe ser mayor a 0'] },
    bankAccount: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true },
    concepto: { type: String, required: true, trim: true, maxlength: 200 },
    estado: { type: String, enum: SOLICITUD_ESTADO, default: 'PENDIENTE' },
    motivo: { type: String, trim: true },
    revisadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
    revisadoEn: Date,
  },
  { timestamps: true }
);

withdrawalSchema.index({ estado: 1, createdAt: -1 });
withdrawalSchema.index({ user: 1, createdAt: -1 });

export default model('Withdrawal', withdrawalSchema);
