import { Schema, model } from 'mongoose';
import { TRANSACTION_TIPO, TRANSACTION_CONCEPTO } from '../utils/constants.js';

const transactionSchema = new Schema(
  {
    wallet: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tipo: { type: String, enum: TRANSACTION_TIPO, required: true },
    concepto: { type: String, enum: TRANSACTION_CONCEPTO, required: true },
    monto: { type: Number, required: true, min: [0.01, 'El monto debe ser mayor a 0'] },
    saldoPrevio: { type: Number, required: true },
    saldoNuevo: { type: Number, required: true },
    descripcion: { type: String, trim: true, maxlength: 300 },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ order: 1 });
transactionSchema.index({ concepto: 1 });

export default model('Transaction', transactionSchema);
