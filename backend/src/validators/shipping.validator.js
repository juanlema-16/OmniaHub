import { z } from 'zod';
import { DEPARTAMENTOS } from '../utils/constants.js';
import { objectId } from './common.validator.js';

export const departamentoField = z.enum(DEPARTAMENTOS, { error: 'Selecciona un departamento de Guatemala válido' });

export const quoteQuery = z.object({ departamento: departamentoField });

export const preferenceBody = z.object({
  departamento: departamentoField,
  carrier: objectId('transportadora'),
});

export const preferenceParams = z.object({ departamento: departamentoField });
