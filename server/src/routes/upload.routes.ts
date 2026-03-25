import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

const uploadDir = path.resolve(env.UPLOAD_DIR);
const thumbDir = path.join(uploadDir, 'thumbs');
fs.mkdirSync(thumbDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    if (!ok) return cb(new Error('Only image uploads allowed'));
    cb(null, true);
  },
});

const r = Router();

function publicUrl(req: import('express').Request, filename: string) {
  const base = env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
}

r.post('/', requireAuth, upload.single('file'), async (req: AuthedRequest, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'No file');
    const filename = req.file.filename;
    const fullPath = path.join(uploadDir, filename);
    const thumbName = `thumb-${filename.replace(/\.[^.]+$/, '')}.webp`;
    const thumbPath = path.join(thumbDir, thumbName);

    await sharp(fullPath)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    const base = env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.json({
      url: publicUrl(req, filename),
      thumbnailUrl: `${base}/uploads/thumbs/${thumbName}`,
    });
  } catch (e) {
    next(e);
  }
});

export default r;
