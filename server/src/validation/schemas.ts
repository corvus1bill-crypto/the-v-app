import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createPostSchema = z.object({
  caption: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  mediaUrls: z.array(z.string().url().max(2048)).max(10).default([]),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(8000).optional(),
  mediaUrl: z.string().url().max(2048).optional(),
}).refine((d) => d.content || d.mediaUrl, { message: 'content or mediaUrl required' });

export const createCommentSchema = z.object({
  content: z.string().min(1).max(4000),
  parentId: z.string().uuid().optional(),
});
