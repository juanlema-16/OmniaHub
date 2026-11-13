import { Schema, model } from 'mongoose';

// El saldo solo se modifica desde wallet.service, siempre con una Transaction.
// Puede quedar negativo únicamente por el cobro del flete de una devolución.
const walletSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    saldoDisponible: { type: Number, default: 0 },
    saldoReservado: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default model('Wallet', walletSchema);
