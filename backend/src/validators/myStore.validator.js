import { z } from 'zod';
import { booleanish } from './common.validator.js';

export const updateMyStoreSchema = z.object({
  nombre: z
    .string({ error: 'El nombre de la tienda es obligatorio' })
    .trim()
    .min(3, { error: 'El nombre de la tienda debe tener al menos 3 caracteres' })
    .max(60, { error: 'El nombre de la tienda no puede pasar de 60 caracteres' })
    .optional(),
  quitarLogo: booleanish.optional(),
});
