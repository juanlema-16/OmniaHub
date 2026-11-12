import { Schema, model } from 'mongoose';
import { DEPARTAMENTOS, TELEFONO_REGEX } from '../utils/constants.js';

const customerSchema = new Schema(
  {
    dropshipper: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    nombres: { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, match: [TELEFONO_REGEX, 'El teléfono debe tener 8 dígitos'] },
    email: { type: String, lowercase: true, trim: true },
    direccion: { type: String, trim: true },
    departamento: { type: String, enum: DEPARTAMENTOS },
    municipio: { type: String, trim: true },
    totalPedidos: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

customerSchema.index({ dropshipper: 1, telefono: 1 }, { unique: true });

export default model('Customer', customerSchema);
