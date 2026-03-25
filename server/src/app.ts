import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import type { Socket } from 'socket.io';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { openApiSpec } from './openapi/spec.js';
import authRoutes from './routes/auth.routes.js';
import postsRoutes from './routes/posts.routes.js';
import usersRoutes from './routes/users.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import hashtagRoutes from './routes/hashtags.routes.js';
import { verifyToken } from './utils/jwt.js';

export function createApp() {
  const app = express();
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    })
  );

  const corsOrigins =
    env.CORS_ORIGIN === '*'
      ? true
      : env.CORS_ORIGIN.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  if (env.FORCE_HTTPS === 'true') {
    app.use((req, res, next) => {
      const proto = req.headers['x-forwarded-proto'];
      if (proto && proto !== 'https') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }

  const uploadDir = path.resolve(env.UPLOAD_DIR);
  fs.mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many auth attempts, try again later' },
  });

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests' },
  });

  const strictLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many uploads' },
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec as object));

  app.use('/api/v1/auth', authLimiter, authRoutes);
  app.use('/api/v1/posts', apiLimiter, postsRoutes);
  app.use('/api/v1/users', apiLimiter, usersRoutes);
  app.use('/api/v1/messages', apiLimiter, messagesRoutes);
  app.use('/api/v1/notifications', apiLimiter, notificationsRoutes);
  app.use('/api/v1/hashtags', apiLimiter, hashtagRoutes);
  app.use('/api/v1/uploads', strictLimiter, uploadRoutes);

  app.use(errorHandler);

  return app;
}

/** Attach Socket.io to the HTTP server (call after createApp). */
export async function attachSocketIOAsync(
  httpServer: import('http').Server,
  app: ReturnType<typeof createApp>
) {
  const { Server: IOServer } = await import('socket.io');
  const io = new IOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        (typeof socket.handshake.headers.authorization === 'string' &&
        socket.handshake.headers.authorization.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : null);
      if (!token) return next(new Error('Unauthorized'));
      const p = verifyToken(token);
      (socket as Socket & { data: { userId: string } }).data = { userId: p.sub };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket & { data: { userId: string } }) => {
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`convo:${conversationId}`);
    });
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`convo:${conversationId}`);
    });
    socket.on('typing', (payload: { conversationId: string }) => {
      if (!payload?.conversationId) return;
      socket.to(`convo:${payload.conversationId}`).emit('typing', {
        conversationId: payload.conversationId,
        userId: socket.data.userId,
      });
    });
  });

  app.set('io', io);
  return io;
}
