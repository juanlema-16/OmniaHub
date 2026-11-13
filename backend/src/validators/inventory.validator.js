import { z } from 'zod';
import { INVENTORY_TIPO } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';
import { fecha, objectId } from './common.validator.js';

export const listMovementsQuery = z.object({
  product: objectId('producto').optional(),
  tipo: z.enum(INVENTORY_TIPO, { error: 'Tipo de movimiento no válido' }).optional(),
  desde: fecha('La fecha inicial').optional(),
  hasta: fecha('La fecha final').optional(),
  ...paginationQuery,
});

export const adjustStockSchema = z.object({
  product: objectId('producto'),
  cantidad: z.coerce
    .number({ error: 'La cantidad debe ser un número' })
    .int({ error: 'La cantidad debe ser un número entero' })
    .refine((v) => v !== 0, { error: 'La cantidad no puede ser 0' }),
  motivo: z
    .string({ error: 'El motivo es obligatorio' })
    .trim()
    .min(3, { error: 'El motivo debe tener al menos 3 caracteres' })
    .max(200),
});
