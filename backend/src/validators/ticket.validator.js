import { z } from 'zod';
import { TICKET_CATEGORIA, TICKET_ESTADO, TICKET_PRIORIDAD } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';
import { objectId } from './common.validator.js';

const texto = (label, min, max) =>
  z
    .string({ error: `${label} es obligatorio` })
    .trim()
    .min(min, { error: `${label} debe tener al menos ${min} caracteres` })
    .max(max, { error: `${label} no puede tener más de ${max} caracteres` });

export const createTicketSchema = z.object({
  asunto: texto('El asunto', 5, 120),
  categoria: z.enum(TICKET_CATEGORIA, { error: 'La categoría debe ser PEDIDO, PAGO, CUENTA, TECNICO u OTRO' }),
  prioridad: z.enum(TICKET_PRIORIDAD, { error: 'La prioridad debe ser BAJA, MEDIA o ALTA' }).default('MEDIA'),
  mensaje: texto('El mensaje', 10, 2000),
  order: objectId('orden').optional(),
});

export const replyTicketSchema = z.object({ texto: texto('El mensaje', 2, 2000) });

export const ticketStatusSchema = z.object({ estado: z.enum(TICKET_ESTADO, { error: 'Estado no válido' }) });

export const listTicketsQuery = z.object({
  estado: z.enum(TICKET_ESTADO, { error: 'Estado no válido' }).optional(),
  prioridad: z.enum(TICKET_PRIORIDAD, { error: 'Prioridad no válida' }).optional(),
  categoria: z.enum(TICKET_CATEGORIA, { error: 'Categoría no válida' }).optional(),
  search: z.string().trim().max(60).optional(),
  ...paginationQuery,
});
