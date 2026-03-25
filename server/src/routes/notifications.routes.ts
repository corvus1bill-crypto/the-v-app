import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import * as notifications from '../services/notification.service.js';
import { paramString } from '../utils/params.js';

const r = Router();

r.get('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const list = await notifications.listNotifications(req.userId!);
    res.json({ notifications: list });
  } catch (e) {
    next(e);
  }
});

r.patch('/:id/read', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    await notifications.markRead(paramString(req.params.id), req.userId!);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

r.post('/read-all', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    await notifications.markAllRead(req.userId!);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default r;
