import { z } from 'zod';
import { METODO_RECARGA, SOLICITUD_ESTADO, TRANSACTION_CONCEPTO, TRANSACTION_TIPO } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';
import { fecha, objectId } from './common.validator.js';

const monto = (label, max) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .positive({ error: `${label} debe ser mayor a 0` })
    .max(max, { error: `${label} no puede ser mayor a Q ${max.toLocaleString('en-US')}` })
    .transform((v) => Math.round(v * 100) / 100);

const rangoFechas = {
  desde: fecha('La fecha inicial').optional(),
  hasta: fecha('La fecha final').optional(),
};
const fechasEnOrden = (q) => !q.desde || !q.hasta || q.desde <= q.hasta;
const errorFechas = { error: 'La fecha inicial no puede ser mayor a la final', path: ['desde'] };

export const transactionsFilter = z
  .object({
    ...rangoFechas,
    tipo: z.enum(TRANSACTION_TIPO, { error: 'El tipo debe ser ENTRADA o SALIDA' }).optional(),
    concepto: z.enum(TRANSACTION_CONCEPTO, { error: 'Concepto no válido' }).optional(),
    search: z.string().trim().max(60).optional(),
  })
  .refine(fechasEnOrden, errorFechas);

export const transactionsQuery = z
  .object({ ...transactionsFilter.shape, ...paginationQuery })
  .refine(fechasEnOrden, errorFechas);

export const solicitudesQuery = z.object({
  estado: z.enum(SOLICITUD_ESTADO, { error: 'Estado no válido' }).optional(),
  search: z.string().trim().max(60).optional(),
  ...paginationQuery,
});

export const topUpSchema = z.object({
  monto: monto('El monto', 50_000).refine((v) => v >= 10, { error: 'La recarga mínima es Q 10.00' }),
  metodo: z.enum(METODO_RECARGA, { error: 'El método debe ser TRANSFERENCIA o TARJETA' }),
});

export const withdrawalSchema = z.object({
  monto: monto('El monto', 100_000),
  bankAccount: objectId('cuenta bancaria'),
  concepto: z
    .string({ error: 'El concepto es obligatorio' })
    .trim()
    .min(3, { error: 'El concepto debe tener al menos 3 caracteres' })
    .max(200),
});

export const reviewSchema = z
  .object({
    accion: z.enum(['aprobar', 'rechazar'], { error: 'La acción debe ser aprobar o rechazar' }),
    motivo: z.string().trim().max(300).optional(),
  })
  .refine((d) => d.accion !== 'rechazar' || (d.motivo && d.motivo.length >= 5), {
    error: 'Indica el motivo del rechazo (mínimo 5 caracteres)',
    path: ['motivo'],
  });

export const comprobanteParams = z.object({
  filename: z.string().regex(/^[a-f\d-]{36}\.(jpg|png|webp|pdf)$/i, { error: 'Archivo no válido' }),
});
