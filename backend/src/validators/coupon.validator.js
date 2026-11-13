import { z } from 'zod';
import { COUPON_TIPO } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';
import { booleanish } from './common.validator.js';

export const codigoField = z
  .string({ error: 'El código es obligatorio' })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{3,20}$/, { error: 'El código debe tener de 3 a 20 letras o números, sin espacios' });

const fields = {
  codigo: codigoField,
  tipo: z.enum(COUPON_TIPO, { error: 'El tipo debe ser PORCENTAJE o FIJO' }),
  valor: z.coerce.number({ error: 'El valor debe ser un número' }).positive({ error: 'El valor debe ser mayor a 0' }).max(100_000),
  minimoCompra: z.coerce.number({ error: 'La compra mínima debe ser un número' }).min(0, { error: 'La compra mínima no puede ser negativa' }).default(0),
  usosMaximos: z.coerce.number().int({ error: 'Los usos máximos deben ser un número entero' }).min(1, { error: 'Los usos máximos deben ser al menos 1' }).nullable().optional(),
  venceEn: z.coerce.date({ error: 'La fecha de vencimiento no es válida' }).nullable().optional(),
  activo: booleanish.default(true),
};

const porcentajeValido = (d) => d.tipo !== 'PORCENTAJE' || d.valor === undefined || d.valor <= 100;
const porcentajeError = { error: 'Un cupón de porcentaje no puede ser mayor a 100%', path: ['valor'] };
const venceFuturo = (d) => !d.venceEn || d.venceEn > new Date();
const venceError = { error: 'La fecha de vencimiento debe ser futura', path: ['venceEn'] };

export const createCouponSchema = z.object(fields).refine(porcentajeValido, porcentajeError).refine(venceFuturo, venceError);

export const updateCouponSchema = z
  .object(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, k === 'minimoCompra' || k === 'activo' ? v.unwrap().optional() : v.optional()])))
  .refine(porcentajeValido, porcentajeError)
  .refine(venceFuturo, venceError);

export const listCouponsQuery = z.object({
  search: z.string().trim().max(30).optional(),
  activo: booleanish.optional(),
  ...paginationQuery,
});
