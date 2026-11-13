import { z } from 'zod';
import { paginationQuery } from '../utils/pagination.js';
import { booleanish, enteroNoNegativo, objectId, precio } from './common.validator.js';

const fields = {
  nombre: z
    .string({ error: 'El nombre es obligatorio' })
    .trim()
    .min(3, { error: 'El nombre debe tener al menos 3 caracteres' })
    .max(120, { error: 'El nombre no puede tener más de 120 caracteres' }),
  descripcion: z.string().trim().max(2000, { error: 'La descripción no puede tener más de 2000 caracteres' }).optional(),
  categoria: objectId('categoría'),
  precioProveedor: precio('El precio proveedor'),
  precioSugerido: precio('El precio sugerido'),
  stock: enteroNoNegativo('El stock'),
  stockMinimo: enteroNoNegativo('El stock mínimo'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,30}$/, { error: 'El SKU solo puede tener letras, números y guiones (3 a 30)' })
    .optional(),
  bodega: z.string().trim().max(80).optional(),
  activo: booleanish.optional(),
};

const sugeridoMayorOIgual = (data) =>
  data.precioProveedor === undefined || data.precioSugerido === undefined || data.precioSugerido >= data.precioProveedor;
const sugeridoError = { error: 'El precio sugerido no puede ser menor al precio proveedor', path: ['precioSugerido'] };

export const createProductSchema = z
  .object({ ...fields, stockMinimo: fields.stockMinimo.default(5) })
  .refine(sugeridoMayorOIgual, sugeridoError);

// imagenesEliminar llega como JSON ('["/uploads/products/a.jpg"]') en multipart o como arreglo en JSON
const listaDeUrls = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return [v];
  }
}, z.array(z.string()).max(10));

export const updateProductSchema = z
  .object({
    ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])),
    imagenesEliminar: listaDeUrls.optional(),
  })
  .refine(sugeridoMayorOIgual, sugeridoError);

export const listMineQuery = z.object({
  search: z.string().trim().max(60).optional(),
  categoria: objectId('categoría').optional(),
  activo: booleanish.optional(),
  stockBajo: booleanish.optional(),
  ...paginationQuery,
});
