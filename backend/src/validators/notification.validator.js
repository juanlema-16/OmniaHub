import { z } from 'zod';
import { paginationQuery } from '../utils/pagination.js';
import { booleanish } from './common.validator.js';

export const listNotificationsQuery = z.object({
  leida: booleanish.optional(),
  tipo: z.enum(['ORDEN', 'NOVEDAD', 'KYC', 'BILLETERA', 'SISTEMA'], { error: 'Tipo no válido' }).optional(),
  ...paginationQuery,
});
