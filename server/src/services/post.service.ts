import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { extractHashtags, createOrUpdateHashtags, decrementHashtagCount } from './hashtag.service.js';
import type { NotificationType } from '@prisma/client';

type PostRow = {
  id: string;
  userId: string;
  caption: string | null;
  location: string | null;
  createdAt: Date;
  user: { username: string; fullName: string | null; avatarUrl: string | null };
  media: { id: string; mediaUrl: string; thumbUrl: string | null; mediaType: string; position: number }[];
  likes?: { userId: string }[];
  _count: { likes: number; comments: number };
};

function mapPost(row: PostRow, currentUserId?: string) {
  const media = [...row.media].sort((a, b) => a.position - b.position);
  const likeCount = row._count.likes;
  const commentCount = row._count.comments;
  const isLiked = currentUserId
    ? row.likes?.some((l) => l.userId === currentUserId) ?? false
    : false;

  return {
    id: row.id,
    userId: row.userId,
    caption: row.caption,
    location: row.location,
    createdAt: row.createdAt.toISOString(),
    user: row.user
      ? {
          username: row.user.username,
          fullName: row.user.fullName,
          avatarUrl: row.user.avatarUrl,
        }
      : null,
    post_media: media.map((m) => ({
      id: m.id,
      media_url: m.mediaUrl,
      thumb_url: m.thumbUrl,
      media_type: m.mediaType,
      position: m.position,
    })),
    likes: likeCount,
    comments: commentCount,
    isLiked,
  };
}

export async function listFeed(currentUserId: string, limit = 50, offset = 0) {
  const following = await prisma.follow.findMany({
    where: { followerId: currentUserId, status: 'accepted' },
    select: { followingId: true },
  });
  const ids = [...new Set([currentUserId, ...following.map((f) => f.followingId)])];

  const rows = await prisma.post.findMany({
    where: { userId: { in: ids } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      user: true,
      media: true,
      likes: { where: { userId: currentUserId }, select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return rows.map((r) => mapPost(r as PostRow, currentUserId)).filter(Boolean);
}

export async function listExplore(limit = 50, offset = 0, currentUserId?: string) {
  const rows = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      user: true,
      media: true,
      ...(currentUserId
        ? { likes: { where: { userId: currentUserId }, select: { userId: true } } }
        : {}),
      _count: { select: { likes: true, comments: true } },
    },
  });

  return rows.map((r) => mapPost(r as PostRow, currentUserId)).filter(Boolean);
}

export async function createPost(
  userId: string,
  data: { caption?: string; location?: string; mediaUrls: string[] }
) {
  // Extract and create hashtags
  const extractedTags = extractHashtags(data.caption || '');
  const hashtagIds = await createOrUpdateHashtags(extractedTags);

  const post = await prisma.post.create({
    data: {
      userId,
      caption: data.caption,
      location: data.location,
      media: {
        create: data.mediaUrls.map((url, i) => ({
          mediaUrl: url,
          mediaType: 'image',
          position: i,
        })),
      },
      ...(hashtagIds.length > 0 && {
        hashtags: {
          create: hashtagIds.map((id) => ({ hashtagId: id })),
        },
      }),
    },
    include: {
      user: true,
      media: true,
      likes: { where: { userId }, select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
  return mapPost(post as PostRow, userId);
}

export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findFirst({ 
    where: { id: postId, userId },
    include: { hashtags: { select: { hashtag: { select: { tag: true } } } } }
  });
  if (!post) throw new HttpError(404, 'Post not found');
  
  // Decrement hashtag counts
  const tags = post.hashtags.map(h => h.hashtag.tag);
  if (tags.length > 0) {
    await decrementHashtagCount(tags);
  }
  
  await prisma.post.delete({ where: { id: postId } });
}

export async function toggleLike(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new HttpError(404, 'Post not found');

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  await prisma.like.create({ data: { userId, postId } });

  if (post.userId !== userId) {
    await prisma.notification.create({
      data: {
        userId: post.userId,
        actorId: userId,
        type: 'like' as NotificationType,
        postId,
      },
    });
  }

  return { liked: true };
}

export async function listComments(postId: string) {
  const rows = await prisma.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      replies: {
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    user_id: c.userId,
    content: c.content,
    created_at: c.createdAt.toISOString(),
    parent_id: c.parentId,
    profiles: c.user
      ? { username: c.user.username, avatar_url: c.user.avatarUrl }
      : null,
    replies: c.replies.map((r) => ({
      id: r.id,
      user_id: r.userId,
      content: r.content,
      created_at: r.createdAt.toISOString(),
      profiles: r.user
        ? { username: r.user.username, avatar_url: r.user.avatarUrl }
        : null,
    })),
  }));
}

export async function addComment(
  userId: string,
  postId: string,
  content: string,
  parentId?: string
) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new HttpError(404, 'Post not found');

  const comment = await prisma.comment.create({
    data: { userId, postId, content, parentId: parentId ?? null },
    include: { user: true },
  });

  if (post.userId !== userId) {
    await prisma.notification.create({
      data: {
        userId: post.userId,
        actorId: userId,
        type: 'comment',
        postId,
        commentId: comment.id,
      },
    });
  }

  return {
    id: comment.id,
    user_id: comment.userId,
    content: comment.content,
    created_at: comment.createdAt.toISOString(),
    profiles: comment.user
      ? { username: comment.user.username, avatar_url: comment.user.avatarUrl }
      : null,
  };
}

export async function getUserPosts(profileId: string, currentUserId?: string, limit = 50) {
  const rows = await prisma.post.findMany({
    where: { userId: profileId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: true,
      media: true,
      likes: currentUserId
        ? { where: { userId: currentUserId }, select: { userId: true } }
        : false,
      _count: { select: { likes: true, comments: true } },
    },
  });
  return rows.map((r) => mapPost(r as PostRow, currentUserId)).filter(Boolean);
}

export async function usernameAvailable(username: string) {
  const u = await prisma.profile.findUnique({
    where: { username: username.toLowerCase() },
  });
  return { available: !u };
}
