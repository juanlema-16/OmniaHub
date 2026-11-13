import { z } from 'zod';
import { ROLES_REGISTRO } from '../utils/constants.js';

export const emailField = z
  .string({ error: 'El correo es obligatorio' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Correo inválido' }));

// Acepta "5555 1234", "5555-1234" o "+502 55551234" y lo guarda como 8 dígitos
export const telefonoField = z
  .string({ error: 'El teléfono es obligatorio' })
  .transform((v) => v.replace(/[\s-]/g, '').replace(/^\+?502/, ''))
  .pipe(z.string().regex(/^\d{8}$/, { error: 'El teléfono debe tener 8 dígitos' }));

const nombreField = (label) =>
  z
    .string({ error: `El ${label} es obligatorio` })
    .trim()
    .min(2, { error: `El ${label} debe tener al menos 2 caracteres` })
    .max(60, { error: `El ${label} no puede tener más de 60 caracteres` });

const passwordField = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
  .max(72, { error: 'La contraseña no puede tener más de 72 caracteres' })
  .regex(/[A-Za-z]/, { error: 'La contraseña debe tener al menos una letra' })
  .regex(/\d/, { error: 'La contraseña debe tener al menos un número' });

export const registerSchema = z.object({
  nombre: nombreField('nombre'),
  apellido: nombreField('apellido'),
  email: emailField,
  telefono: telefonoField,
  password: passwordField,
  role: z.enum(ROLES_REGISTRO, { error: 'El rol debe ser proveedor, dropshipper o cliente' }),
  tiendaNombre: z.string().trim().min(3, { error: 'El nombre de la tienda debe tener al menos 3 caracteres' }).max(60).optional(),
  empresaNombre: z.string().trim().min(2).max(120).optional(),
  nit: z.string().trim().max(15).optional(),
});

export const verifyEmailSchema = z.object({
  email: emailField,
  code: z.string({ error: 'El código es obligatorio' }).trim().regex(/^\d{6}$/, { error: 'El código debe tener 6 dígitos' }),
});

export const resendCodeSchema = z.object({ email: emailField });

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: 'La contraseña es obligatoria' }).min(1, { error: 'La contraseña es obligatoria' }),
});
