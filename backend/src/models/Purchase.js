import { Schema, model } from 'mongoose';

const purchaseItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    cantidad: { type: Number, required: true, min: [1, 'La cantidad mínima es 1'] },
    costo: { type: Number, required: true, min: [0, 'El costo no puede ser negativo'] },
  },
  { _id: false }
);

const purchaseSchema = new Schema(
  {
    proveedor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    origen: { type: String, required: [true, 'Indica a quién se le compró'], trim: true, maxlength: 120 },
    items: {
      type: [purchaseItemSchema],
      validate: { validator: (v) => v.length > 0, message: 'La compra debe tener al menos un producto' },
    },
    total: { type: Number, required: true, min: 0 },
    notas: { type: String, trim: true },
  },
  { timestamps: true }
);

purchaseSchema.index({ proveedor: 1, createdAt: -1 });

export default model('Purchase', purchaseSchema);
