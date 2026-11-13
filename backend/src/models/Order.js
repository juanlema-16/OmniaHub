import { Schema, model } from 'mongoose';
import { DEPARTAMENTOS, ORDER_STATUS, ORDER_ORIGEN, TIPO_PAGO, TELEFONO_REGEX } from '../utils/constants.js';

const itemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    nombre: { type: String, required: true },
    imagen: String,
    cantidad: { type: Number, required: true, min: [1, 'La cantidad mínima es 1'] },
    precioProveedor: { type: Number, required: true, min: 0 },
    precioVenta: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const historialSchema = new Schema(
  {
    estado: { type: String, enum: ORDER_STATUS, required: true },
    nota: { type: String, trim: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'User' },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    numero: { type: String, required: true, unique: true },
    origen: { type: String, enum: ORDER_ORIGEN, default: 'PANEL' },
    dropshipper: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    proveedor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cliente: {
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      nombres: { type: String, required: true, trim: true },
      apellidos: { type: String, required: true, trim: true },
      telefono: { type: String, required: true, match: [TELEFONO_REGEX, 'El teléfono debe tener 8 dígitos'] },
      email: { type: String, lowercase: true, trim: true },
    },
    destino: {
      departamento: { type: String, enum: DEPARTAMENTOS, required: true },
      municipio: { type: String, required: true, trim: true },
      direccion: { type: String, required: true, trim: true },
      referencias: { type: String, trim: true },
    },
    items: {
      type: [itemSchema],
      validate: { validator: (v) => v.length > 0, message: 'La orden debe tener al menos un producto' },
    },
    tipoPago: { type: String, enum: TIPO_PAGO, required: true },
    transportadora: { type: Schema.Types.ObjectId, ref: 'Carrier', required: true },
    costoEnvio: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    descuento: { type: Number, default: 0, min: 0 },
    cupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    comision: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    gananciaDropshipper: { type: Number, required: true },
    guia: { type: String },
    estado: { type: String, enum: ORDER_STATUS, default: 'PENDIENTE_CONFIRMACION' },
    historial: { type: [historialSchema], default: [] },
    novedad: {
      motivo: String,
      solucion: String,
      activa: { type: Boolean, default: false },
      reportadaEn: Date,
      solucionadaEn: Date,
    },
    montoRecaudado: { type: Number, min: 0 },
    notasProveedor: { type: String, trim: true, maxlength: 500 },
    entregadaEn: Date,
    // Marcas para que stock y dinero se apliquen una sola vez, aunque el admin corrija estados
    efectos: {
      stockDescontado: { type: Boolean, default: false },
      salidaSinRecaudo: { type: Boolean, default: false },
      repartido: { type: Boolean, default: false },
      fleteCobrado: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

orderSchema.index({ guia: 1 }, { unique: true, partialFilterExpression: { guia: { $type: 'string' } } });
orderSchema.index({ dropshipper: 1, estado: 1, createdAt: -1 });
orderSchema.index({ proveedor: 1, estado: 1, createdAt: -1 });
orderSchema.index({ transportadora: 1, estado: 1 });
orderSchema.index({ 'cliente.user': 1, createdAt: -1 });

export default model('Order', orderSchema);
