import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';

const HASHTAG_REGEX = /#[\w]+/g;

export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(HASHTAG_REGEX) || [];
  return matches
    .map((tag) => tag.slice(1).toLowerCase()) // Remove '#' and lowercase
    .filter((tag, index, arr) => arr.indexOf(tag) === index); // Deduplicate
}

export async function createOrUpdateHashtags(hashtags: string[]): Promise<string[]> {
  if (!hashtags.length) return [];

  const tagIds: string[] = [];

  for (const tag of hashtags) {
    const normalized = tag.toLowerCase();
    let hashtag = await prisma.hashtag.findUnique({
      where: { tag: normalized },
    });

    if (!hashtag) {
      hashtag = await prisma.hashtag.create({
        data: { tag: normalized, postCount: 1 },
      });
    } else {
      // Increment post count
      await prisma.hashtag.update({
        where: { id: hashtag.id },
        data: { postCount: { increment: 1 } },
      });
    }

    tagIds.push(hashtag.id);
  }

  return tagIds;
}

export async function searchHashtags(query: string, limit = 20) {
  if (!query || query.length < 1) {
    return await prisma.hashtag.findMany({
      orderBy: { postCount: 'desc' },
      take: limit,
      select: { id: true, tag: true, postCount: true },
    });
  }

  const searchTerm = query.toLowerCase();
  return await prisma.hashtag.findMany({
    where: {
      tag: { contains: searchTerm },
    },
    orderBy: { postCount: 'desc' },
    take: limit,
    select: { id: true, tag: true, postCount: true },
  });
}

export async function getTrendingHashtags(limit = 20) {
  return await prisma.hashtag.findMany({
    orderBy: { postCount: 'desc' },
    take: limit,
    select: { id: true, tag: true, postCount: true },
  });
}

export async function getHashtagPosts(hashtagId: string, limit = 50, offset = 0) {
  const hashtag = await prisma.hashtag.findUnique({
    where: { id: hashtagId },
  });
  if (!hashtag) throw new HttpError(404, 'Hashtag not found');

  const posts = await prisma.post.findMany({
    where: {
      hashtags: {
        some: { hashtagId },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      media: {
        orderBy: { position: 'asc' },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  return {
    hashtag: { id: hashtag.id, tag: hashtag.tag, postCount: hashtag.postCount },
    posts: posts.map((p) => ({
      id: p.id,
      userId: p.userId,
      caption: p.caption,
      location: p.location,
      createdAt: p.createdAt,
      user: p.user,
      media: p.media,
      likes: p._count.likes,
      comments: p._count.comments,
    })),
  };
}

export async function decrementHashtagCount(hashtags: string[]) {
  for (const tag of hashtags) {
    const hashtag = await prisma.hashtag.findUnique({
      where: { tag: tag.toLowerCase() },
    });
    if (hashtag) {
      const newCount = Math.max(0, hashtag.postCount - 1);
      if (newCount === 0) {
        await prisma.hashtag.delete({ where: { id: hashtag.id } });
      } else {
        await prisma.hashtag.update({
          where: { id: hashtag.id },
          data: { postCount: newCount },
        });
      }
    }
  }
}
