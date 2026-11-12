import { Schema, model } from 'mongoose';
import { DEPARTAMENTOS } from '../utils/constants.js';

const tarifaSchema = new Schema(
  {
    departamento: { type: String, enum: DEPARTAMENTOS, required: true },
    precio: { type: Number, required: true, min: 0 },
    dias: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const carrierSchema = new Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    logo: String,
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tarifas: { type: [tarifaSchema], default: [] },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

carrierSchema.methods.tarifaPara = function tarifaPara(departamento) {
  return this.tarifas.find((t) => t.departamento === departamento) || null;
};

export default model('Carrier', carrierSchema);
