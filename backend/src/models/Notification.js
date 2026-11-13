import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    mensaje: { type: String, required: true, trim: true, maxlength: 500 },
    tipo: {
      type: String,
      enum: ['ORDEN', 'NOVEDAD', 'KYC', 'BILLETERA', 'SISTEMA'],
      default: 'SISTEMA',
    },
    leida: { type: Boolean, default: false },
    link: String,
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, leida: 1, createdAt: -1 });

export default model('Notification', notificationSchema);
