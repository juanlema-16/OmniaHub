import { z } from 'zod';
import { BANNER_UBICACION, POLICY_SLUGS, ROLES } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';
import { objectId } from './common.validator.js';
import { codigoField } from './coupon.validator.js';
import { clienteSchema, destinoSchema } from './order.validator.js';

export const slugParams = z.object({ slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,80}$/, { error: 'Tienda no válida' }) });
export const storeProductParams = slugParams.extend({ productId: objectId('producto') });

export const storeQuery = z.object({
  search: z.string().trim().max(60).optional(),
  categoria: z.string().trim().max(60).optional(),
  orden: z.enum(['recientes', 'precio_asc', 'precio_desc'], { error: 'Orden no válido' }).default('recientes'),
  ...paginationQuery,
  limit: paginationQuery.limit.default(12),
});

const itemsTienda = z
  .array(
    z.object({
      product: objectId('producto'),
      cantidad: z.coerce.number().int({ error: 'La cantidad debe ser un número entero' }).min(1, { error: 'La cantidad mínima es 1' }).max(50, { error: 'Máximo 50 unidades por producto' }),
    }),
    { error: 'El carrito está vacío' }
  )
  .min(1, { error: 'El carrito está vacío' })
  .max(20)
  .refine((items) => new Set(items.map((i) => i.product)).size === items.length, { error: 'Un producto aparece más de una vez en el carrito' });

export const cartValidateSchema = z.object({ items: itemsTienda });
export const couponCheckSchema = z.object({ codigo: codigoField, items: itemsTienda });

export const checkoutSchema = z.object({
  // Si no se envían, se usan los datos de la cuenta del cliente
  cliente: clienteSchema.partial().default({}),
  destino: destinoSchema,
  items: itemsTienda,
  transportadora: objectId('transportadora'),
  metodoPago: z.enum(['CONTRAENTREGA', 'TARJETA'], { error: 'El método de pago debe ser CONTRAENTREGA o TARJETA' }),
  cupon: codigoField.optional(),
});

export const bannersQuery = z.object({
  ubicacion: z.enum(BANNER_UBICACION, { error: 'Ubicación no válida' }).default('LANDING'),
  rol: z.enum(ROLES, { error: 'Rol no válido' }).optional(),
});
export const policyParams = z.object({ slug: z.enum(POLICY_SLUGS, { error: 'Política no encontrada' }) });
