import { Schema, model } from 'mongoose';

const invoiceItemSchema = new Schema(
  {
    descripcion: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    numero: { type: String, required: true, unique: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    posSale: { type: Schema.Types.ObjectId, ref: 'PosSale' },
    emisor: {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      nombre: { type: String, required: true },
      nit: { type: String, default: 'CF' },
    },
    receptor: {
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      nombre: { type: String, required: true, default: 'Consumidor Final' },
      nit: { type: String, default: 'CF' },
    },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    descuento: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

invoiceSchema.index({ order: 1 }, { unique: true, partialFilterExpression: { order: { $exists: true } } });
invoiceSchema.index({ 'emisor.user': 1, fecha: -1 });
invoiceSchema.index({ 'receptor.user': 1, fecha: -1 });

export default model('Invoice', invoiceSchema);
