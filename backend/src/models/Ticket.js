import { Schema, model } from 'mongoose';
import { ROLES, TICKET_CATEGORIA, TICKET_ESTADO, TICKET_PRIORIDAD } from '../utils/constants.js';

const mensajeSchema = new Schema(
  {
    autor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rol: { type: String, enum: ROLES, required: true },
    texto: { type: String, required: [true, 'El mensaje es obligatorio'], trim: true, maxlength: 2000 },
    fecha: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ticketSchema = new Schema(
  {
    numero: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    asunto: { type: String, required: [true, 'El asunto es obligatorio'], trim: true, minlength: 5, maxlength: 120 },
    categoria: { type: String, enum: TICKET_CATEGORIA, required: true },
    prioridad: { type: String, enum: TICKET_PRIORIDAD, default: 'MEDIA' },
    estado: { type: String, enum: TICKET_ESTADO, default: 'ABIERTO' },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    mensajes: { type: [mensajeSchema], default: [] },
    cerradoEn: Date,
  },
  { timestamps: true }
);

ticketSchema.index({ user: 1, updatedAt: -1 });
ticketSchema.index({ estado: 1, prioridad: 1, updatedAt: -1 });

export default model('Ticket', ticketSchema);
