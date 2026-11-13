import { Schema, model } from 'mongoose';

const productSchema = new Schema(
  {
    proveedor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 120 },
    sku: { type: String, required: [true, 'El SKU es obligatorio'], unique: true, uppercase: true, trim: true },
    descripcion: { type: String, trim: true, maxlength: 2000 },
    categoria: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    imagenes: { type: [String], default: [] },
    precioProveedor: { type: Number, required: true, min: [0.01, 'El precio proveedor debe ser mayor a 0'] },
    precioSugerido: {
      type: Number,
      required: true,
      validate: {
        validator(value) {
          return value >= this.precioProveedor;
        },
        message: 'El precio sugerido no puede ser menor al precio proveedor',
      },
    },
    stock: { type: Number, default: 0, min: [0, 'El stock no puede ser negativo'] },
    stockMinimo: { type: Number, default: 5, min: 0 },
    bodega: { type: String, trim: true },
    activo: { type: Boolean, default: true },
    verificado: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('stockBajo').get(function stockBajo() {
  return this.stock <= this.stockMinimo;
});

productSchema.index({ proveedor: 1, activo: 1 });
productSchema.index({ categoria: 1, activo: 1 });
productSchema.index({ nombre: 'text', descripcion: 'text' });

export default model('Product', productSchema);
