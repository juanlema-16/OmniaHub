import { z } from 'zod';
import { KYC_STATUS } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';
import { objectId } from './common.validator.js';

export const kycFileParams = z.object({
  filename: z.string().regex(/^[a-f\d-]{36}\.(jpg|png|webp)$/i, { error: 'Archivo no válido' }),
});

export const listKycQuery = z.object({
  status: z.enum(KYC_STATUS, { error: 'Estado de KYC no válido' }).default('pendiente'),
  search: z.string().trim().max(60).optional(),
  ...paginationQuery,
});

export const reviewKycParams = z.object({ userId: objectId('usuario') });

export const reviewKycBody = z
  .object({
    accion: z.enum(['aprobar', 'rechazar'], { error: 'La acción debe ser aprobar o rechazar' }),
    motivo: z.string().trim().max(300, { error: 'El motivo no puede tener más de 300 caracteres' }).optional(),
  })
  .refine((data) => data.accion !== 'rechazar' || (data.motivo && data.motivo.length >= 5), {
    error: 'Indica el motivo del rechazo (mínimo 5 caracteres)',
    path: ['motivo'],
  });
