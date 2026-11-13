import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller.js';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { createTicketSchema, listTicketsQuery, replyTicketSchema, ticketStatusSchema } from '../validators/ticket.validator.js';

const router = Router();

// Cualquier usuario autenticado; el servicio limita a cada uno a sus tickets (el admin ve todos)
router.use(auth);

router.get('/', validate({ query: listTicketsQuery }), ticketController.list);
router.post('/', validate({ body: createTicketSchema }), ticketController.create);
router.get('/:id', validate({ params: idParams }), ticketController.getOne);
router.post('/:id/messages', validate({ params: idParams, body: replyTicketSchema }), ticketController.reply);
router.patch('/:id/status', validate({ params: idParams, body: ticketStatusSchema }), ticketController.changeStatus);

export default router;
