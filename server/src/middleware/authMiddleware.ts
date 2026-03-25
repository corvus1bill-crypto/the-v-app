import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { HttpError } from './errorHandler.js';

export type AuthedRequest = Request & {
  userId?: string;
  userRole?: string;
};

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing or invalid authorization');
    }
    const token = header.slice(7);
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();
    const payload = verifyToken(header.slice(7));
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    next();
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) return next(new HttpError(401, 'Unauthorized'));
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new HttpError(403, 'Forbidden'));
    }
    next();
  };
}
