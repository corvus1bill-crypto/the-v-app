import { Router } from 'express';
import * as hashtag from '../services/hashtag.service.js';

const r = Router();

// Search hashtags by query
r.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const results = await hashtag.searchHashtags(q, limit);
    res.json({ hashtags: results });
  } catch (e) {
    next(e);
  }
});

// Get trending hashtags
r.get('/trending', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const results = await hashtag.getTrendingHashtags(limit);
    res.json({ hashtags: results });
  } catch (e) {
    next(e);
  }
});

// Get posts for a specific hashtag
r.get('/:hashtagId/posts', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const data = await hashtag.getHashtagPosts(req.params.hashtagId, limit, offset);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default r;
