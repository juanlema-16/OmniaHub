import { Schema, model } from 'mongoose';

const favoriteSchema = new Schema(
  {
    dropshipper: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ dropshipper: 1, product: 1 }, { unique: true });

export default model('Favorite', favoriteSchema);
