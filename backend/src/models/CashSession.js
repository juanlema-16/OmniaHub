import { Schema, model } from 'mongoose';
import { CASH_SESSION_ESTADO } from '../utils/constants.js';

const cashSessionSchema = new Schema(
  {
    proveedor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    montoInicial: { type: Number, required: true, min: [0, 'El monto inicial no puede ser negativo'] },
    abiertaEn: { type: Date, default: Date.now },
    cerradaEn: Date,
    montoEsperado: { type: Number, min: 0 },
    montoContado: { type: Number, min: 0 },
    diferencia: Number,
    estado: { type: String, enum: CASH_SESSION_ESTADO, default: 'ABIERTA' },
  },
  { timestamps: true }
);

// Solo una caja abierta por proveedor
cashSessionSchema.index(
  { proveedor: 1 },
  { unique: true, partialFilterExpression: { estado: 'ABIERTA' }, name: 'una_caja_abierta' }
);
cashSessionSchema.index({ proveedor: 1, abiertaEn: -1 });

export default model('CashSession', cashSessionSchema);
