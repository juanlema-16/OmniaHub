import { z } from 'zod';
import { METODO_PAGO_POS } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';
import { fecha, objectId, precio } from './common.validator.js';

const montoNoNegativo = (label) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .min(0, { error: `${label} no puede ser negativo` })
    .max(1_000_000)
    .transform((v) => Math.round(v * 100) / 100);

export const openCashSchema = z.object({ montoInicial: montoNoNegativo('El monto inicial') });

export const closeCashSchema = z.object({ montoContado: montoNoNegativo('El monto contado') });

export const posSaleSchema = z.object({
  items: z
    .array(
      z.object({
        product: objectId('producto'),
        cantidad: z.coerce.number().int({ error: 'La cantidad debe ser un número entero' }).min(1, { error: 'La cantidad mínima es 1' }).max(1000),
        precio: precio('El precio').optional(),
      }),
      { error: 'Agrega al menos un producto' }
    )
    .min(1, { error: 'Agrega al menos un producto' })
    .max(50)
    .refine((items) => new Set(items.map((i) => i.product)).size === items.length, { error: 'Un producto aparece más de una vez' }),
  metodoPago: z.enum(METODO_PAGO_POS, { error: 'El método de pago debe ser EFECTIVO o TARJETA' }),
  cliente: z
    .object({
      nombre: z.string().trim().min(2).max(120).optional(),
      nit: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^(CF|\d{1,12}-?[\dK])$/, { error: 'El NIT debe ser CF o un NIT válido (ej. 1234567-8)' })
        .optional(),
    })
    .optional(),
});

export const listSalesQuery = z.object({
  cashSession: objectId('caja').optional(),
  desde: fecha('La fecha inicial').optional(),
  hasta: fecha('La fecha final').optional(),
  ...paginationQuery,
});

export const listSessionsQuery = z.object({ ...paginationQuery });
