import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import type { NotificationType } from '@prisma/client';

export async function findOrCreateConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) throw new HttpError(400, 'Cannot message yourself');

  const other = await prisma.profile.findUnique({ where: { id: otherUserId } });
  if (!other) throw new HttpError(404, 'User not found');

  const existing = await prisma.conversationParticipant.findMany({
    where: { userId: { in: [userId, otherUserId] } },
    select: { conversationId: true, userId: true },
  });

  const byConvo = new Map<string, Set<string>>();
  for (const row of existing) {
    if (!byConvo.has(row.conversationId)) byConvo.set(row.conversationId, new Set());
    byConvo.get(row.conversationId)!.add(row.userId);
  }

  for (const [convoId, set] of byConvo) {
    if (set.has(userId) && set.has(otherUserId)) {
      return { id: convoId };
    }
  }

  const conv = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
  });

  return { id: conv.id };
}

export async function listConversations(userId: string) {
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });
  const convoIds = parts.map((p) => p.conversationId);

  const convos = await prisma.conversation.findMany({
    where: { id: { in: convoIds } },
    orderBy: { createdAt: 'desc' },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return convos.map((c) => {
    const other = c.participants.map((p) => p.user).find((u) => u.id !== userId);
    const last = c.messages[0];
    return {
      id: c.id,
      otherUserId: other?.id,
      username: other?.username ?? 'unknown',
      avatarUrl: other?.avatarUrl,
      lastMessage: last?.content || last?.mediaUrl || '',
      lastAt: last?.createdAt.toISOString() ?? c.createdAt.toISOString(),
    };
  });
}

export async function listMessages(conversationId: string, userId: string, limit = 50, offset = 0) {
  const member = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
  });
  if (!member) throw new HttpError(403, 'Not a participant');

  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: { sender: true },
  });

  return [...rows].reverse().map((m) => ({
    id: m.id,
    conversation_id: m.conversationId,
    sender_id: m.senderId,
    content: m.content,
    media_url: m.mediaUrl,
    seen: m.seen,
    created_at: m.createdAt.toISOString(),
    profiles: m.sender
      ? { username: m.sender.username, avatar_url: m.sender.avatarUrl, id: m.sender.id }
      : null,
  }));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content?: string,
  mediaUrl?: string
) {
  const member = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: senderId },
  });
  if (!member) throw new HttpError(403, 'Not a participant');

  const msg = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: content ?? null,
      mediaUrl: mediaUrl ?? null,
    },
    include: { sender: true },
  });

  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId, NOT: { userId: senderId } },
    select: { userId: true },
  });

  for (const o of others) {
    await prisma.notification.create({
      data: {
        userId: o.userId,
        actorId: senderId,
        type: 'message' as NotificationType,
      },
    });
  }

  return {
    id: msg.id,
    conversation_id: msg.conversationId,
    sender_id: msg.senderId,
    content: msg.content,
    media_url: msg.mediaUrl,
    seen: msg.seen,
    created_at: msg.createdAt.toISOString(),
    profiles: msg.sender
      ? { username: msg.sender.username, avatar_url: msg.sender.avatarUrl, id: msg.sender.id }
      : null,
  };
}
