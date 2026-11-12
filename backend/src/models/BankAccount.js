import { Schema, model } from 'mongoose';
import { BANCOS, TIPO_CUENTA } from '../utils/constants.js';

const bankAccountSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    banco: { type: String, enum: BANCOS, required: true },
    tipoCuenta: { type: String, enum: TIPO_CUENTA, required: true },
    numeroCuenta: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{6,20}$/, 'El número de cuenta debe tener entre 6 y 20 dígitos'],
    },
    titular: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true }
);

bankAccountSchema.index({ user: 1, numeroCuenta: 1 }, { unique: true });

export default model('BankAccount', bankAccountSchema);
