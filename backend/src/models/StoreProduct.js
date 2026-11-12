import { Schema, model } from 'mongoose';

const storeProductSchema = new Schema(
  {
    dropshipper: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    precioVenta: { type: Number, required: true, min: [0.01, 'El precio de venta debe ser mayor a 0'] },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeProductSchema.index({ dropshipper: 1, product: 1 }, { unique: true });

export default model('StoreProduct', storeProductSchema);
