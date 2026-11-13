import { z } from 'zod';
import { BANCOS, TIPO_CUENTA } from '../utils/constants.js';

const fields = {
  banco: z.enum(BANCOS, { error: `El banco debe ser uno de: ${BANCOS.join(', ')}` }),
  tipoCuenta: z.enum(TIPO_CUENTA, { error: 'El tipo de cuenta debe ser MONETARIA o AHORRO' }),
  numeroCuenta: z
    .string({ error: 'El número de cuenta es obligatorio' })
    .transform((v) => v.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\d{6,20}$/, { error: 'El número de cuenta debe tener entre 6 y 20 dígitos' })),
  titular: z
    .string({ error: 'El titular es obligatorio' })
    .trim()
    .min(3, { error: 'El titular debe tener al menos 3 caracteres' })
    .max(120),
};

export const createBankAccountSchema = z.object(fields);

export const updateBankAccountSchema = z
  .object(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])))
  .refine((d) => Object.values(d).some((v) => v !== undefined), { error: 'Envía al menos un campo para actualizar' });
