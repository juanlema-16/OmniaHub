import { Schema, model } from 'mongoose';

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    descripcion: String,
  },
  { timestamps: true }
);

export default model('Setting', settingSchema);
