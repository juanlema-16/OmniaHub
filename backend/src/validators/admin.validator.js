import { z } from 'zod';
import { ACCOUNT_STATUS, BANNER_UBICACION, DEPARTAMENTOS, KYC_STATUS, ROLES } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';
import { booleanish, fecha, objectId } from './common.validator.js';
import { emailField, registerSchema, telefonoField } from './auth.validator.js';

export const listUsersQuery = z.object({
  role: z.enum(ROLES, { error: 'Rol no válido' }).optional(),
  accountStatus: z.enum(ACCOUNT_STATUS, { error: 'Estado no válido' }).optional(),
  kyc: z.enum(KYC_STATUS, { error: 'Estado de KYC no válido' }).optional(),
  search: z.string().trim().max(60).optional(),
  ...paginationQuery,
});

export const userStatusSchema = z.object({
  accountStatus: z.enum(['activo', 'bloqueado'], { error: 'El estado debe ser activo o bloqueado' }),
  motivo: z.string().trim().min(5, { error: 'Indica el motivo (mínimo 5 caracteres)' }).max(300).optional(),
}).refine((d) => d.accountStatus !== 'bloqueado' || d.motivo, { error: 'Indica el motivo del bloqueo', path: ['motivo'] });

export const createUserSchema = z.object({
  nombre: registerSchema.shape.nombre,
  apellido: registerSchema.shape.apellido,
  email: emailField,
  telefono: telefonoField,
  password: registerSchema.shape.password,
  role: z.enum(['admin', 'transportadora'], { error: 'El admin solo crea usuarios admin o transportadora' }),
  empresaNombre: z.string().trim().min(2).max(120).optional(),
}).refine((d) => d.role !== 'transportadora' || d.empresaNombre, { error: 'Indica el nombre de la transportadora', path: ['empresaNombre'] });

export const settingsSchema = z.object({
  comisionPorcentaje: z.coerce.number({ error: 'La comisión debe ser un número' }).min(0, { error: 'La comisión no puede ser negativa' }).max(30, { error: 'La comisión máxima es 30%' }).optional(),
  montoMinimoRetiro: z.coerce.number({ error: 'El monto mínimo debe ser un número' }).min(1, { error: 'El monto mínimo debe ser al menos Q 1' }).max(10_000).optional(),
}).refine((d) => d.comisionPorcentaje !== undefined || d.montoMinimoRetiro !== undefined, { error: 'Envía al menos una configuración' });

export const updateCarrierSchema = z.object({
  nombre: z.string().trim().min(2).max(60).optional(),
  logo: z.string().trim().max(500).optional(),
  activa: booleanish.optional(),
}).refine((d) => Object.values(d).some((v) => v !== undefined), { error: 'Envía al menos un campo' });

export const tarifasSchema = z.object({
  tarifas: z
    .array(
      z.object({
        departamento: z.enum(DEPARTAMENTOS, { error: 'Departamento no válido' }),
        precio: z.coerce.number({ error: 'El precio debe ser un número' }).min(0, { error: 'El precio no puede ser negativo' }).max(5000).transform((v) => Math.round(v * 100) / 100),
        dias: z.coerce.number().int({ error: 'Los días deben ser un número entero' }).min(1, { error: 'Mínimo 1 día' }).max(30),
      }),
      { error: 'Envía las tarifas' }
    )
    .min(1, { error: 'Envía al menos una tarifa' })
    .max(DEPARTAMENTOS.length)
    .refine((t) => new Set(t.map((x) => x.departamento)).size === t.length, { error: 'Un departamento aparece más de una vez' }),
});

const ubicacionesField = z.preprocess(
  (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v),
  z.array(z.enum(BANNER_UBICACION, { error: 'La ubicación debe ser LANDING o PANEL' })).min(1, { error: 'Elige al menos una ubicación' })
);
const linkField = z.string().trim().max(300).refine((v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v), { error: 'El enlace debe empezar con / o https://' });

const bannerFields = {
  titulo: z.string({ error: 'El título es obligatorio' }).trim().min(3, { error: 'El título debe tener al menos 3 caracteres' }).max(120),
  subtitulo: z.string().trim().max(200).optional(),
  imagenUrl: z.string().trim().url({ error: 'La URL de la imagen no es válida' }).optional(),
  link: linkField.optional(),
  ubicacion: ubicacionesField.optional(),
  inicio: fecha('La fecha de inicio').optional(),
  fin: fecha('La fecha de fin').nullable().optional(),
  activo: booleanish.optional(),
};
const finDespuesDeInicio = (d) => !d.inicio || !d.fin || d.fin >= d.inicio;
const finError = { error: 'La fecha de fin no puede ser anterior a la de inicio', path: ['fin'] };

export const createBannerSchema = z.object(bannerFields).refine(finDespuesDeInicio, finError);
export const updateBannerSchema = z
  .object({ ...bannerFields, titulo: bannerFields.titulo.optional() })
  .refine(finDespuesDeInicio, finError);

export const policyBodySchema = z.object({
  titulo: z.string().trim().min(3, { error: 'El título debe tener al menos 3 caracteres' }).max(120).optional(),
  contenido: z.string({ error: 'El contenido es obligatorio' }).trim().min(20, { error: 'El contenido debe tener al menos 20 caracteres' }).max(20_000),
});

export const auditQuery = z.object({
  accion: z.string().trim().max(40).optional(),
  entidad: z.string().trim().max(40).optional(),
  user: objectId('usuario').optional(),
  desde: fecha('La fecha inicial').optional(),
  hasta: fecha('La fecha final').optional(),
  ...paginationQuery,
});
