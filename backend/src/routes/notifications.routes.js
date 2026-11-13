import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { auth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { listNotificationsQuery } from '../validators/notification.validator.js';

const router = Router();

router.use(auth);

router.get('/', validate({ query: listNotificationsQuery }), notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', validate({ params: idParams }), notificationController.markRead);

export default router;
