import { Router } from 'express';
import type { Server as IOServer } from 'socket.io';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import { sendMessageSchema } from '../validation/schemas.js';
import * as messages from '../services/message.service.js';
import { paramString } from '../utils/params.js';

const r = Router();

r.get('/conversations', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const list = await messages.listConversations(req.userId!);
    res.json({ conversations: list });
  } catch (e) {
    next(e);
  }
});

r.post('/conversations/with/:otherUserId', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const conv = await messages.findOrCreateConversation(
      req.userId!,
      paramString(req.params.otherUserId)
    );
    res.json(conv);
  } catch (e) {
    next(e);
  }
});

r.get('/conversations/:id/messages', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const list = await messages.listMessages(paramString(req.params.id), req.userId!, limit, offset);
    res.json({ messages: list });
  } catch (e) {
    next(e);
  }
});

r.post('/conversations/:id/messages', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = sendMessageSchema.parse(req.body);
    const convId = paramString(req.params.id);
    const msg = await messages.sendMessage(convId, req.userId!, body.content, body.mediaUrl);
    const io = req.app.get('io') as IOServer | undefined;
    io?.to(`convo:${convId}`).emit('new_message', msg);
    res.status(201).json(msg);
  } catch (e) {
    next(e);
  }
});

export default r;
