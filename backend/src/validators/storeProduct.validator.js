import { z } from 'zod';
import { paginationQuery } from '../utils/pagination.js';
import { booleanish, objectId, precio } from './common.validator.js';

export const importProductSchema = z.object({
  product: objectId('producto'),
  precioVenta: precio('El precio de venta').optional(),
});

export const updateStoreProductSchema = z
  .object({
    precioVenta: precio('El precio de venta').optional(),
    activo: booleanish.optional(),
  })
  .refine((d) => d.precioVenta !== undefined || d.activo !== undefined, {
    error: 'Envía el precio de venta o el estado activo',
  });

export const listStoreProductsQuery = z.object({
  search: z.string().trim().max(60).optional(),
  activo: booleanish.optional(),
  ...paginationQuery,
});
