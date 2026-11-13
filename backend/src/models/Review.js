import { Schema, model } from 'mongoose';

const reviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    cliente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: [true, 'La calificación es obligatoria'], min: [1, 'La calificación mínima es 1'], max: [5, 'La calificación máxima es 5'] },
    comentario: { type: String, required: [true, 'El comentario es obligatorio'], trim: true, minlength: 3, maxlength: 500 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Una reseña por producto y orden
reviewSchema.index({ cliente: 1, product: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1, visible: 1, createdAt: -1 });

export default model('Review', reviewSchema);
