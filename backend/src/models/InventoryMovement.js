import { Schema, model } from 'mongoose';
import { INVENTORY_TIPO } from '../utils/constants.js';

const inventoryMovementSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    tipo: { type: String, enum: INVENTORY_TIPO, required: true },
    cantidad: { type: Number, required: true },
    stockPrevio: { type: Number, required: true, min: 0 },
    stockNuevo: { type: Number, required: true, min: 0 },
    referencia: { type: String, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ product: 1, createdAt: -1 });

export default model('InventoryMovement', inventoryMovementSchema);
