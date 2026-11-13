import { z } from 'zod';
import { ORDER_STATUS, TIPO_PAGO } from '../utils/constants.js';
import { paginationQuery } from '../utils/pagination.js';
import { booleanish, fecha, objectId, precio } from './common.validator.js';
import { emailField, telefonoField } from './auth.validator.js';
import { departamentoField } from './shipping.validator.js';
import { municipioDe } from '../utils/municipios.js';

const texto = (label, min, max) =>
  z
    .string({ error: `${label} es obligatorio` })
    .trim()
    .min(min, { error: `${label} debe tener al menos ${min} caracteres` })
    .max(max, { error: `${label} no puede tener más de ${max} caracteres` });

export const clienteSchema = z.object({
  nombres: texto('El nombre', 2, 60),
  apellidos: texto('El apellido', 2, 60),
  telefono: telefonoField,
  email: z.union([z.literal(''), emailField]).optional().transform((v) => v || undefined),
});

// El municipio debe pertenecer al departamento; se guarda con su nombre oficial (tildes y mayúsculas)
export const destinoSchema = z
  .object({
    departamento: departamentoField,
    municipio: texto('El municipio', 2, 80),
    direccion: texto('La dirección', 5, 200),
    referencias: z.string().trim().max(200).optional(),
  })
  .superRefine((d, ctx) => {
    if (!municipioDe(d.departamento, d.municipio)) {
      ctx.addIssue({ code: 'custom', path: ['municipio'], message: `"${d.municipio}" no es un municipio de ${d.departamento}` });
    }
  })
  .transform((d) => ({ ...d, municipio: municipioDe(d.departamento, d.municipio) }));

export const itemsSchema = z
  .array(
    z.object({
      product: objectId('producto'),
      cantidad: z.coerce
        .number({ error: 'La cantidad debe ser un número' })
        .int({ error: 'La cantidad debe ser un número entero' })
        .min(1, { error: 'La cantidad mínima es 1' })
        .max(1000, { error: 'La cantidad máxima es 1000' }),
      precioVenta: precio('El precio de venta').optional(),
    }),
    { error: 'Agrega al menos un producto' }
  )
  .min(1, { error: 'Agrega al menos un producto' })
  .max(20, { error: 'Máximo 20 productos por orden' })
  .refine((items) => new Set(items.map((i) => i.product)).size === items.length, {
    error: 'Un producto aparece más de una vez; usa una sola línea con la cantidad total',
  });

export const createOrderSchema = z.object({
  cliente: clienteSchema,
  destino: destinoSchema,
  items: itemsSchema,
  tipoPago: z.enum(TIPO_PAGO, { error: 'El tipo de pago debe ser CON_RECAUDO o SIN_RECAUDO' }),
  transportadora: objectId('transportadora'),
  notasProveedor: z.string().trim().max(500).optional(),
});

export const previewOrderSchema = z.object({
  items: itemsSchema,
  departamento: departamentoField,
  transportadora: objectId('transportadora'),
});

export const changeStatusSchema = z
  .object({
    estado: z.enum(ORDER_STATUS, { error: 'Estado no válido' }),
    nota: z.string().trim().max(300).optional(),
    motivo: z.string().trim().min(3, { error: 'El motivo debe tener al menos 3 caracteres' }).max(200).optional(),
    montoRecaudado: z.coerce.number({ error: 'El monto cobrado debe ser un número' }).min(0).optional(),
  })
  .refine((d) => d.estado !== 'NOVEDAD' || d.motivo, {
    error: 'Indica el motivo de la novedad',
    path: ['motivo'],
  });

export const solveNovedadSchema = z.object({
  solucion: texto('La solución', 5, 300),
  direccion: texto('La dirección', 5, 200).optional(),
  referencias: z.string().trim().max(200).optional(),
  telefono: telefonoField.optional(),
});

const estadosLista = z
  .string()
  .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(z.enum(ORDER_STATUS, { error: 'Estado no válido' })).min(1));

export const listOrdersQuery = z.object({
  estado: estadosLista.optional(),
  desde: fecha('La fecha inicial').optional(),
  hasta: fecha('La fecha final').optional(),
  transportadora: objectId('transportadora').optional(),
  tipoPago: z.enum(TIPO_PAGO).optional(),
  origen: z.enum(['PANEL', 'TIENDA']).optional(),
  novedad: booleanish.optional(),
  search: z.string().trim().max(60).optional(),
  ...paginationQuery,
});
