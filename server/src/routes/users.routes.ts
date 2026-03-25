import { Router } from 'express';
import { z } from 'zod';
import type { NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth, optionalAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import { HttpError } from '../middleware/errorHandler.js';
import * as posts from '../services/post.service.js';
import { paramString } from '../utils/params.js';

const r = Router();

r.get('/username/check/:username', async (req, res, next) => {
  try {
    const username = req.params.username || '';
    if (username.length < 1) throw new HttpError(400, 'Invalid username');
    const out = await posts.usernameAvailable(username);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

r.get('/profile/:userId', async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: paramString(req.params.userId) },
    });
    if (!profile) throw new HttpError(404, 'Profile not found');
    res.json({
      id: profile.id,
      username: profile.username,
      username_display: profile.username,
      bio: profile.bio ?? '',
      avatar: profile.avatarUrl ?? '',
      website: profile.website ?? '',
    });
  } catch (e) {
    next(e);
  }
});

const updateProfileSchema = z.object({
  fullName: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().max(2048).optional(),
  website: z.string().url().max(500).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});

r.get('/:userId/followers/count', async (req, res, next) => {
  try {
    const uid = paramString(req.params.userId);
    const count = await prisma.follow.count({ where: { followingId: uid } });
    res.json({ count });
  } catch (e) {
    next(e);
  }
});

r.get('/:userId/following', async (req, res, next) => {
  try {
    const uid = paramString(req.params.userId);
    const rows = await prisma.follow.findMany({
      where: { followerId: uid, status: 'accepted' },
      include: { following: true },
    });
    res.json(
      rows.map((r) => ({
        id: r.following.id,
        username: r.following.username,
        name: r.following.fullName || r.following.username,
        avatar: r.following.avatarUrl || '',
        bio: r.following.bio || '',
      }))
    );
  } catch (e) {
    next(e);
  }
});

r.patch('/me', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const uid = req.userId!;

    if (body.username) {
      const taken = await prisma.profile.findFirst({
        where: { username: body.username.toLowerCase(), NOT: { id: uid } },
      });
      if (taken) throw new HttpError(409, 'Username taken');
    }

    const profile = await prisma.profile.update({
      where: { id: uid },
      data: {
        fullName: body.fullName,
        bio: body.bio,
        avatarUrl: body.avatarUrl,
        website: body.website,
        username: body.username?.toLowerCase(),
      },
    });

    res.json({
      id: profile.id,
      username: profile.username,
      bio: profile.bio,
      avatar: profile.avatarUrl,
      website: profile.website,
    });
  } catch (e) {
    next(e);
  }
});

r.post('/:userId/follow', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const followerId = req.userId!;
    const followingId = paramString(req.params.userId);
    if (followerId === followingId) throw new HttpError(400, 'Cannot follow yourself');

    const target = await prisma.profile.findUnique({ where: { id: followingId } });
    if (!target) throw new HttpError(404, 'User not found');

    const already = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!already) {
      await prisma.follow.create({
        data: { followerId, followingId, status: 'accepted' },
      });
      await prisma.notification.create({
        data: {
          userId: followingId,
          actorId: followerId,
          type: 'follow' as NotificationType,
        },
      });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

r.delete('/:userId/follow', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const followerId = req.userId!;
    const followingId = paramString(req.params.userId);
    await prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

r.get('/:userId/posts', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const data = await posts.getUserPosts(paramString(req.params.userId), req.userId, limit);
    res.json({ posts: data });
  } catch (e) {
    next(e);
  }
});

export default r;
