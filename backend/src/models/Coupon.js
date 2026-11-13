import { Schema, model } from 'mongoose';
import { COUPON_TIPO } from '../utils/constants.js';

const couponSchema = new Schema(
  {
    dropshipper: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    codigo: { type: String, required: [true, 'El código es obligatorio'], uppercase: true, trim: true, maxlength: 30 },
    tipo: { type: String, enum: COUPON_TIPO, required: true },
    valor: {
      type: Number,
      required: true,
      min: [0.01, 'El valor debe ser mayor a 0'],
      validate: {
        validator(value) {
          return this.tipo !== 'PORCENTAJE' || value <= 100;
        },
        message: 'El porcentaje no puede ser mayor a 100',
      },
    },
    minimoCompra: { type: Number, default: 0, min: 0 },
    usosMaximos: { type: Number, default: null, min: 1 },
    usos: { type: Number, default: 0, min: 0 },
    venceEn: { type: Date },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ dropshipper: 1, codigo: 1 }, { unique: true });

export default model('Coupon', couponSchema);
