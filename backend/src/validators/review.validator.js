import { z } from 'zod';
import { booleanish, objectId } from './common.validator.js';
import { paginationQuery } from '../utils/pagination.js';

export const createReviewSchema = z.object({
  product: objectId('producto'),
  order: objectId('orden'),
  rating: z.coerce
    .number({ error: 'La calificación debe ser un número del 1 al 5' })
    .int({ error: 'La calificación debe ser un número entero' })
    .min(1, { error: 'La calificación mínima es 1' })
    .max(5, { error: 'La calificación máxima es 5' }),
  comentario: z
    .string({ error: 'El comentario es obligatorio' })
    .trim()
    .min(3, { error: 'El comentario debe tener al menos 3 caracteres' })
    .max(500, { error: 'El comentario no puede tener más de 500 caracteres' }),
});

export const productReviewsParams = z.object({ productId: objectId('producto') });
export const productReviewsQuery = z.object({ ...paginationQuery, limit: paginationQuery.limit.default(5) });

export const listReviewsQuery = z.object({
  visible: booleanish.optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().trim().max(60).optional(),
  ...paginationQuery,
});

export const moderateReviewSchema = z.object({ visible: booleanish });
