import { z } from 'zod';
import { fecha } from './common.validator.js';
import { listOrdersQuery } from './order.validator.js';

const periodo = {
  desde: fecha('La fecha inicial').optional(),
  hasta: fecha('La fecha final').optional(),
};
const enOrden = (q) => !q.desde || !q.hasta || q.desde <= q.hasta;
const errorOrden = { error: 'La fecha inicial no puede ser mayor a la final', path: ['desde'] };

export const reportQuery = z.object(periodo).refine(enOrden, errorOrden);

// Mismos filtros que el listado de órdenes, sin paginación
export const exportOrdersQuery = listOrdersQuery.omit({ page: true, limit: true }).refine(enOrden, errorOrden);
