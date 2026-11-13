import { z } from 'zod';
import { paginationQuery } from '../utils/pagination.js';
import { fecha } from './common.validator.js';

export const listInvoicesQuery = z.object({
  search: z.string().trim().max(60).optional(),
  origen: z.enum(['ORDEN', 'POS'], { error: 'El origen debe ser ORDEN o POS' }).optional(),
  desde: fecha('La fecha inicial').optional(),
  hasta: fecha('La fecha final').optional(),
  ...paginationQuery,
});
