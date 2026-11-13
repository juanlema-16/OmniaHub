import { z } from 'zod';
import { objectId } from './common.validator.js';

export const favoriteParams = z.object({ productId: objectId('producto') });
