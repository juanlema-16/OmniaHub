import { Schema, model } from 'mongoose';
import { METODO_PAGO_POS } from '../utils/constants.js';

const posItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precio: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const posSaleSchema = new Schema(
  {
    proveedor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cashSession: { type: Schema.Types.ObjectId, ref: 'CashSession', required: true },
    items: {
      type: [posItemSchema],
      validate: { validator: (v) => v.length > 0, message: 'La venta debe tener al menos un producto' },
    },
    total: { type: Number, required: true, min: 0 },
    metodoPago: { type: String, enum: METODO_PAGO_POS, required: true },
    cliente: {
      nombre: { type: String, default: 'Consumidor Final' },
      nit: { type: String, default: 'CF' },
    },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  },
  { timestamps: true }
);

posSaleSchema.index({ proveedor: 1, createdAt: -1 });
posSaleSchema.index({ cashSession: 1 });

export default model('PosSale', posSaleSchema);
