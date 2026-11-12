import { Schema, model } from 'mongoose';
import { POLICY_SLUGS } from '../utils/constants.js';

const policySchema = new Schema(
  {
    slug: { type: String, enum: POLICY_SLUGS, required: true, unique: true },
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    contenido: { type: String, required: true },
    actualizadoEn: { type: Date, default: Date.now },
    actualizadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default model('Policy', policySchema);
