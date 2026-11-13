import { z } from 'zod';
import { ORDER_STATUS } from '../utils/constants.js';
import { fecha } from './common.validator.js';

const periodo = {
  desde: fecha('La fecha inicial').optional(),
  hasta: fecha('La fecha final').optional(),
};
const enOrden = (q) => !q.desde || !q.hasta || q.desde <= q.hasta;
const errorOrden = { error: 'La fecha inicial no puede ser mayor a la final', path: ['desde'] };

export const reportQuery = z.object(periodo).refine(enOrden, errorOrden);

export const exportOrdersQuery = z
  .object({ ...periodo, estado: z.enum(ORDER_STATUS, { error: 'Estado no válido' }).optional() })
  .refine(enOrden, errorOrden);
