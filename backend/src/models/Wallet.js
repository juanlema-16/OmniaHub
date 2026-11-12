import { Schema, model } from 'mongoose';

// El saldo solo se modifica desde wallet.service, siempre con una Transaction
const walletSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    saldoDisponible: { type: Number, default: 0, min: [0, 'El saldo no puede ser negativo'] },
    saldoReservado: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default model('Wallet', walletSchema);
