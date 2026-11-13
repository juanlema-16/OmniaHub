import { z } from 'zod';
import { DEPARTAMENTOS } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';

export const listCustomersQuery = z.object({
  search: z.string().trim().max(60).optional(),
  departamento: z.enum(DEPARTAMENTOS, { error: 'El departamento no es válido' }).optional(),
  ...paginationQuery,
});
