import { z } from 'zod';

export const objectId = (label = 'id') =>
  z.string({ error: `El ${label} es obligatorio` }).regex(/^[a-f\d]{24}$/i, { error: `El ${label} no es válido` });

export const idParams = z.object({ id: objectId() });

// multipart y query llegan como texto: "true"/"false" → boolean
export const booleanish = z.preprocess(
  (v) => (v === 'true' || v === '1' ? true : v === 'false' || v === '0' ? false : v),
  z.boolean({ error: 'Debe ser verdadero o falso' })
);

export const precio = (label) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .positive({ error: `${label} debe ser mayor a 0` })
    .max(1_000_000, { error: `${label} es demasiado alto` })
    .transform((v) => Math.round(v * 100) / 100);

export const enteroNoNegativo = (label) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .int({ error: `${label} debe ser un número entero` })
    .min(0, { error: `${label} no puede ser negativo` })
    .max(1_000_000, { error: `${label} es demasiado alto` });

export const fecha = (label) => z.coerce.date({ error: `${label} no es una fecha válida` });
