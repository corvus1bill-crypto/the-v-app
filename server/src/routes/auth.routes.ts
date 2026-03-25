import { Router } from 'express';
import { registerSchema, loginSchema } from '../validation/schemas.js';
import * as auth from '../services/auth.service.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';

const r = Router();

r.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const out = await auth.registerUser(body.email, body.password, body.username);
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
});

r.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const out = await auth.loginUser(body.email, body.password);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

r.get('/me', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const me = await auth.getMe(req.userId!);
    res.json(me);
  } catch (e) {
    next(e);
  }
});

export default r;
