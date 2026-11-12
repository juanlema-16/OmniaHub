import { z } from 'zod';
import { paginationQuery } from '../utils/pagination.js';
import { fecha, objectId } from './common.validator.js';

const itemSchema = z.object({
  product: objectId('producto'),
  cantidad: z.coerce
    .number({ error: 'La cantidad debe ser un número' })
    .int({ error: 'La cantidad debe ser un número entero' })
    .min(1, { error: 'La cantidad mínima es 1' })
    .max(100_000, { error: 'La cantidad es demasiado alta' }),
  costo: z.coerce
    .number({ error: 'El costo debe ser un número' })
    .min(0, { error: 'El costo no puede ser negativo' })
    .max(1_000_000, { error: 'El costo es demasiado alto' })
    .transform((v) => Math.round(v * 100) / 100),
});

export const createPurchaseSchema = z.object({
  origen: z
    .string({ error: 'Indica a quién le compraste la mercancía' })
    .trim()
    .min(2, { error: 'El origen debe tener al menos 2 caracteres' })
    .max(120),
  items: z
    .array(itemSchema, { error: 'Agrega al menos un producto' })
    .min(1, { error: 'Agrega al menos un producto' })
    .max(50, { error: 'Máximo 50 productos por compra' })
    .refine((items) => new Set(items.map((i) => i.product)).size === items.length, {
      error: 'Un producto aparece más de una vez; suma las cantidades en una sola línea',
    }),
  notas: z.string().trim().max(500).optional(),
});

export const listPurchasesQuery = z.object({
  desde: fecha('La fecha inicial').optional(),
  hasta: fecha('La fecha final').optional(),
  search: z.string().trim().max(60).optional(),
  ...paginationQuery,
});
