import { Schema, model } from 'mongoose';
import { BANNER_UBICACION } from '../utils/constants.js';

const bannerSchema = new Schema(
  {
    titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 120 },
    subtitulo: { type: String, trim: true, maxlength: 200 },
    imagen: { type: String, required: [true, 'La imagen es obligatoria'] },
    link: String,
    ubicacion: { type: [String], enum: BANNER_UBICACION, default: ['LANDING', 'PANEL'] },
    inicio: { type: Date, default: Date.now },
    fin: {
      type: Date,
      validate: {
        validator(value) {
          return !value || !this.inicio || value >= this.inicio;
        },
        message: 'La fecha de fin no puede ser anterior a la de inicio',
      },
    },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bannerSchema.index({ activo: 1, inicio: 1, fin: 1 });

export default model('Banner', bannerSchema);
