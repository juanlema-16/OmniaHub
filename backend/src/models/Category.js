import { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icono: { type: String, default: 'Tag' },
  },
  { timestamps: true }
);

export default model('Category', categorySchema);
