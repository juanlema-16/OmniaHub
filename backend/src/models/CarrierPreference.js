import { Schema, model } from 'mongoose';
import { DEPARTAMENTOS } from '../utils/constants.js';

const carrierPreferenceSchema = new Schema(
  {
    dropshipper: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    departamento: { type: String, enum: DEPARTAMENTOS, required: true },
    carrier: { type: Schema.Types.ObjectId, ref: 'Carrier', required: true },
  },
  { timestamps: true }
);

carrierPreferenceSchema.index({ dropshipper: 1, departamento: 1 }, { unique: true });

export default model('CarrierPreference', carrierPreferenceSchema);
