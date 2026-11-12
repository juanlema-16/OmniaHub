import { Schema, model } from 'mongoose';

// Correlativos para números de orden, guías y facturas
const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export default model('Counter', counterSchema);
