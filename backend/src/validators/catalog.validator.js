import { z } from 'zod';
import { paginationQuery } from '../utils/pagination.js';
import { booleanish, enteroNoNegativo, objectId } from './common.validator.js';

const precioFiltro = (label) =>
  z.coerce.number({ error: `${label} debe ser un número` }).min(0, { error: `${label} no puede ser negativo` });

export const ORDEN_CATALOGO = ['recientes', 'precio_asc', 'precio_desc', 'stock_desc', 'nombre'];

export const catalogQuery = z
  .object({
    search: z.string().trim().max(60).optional(),
    categoria: z.string().trim().max(60).optional(),
    proveedor: objectId('proveedor').optional(),
    precioMin: precioFiltro('El precio mínimo').optional(),
    precioMax: precioFiltro('El precio máximo').optional(),
    conStock: booleanish.optional(),
    stockMin: enteroNoNegativo('El stock mínimo').optional(),
    verificado: booleanish.optional(),
    orden: z.enum(ORDEN_CATALOGO, { error: 'Orden no válido' }).default('recientes'),
    ...paginationQuery,
  })
  .refine((q) => q.precioMin === undefined || q.precioMax === undefined || q.precioMin <= q.precioMax, {
    error: 'El precio mínimo no puede ser mayor al máximo',
    path: ['precioMin'],
  });

export const proveedoresQuery = z.object({
  search: z.string().trim().max(60).optional(),
  ...paginationQuery,
  limit: paginationQuery.limit.default(12),
});
