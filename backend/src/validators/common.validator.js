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

// Una fecha sin hora ("2026-11-12") es un día de Guatemala (UTC-6, sin horario de verano), no de UTC:
// así "hasta" incluye todo el día local, también lo que ocurre después de las 6 p. m.
export const fecha = (label) =>
  z.preprocess((v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00-06:00` : v), z.coerce.date({ error: `${label} no es una fecha válida` }));
