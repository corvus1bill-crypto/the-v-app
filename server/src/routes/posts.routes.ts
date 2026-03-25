import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import { createPostSchema, createCommentSchema } from '../validation/schemas.js';
import * as posts from '../services/post.service.js';
import { paramString } from '../utils/params.js';

const r = Router();

const pagination = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

r.get('/feed', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const q = pagination.parse(req.query);
    const data = await posts.listFeed(req.userId!, q.limit ?? 50, q.offset ?? 0);
    res.json({ posts: data });
  } catch (e) {
    next(e);
  }
});

r.get('/explore', optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const q = pagination.parse(req.query);
    const data = await posts.listExplore(q.limit ?? 50, q.offset ?? 0, req.userId);
    res.json({ posts: data });
  } catch (e) {
    next(e);
  }
});

r.post('/', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = createPostSchema.parse(req.body);
    const post = await posts.createPost(req.userId!, body);
    res.status(201).json(post);
  } catch (e) {
    next(e);
  }
});

r.delete('/:postId', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    await posts.deletePost(paramString(req.params.postId), req.userId!);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

r.post('/:postId/like', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const out = await posts.toggleLike(paramString(req.params.postId), req.userId!);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

r.get('/:postId/comments', optionalAuth, async (req, res, next) => {
  try {
    const data = await posts.listComments(paramString(req.params.postId));
    res.json({ comments: data });
  } catch (e) {
    next(e);
  }
});

r.post('/:postId/comments', requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = createCommentSchema.parse(req.body);
    const c = await posts.addComment(
      req.userId!,
      paramString(req.params.postId),
      body.content,
      body.parentId
    );
    res.status(201).json(c);
  } catch (e) {
    next(e);
  }
});

export default r;
